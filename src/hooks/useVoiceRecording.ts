/**
 * Custom hook for voice recording functionality
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { audioService } from '@/lib/audioService';
import { speechService } from '@/lib/speechService';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  hasPermission: boolean | null;
  isProcessing: boolean;
  transcript: string;
  audioBlob: Blob | null;
  audioDataUri: string;
  error: string | null;
}

export interface VoiceRecordingOptions {
  maxDuration?: number;
  autoTranscribe?: boolean;
  enableNoiseReduction?: boolean;
  enableNormalization?: boolean;
  onTranscriptUpdate?: (transcript: string) => void;
  onRecordingComplete?: (audioBlob: Blob, audioDataUri: string, transcript?: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecording(options: VoiceRecordingOptions = {}) {
  const {
    maxDuration = 300,
    autoTranscribe = true,
    enableNoiseReduction = true,
    enableNormalization = true,
    onTranscriptUpdate,
    onRecordingComplete,
    onError,
  } = options;

  const { currentLanguage } = useLanguage();
  
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
    hasPermission: null,
    isProcessing: false,
    transcript: '',
    audioBlob: null,
    audioDataUri: '',
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (error) {
      const errorMessage = 'Microphone access denied';
      setState(prev => ({ ...prev, hasPermission: false, error: errorMessage }));
      onError?.(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [onError]);

  const setupAudioContext = useCallback(() => {
    if (!streamRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }
  }, []);

  const startAudioLevelMonitoring = useCallback(() => {
    if (!analyserRef.current) return;

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;

      setState(prev => ({ ...prev, audioLevel: normalizedLevel }));

      if (state.isRecording && !state.isPaused) {
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  }, [state.isRecording, state.isPaused]);

  const startDurationTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setState(prev => {
        const newDuration = prev.duration + 1;
        if (newDuration >= maxDuration) {
          stopRecording();
          toast.warning(`Maximum recording duration (${maxDuration}s) reached`);
        }
        return { ...prev, duration: newDuration };
      });
    }, 1000);
  }, [maxDuration]);

  const stopDurationTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob): Promise<Blob> => {
    let processedBlob = audioBlob;

    try {
      if (enableNoiseReduction) {
        processedBlob = await audioService.reduceNoise(processedBlob);
      }

      if (enableNormalization) {
        processedBlob = await audioService.normalizeAudio(processedBlob);
      }

      return processedBlob;
    } catch (error) {
      console.error('Error processing audio:', error);
      return audioBlob; // Return original if processing fails
    }
  }, [enableNoiseReduction, enableNormalization]);

  const transcribeAudio = useCallback(async (audioDataUri: string): Promise<string> => {
    if (!autoTranscribe) return '';

    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      const transcript = await speechService.speechToText(audioDataUri, currentLanguage.speechCode);
      setState(prev => ({ ...prev, transcript, isProcessing: false }));
      onTranscriptUpdate?.(transcript);
      return transcript;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      return '';
    }
  }, [autoTranscribe, currentLanguage.speechCode, onTranscriptUpdate]);

  const startRecording = useCallback(async () => {
    try {
      if (!state.hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      if (!streamRef.current) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      setupAudioContext();

      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const processedBlob = await processAudio(audioBlob);
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          const transcript = await transcribeAudio(audioDataUri);
          
          setState(prev => ({
            ...prev,
            audioBlob: processedBlob,
            audioDataUri,
            transcript,
          }));

          onRecordingComplete?.(processedBlob, audioDataUri, transcript);
        };
        reader.readAsDataURL(processedBlob);
      };

      mediaRecorder.start(100);
      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      }));

      startDurationTimer();
      startAudioLevelMonitoring();
      
      toast.success('Recording started');
    } catch (error) {
      const errorMessage = 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [
    state.hasPermission,
    requestPermission,
    setupAudioContext,
    processAudio,
    transcribeAudio,
    startDurationTimer,
    startAudioLevelMonitoring,
    onRecordingComplete,
    onError,
  ]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      audioLevel: 0,
    }));

    stopDurationTimer();
    cleanup();
    
    toast.success('Recording completed');
  }, [stopDurationTimer, cleanup]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      stopDurationTimer();
      toast.info('Recording paused');
    }
  }, [stopDurationTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      startDurationTimer();
      startAudioLevelMonitoring();
      toast.info('Recording resumed');
    }
  }, [startDurationTimer, startAudioLevelMonitoring]);

  const resetRecording = useCallback(() => {
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioLevel: 0,
      hasPermission: state.hasPermission,
      isProcessing: false,
      transcript: '',
      audioBlob: null,
      audioDataUri: '',
      error: null,
    });
    cleanup();
  }, [state.hasPermission, cleanup]);

  const retranscribe = useCallback(async () => {
    if (!state.audioDataUri) return;
    
    setState(prev => ({ ...prev, isProcessing: true, transcript: '' }));
    const transcript = await transcribeAudio(state.audioDataUri);
    setState(prev => ({ ...prev, transcript, isProcessing: false }));
  }, [state.audioDataUri, transcribeAudio]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    retranscribe,
    requestPermission,
    isSupported: audioService.isRecordingSupported(),
    supportedFormats: audioService.getSupportedFormats(),
  };
}