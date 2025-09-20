'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { Mic, MicOff, Square, Play, Pause, RotateCcw } from 'lucide-react';
import { Waveform } from '@/components/Waveform';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioDataUri: string, transcript?: string) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  maxDuration?: number;
  autoTranscribe?: boolean;
  showWaveform?: boolean;
  showTranscript?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export function VoiceRecorder({
  onRecordingComplete,
  onTranscriptUpdate,
  maxDuration = 300,
  autoTranscribe = true,
  showWaveform = true,
  showTranscript = true,
  className = '',
  variant = 'default',
}: VoiceRecorderProps) {
  const voiceRecording = useVoiceRecording({
    maxDuration,
    autoTranscribe,
    onRecordingComplete,
    onTranscriptUpdate,
  });

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!voiceRecording.isSupported) {
    return (
      <div className={`text-center p-6 bg-beige rounded-lg ${className}`}>
        <MicOff className="w-12 h-12 text-brown mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-charcoal mb-2">Recording Not Supported</h3>
        <p className="text-brown">
          Your browser doesn't support audio recording. Please use a modern browser.
        </p>
      </div>
    );
  }

  if (voiceRecording.hasPermission === false) {
    return (
      <div className={`text-center p-6 bg-beige rounded-lg ${className}`}>
        <MicOff className="w-12 h-12 text-brown mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-charcoal mb-2">Microphone Access Required</h3>
        <p className="text-brown mb-4">
          Please allow microphone access to use voice recording features.
        </p>
        <Button 
          onClick={voiceRecording.requestPermission} 
          className="bg-gold hover:bg-gold-light text-charcoal"
        >
          <Mic className="w-4 h-4 mr-2" />
          Enable Microphone
        </Button>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          onClick={voiceRecording.isRecording ? voiceRecording.stopRecording : voiceRecording.startRecording}
          disabled={voiceRecording.isProcessing}
          size="sm"
          variant={voiceRecording.isRecording ? 'destructive' : 'default'}
          className={voiceRecording.isRecording ? '' : 'bg-gold hover:bg-gold-light text-charcoal'}
        >
          {voiceRecording.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        
        {voiceRecording.isRecording && (
          <span className="text-sm text-charcoal">
            {formatDuration(voiceRecording.duration)}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-cream rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-charcoal">Voice Recorder</h3>
          {voiceRecording.audioBlob && (
            <Button onClick={voiceRecording.resetRecording} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {showWaveform && (
          <Waveform
            isRecording={voiceRecording.isRecording}
            audioData={[]}
            height={40}
            className="mb-4"
          />
        )}

        <div className="flex items-center justify-center space-x-2">
          {!voiceRecording.isRecording ? (
            <Button
              onClick={voiceRecording.startRecording}
              disabled={voiceRecording.isProcessing}
              className="bg-gold hover:bg-gold-light text-charcoal"
            >
              <Mic className="w-4 h-4 mr-2" />
              Record
            </Button>
          ) : (
            <>
              {!voiceRecording.isPaused ? (
                <Button onClick={voiceRecording.pauseRecording} variant="outline">
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={voiceRecording.resumeRecording} className="bg-gold hover:bg-gold-light text-charcoal">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button onClick={voiceRecording.stopRecording} variant="destructive">
                <Square className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {voiceRecording.isRecording && (
          <div className="text-center mt-2">
            <span className="text-sm text-charcoal">
              {voiceRecording.isPaused ? 'Paused' : 'Recording'} - {formatDuration(voiceRecording.duration)}
            </span>
          </div>
        )}

        {showTranscript && voiceRecording.transcript && (
          <div className="mt-4 p-3 bg-white rounded-lg">
            <h4 className="text-sm font-medium text-charcoal mb-2">Transcript:</h4>
            <p className="text-sm text-charcoal">{voiceRecording.transcript}</p>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Waveform */}
      {showWaveform && (
        <Waveform
          isRecording={voiceRecording.isRecording}
          audioData={[]}
          height={80}
        />
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!voiceRecording.isRecording ? (
          <Button
            onClick={voiceRecording.startRecording}
            disabled={voiceRecording.isProcessing}
            size="lg"
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            {!voiceRecording.isPaused ? (
              <Button
                onClick={voiceRecording.pauseRecording}
                variant="outline"
                size="lg"
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={voiceRecording.resumeRecording}
                size="lg"
                className="bg-gold hover:bg-gold-light text-charcoal"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            )}
            
            <Button
              onClick={voiceRecording.stopRecording}
              variant="destructive"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </div>
        )}

        {voiceRecording.audioBlob && !voiceRecording.isRecording && (
          <Button onClick={voiceRecording.resetRecording} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Recording Status */}
      {voiceRecording.isRecording && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${voiceRecording.isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-charcoal font-medium">
              {voiceRecording.isPaused ? 'Paused' : 'Recording'} - {formatDuration(voiceRecording.duration)}
            </span>
          </div>
          
          {/* Audio Level Indicator */}
          <div className="w-full max-w-xs mx-auto">
            <div className="h-2 bg-beige rounded-full overflow-hidden">
              <div 
                className="h-full bg-gold transition-all duration-100"
                style={{ width: `${voiceRecording.audioLevel * 100}%` }}
              />
            </div>
            <p className="text-xs text-brown mt-1">Audio Level</p>
          </div>
        </div>
      )}

      {/* Transcript */}
      {showTranscript && voiceRecording.transcript && (
        <div className="bg-beige rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-charcoal">Transcript:</h4>
            {voiceRecording.audioDataUri && (
              <Button onClick={voiceRecording.retranscribe} size="sm" variant="outline">
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
          <p className="text-charcoal">{voiceRecording.transcript}</p>
        </div>
      )}

      {/* Processing Indicator */}
      {voiceRecording.isProcessing && (
        <div className="text-center p-4 bg-gold/10 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold mx-auto mb-2" />
          <p className="text-brown">Processing audio...</p>
        </div>
      )}

      {/* Duration Warning */}
      {voiceRecording.isRecording && voiceRecording.duration > maxDuration * 0.8 && (
        <div className="text-center p-2 bg-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            Recording will stop automatically at {formatDuration(maxDuration)}
          </p>
        </div>
      )}
    </div>
  );
}