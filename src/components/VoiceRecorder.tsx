'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioDataUri: string) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  isRecording?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export function VoiceRecorder({
  onRecordingComplete,
  onTranscriptUpdate,
  isRecording: externalIsRecording,
  onRecordingStateChange,
  maxDuration = 300, // 5 minutes default
  className = '',
}: VoiceRecorderProps) {
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const isRecording = externalIsRecording ?? internalIsRecording;

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      startDurationTimer();
      startAudioLevelMonitoring();
    } else {
      stopDurationTimer();
      stopAudioLevelMonitoring();
    }
  }, [isRecording, isPaused]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    stopDurationTimer();
    stopAudioLevelMonitoring();
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      toast.error('Microphone access is required for voice recording');
      return false;
    }
  };

  const setupAudioContext = () => {
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
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      }

      if (!streamRef.current) {
        const granted = await requestMicrophonePermission();
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const audioDataUri = reader.result as string;
          onRecordingComplete(audioBlob, audioDataUri);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setInternalIsRecording(true);
      onRecordingStateChange?.(true);
      setDuration(0);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setInternalIsRecording(false);
    setIsPaused(false);
    onRecordingStateChange?.(false);
    cleanup();
    
    toast.success('Recording completed');
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      toast.info('Recording paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      toast.info('Recording resumed');
    }
  };

  const startDurationTimer = () => {
    intervalRef.current = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        if (newDuration >= maxDuration) {
          stopRecording();
          toast.warning(`Maximum recording duration (${maxDuration}s) reached`);
        }
        return newDuration;
      });
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255); // Normalize to 0-1

      if (isRecording && !isPaused) {
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  };

  const stopAudioLevelMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAudioLevel(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className={`text-center p-6 bg-beige rounded-lg ${className}`}>
        <MicOff className="w-12 h-12 text-brown mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-charcoal mb-2">Microphone Access Required</h3>
        <p className="text-brown mb-4">
          Please allow microphone access to use voice recording features.
        </p>
        <Button onClick={requestMicrophonePermission} className="bg-gold hover:bg-gold-light text-charcoal">
          <Mic className="w-4 h-4 mr-2" />
          Enable Microphone
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            size="lg"
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            {!isPaused ? (
              <Button
                onClick={pauseRecording}
                variant="outline"
                size="lg"
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={resumeRecording}
                size="lg"
                className="bg-gold hover:bg-gold-light text-charcoal"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            )}
            
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </div>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-charcoal font-medium">
              {isPaused ? 'Paused' : 'Recording'} - {formatDuration(duration)}
            </span>
          </div>
          
          {/* Audio Level Indicator */}
          <div className="w-full max-w-xs mx-auto">
            <div className="h-2 bg-beige rounded-full overflow-hidden">
              <div 
                className="h-full bg-gold transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <p className="text-xs text-brown mt-1">Audio Level</p>
          </div>
        </div>
      )}

      {/* Duration Warning */}
      {isRecording && duration > maxDuration * 0.8 && (
        <div className="text-center p-2 bg-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            Recording will stop automatically at {formatDuration(maxDuration)}
          </p>
        </div>
      )}
    </div>
  );
}