'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Waveform, MiniWaveform } from '@/components/Waveform';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useLanguage } from '@/contexts/LanguageContext';
import { speechService } from '@/lib/speechService';
import { geminiService } from '@/lib/geminiService';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceAssistantProps {
  onTranscript?: (transcript: string) => void;
  onResponse?: (response: string) => void;
  onConversationUpdate?: (conversation: ConversationEntry[]) => void;
  initialPrompt?: string;
  context?: string;
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  autoSpeak?: boolean;
  showTranscript?: boolean;
  showWaveform?: boolean;
}

interface ConversationEntry {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export function VoiceAssistant({
  onTranscript,
  onResponse,
  onConversationUpdate,
  initialPrompt,
  context,
  className = '',
  variant = 'full',
  autoSpeak = true,
  showTranscript = true,
  showWaveform = true,
}: VoiceAssistantProps) {
  const { currentLanguage } = useLanguage();
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voiceRecording = useVoiceRecording({
    maxDuration: 60, // 1 minute max
    autoTranscribe: true,
    onRecordingComplete: handleRecordingComplete,
    onTranscriptUpdate: handleTranscriptUpdate,
  });

  // Initialize with welcome message
  useEffect(() => {
    if (initialPrompt && conversation.length === 0) {
      handleInitialPrompt();
    }
  }, [initialPrompt]);

  const handleInitialPrompt = async () => {
    if (!initialPrompt) return;

    try {
      setIsProcessing(true);
      const response = await geminiService.generateConversationalResponse(
        initialPrompt,
        context,
        [],
        currentLanguage.code
      );

      const assistantEntry: ConversationEntry = {
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setConversation([assistantEntry]);
      onConversationUpdate?.([assistantEntry]);

      if (autoSpeak) {
        await speakText(response);
      }
    } catch (error) {
      console.error('Error with initial prompt:', error);
      toast.error('Failed to initialize voice assistant');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranscriptUpdate = useCallback((transcript: string) => {
    onTranscript?.(transcript);
  }, [onTranscript]);

  const handleRecordingComplete = useCallback(async (
    audioBlob: Blob,
    audioDataUri: string,
    transcript?: string
  ) => {
    if (!transcript || transcript.trim() === '') {
      toast.error('No speech detected. Please try again.');
      return;
    }

    // Add user message to conversation
    const userEntry: ConversationEntry = {
      type: 'user',
      content: transcript,
      timestamp: new Date(),
      audioUrl: audioDataUri,
    };

    const updatedConversation = [...conversation, userEntry];
    setConversation(updatedConversation);

    try {
      setIsProcessing(true);
      
      // Get AI response
      const response = await geminiService.generateConversationalResponse(
        transcript,
        context,
        updatedConversation,
        currentLanguage.code
      );

      const assistantEntry: ConversationEntry = {
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      const finalConversation = [...updatedConversation, assistantEntry];
      setConversation(finalConversation);
      onConversationUpdate?.(finalConversation);
      onResponse?.(response);

      // Speak the response
      if (autoSpeak) {
        await speakText(response);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast.error('Failed to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [conversation, context, currentLanguage.code, autoSpeak, onConversationUpdate, onResponse]);

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audioDataUri = await speechService.textToSpeech(text, currentLanguage.ttsCode);
      const audio = new Audio(audioDataUri);
      
      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        toast.error('Failed to play audio response');
      };

      setCurrentAudio(audio);
      await audio.play();
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
      toast.error('Failed to generate speech');
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    setIsListening(true);
    voiceRecording.startRecording();
  };

  const stopListening = () => {
    setIsListening(false);
    voiceRecording.stopRecording();
  };

  const clearConversation = () => {
    setConversation([]);
    onConversationUpdate?.([]);
    stopSpeaking();
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          onClick={voiceRecording.isRecording ? stopListening : startListening}
          disabled={isProcessing || isSpeaking}
          size="sm"
          variant={voiceRecording.isRecording ? 'destructive' : 'default'}
          className="bg-gold hover:bg-gold-light text-charcoal"
        >
          {voiceRecording.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        
        {showWaveform && (
          <MiniWaveform
            isRecording={voiceRecording.isRecording}
            audioLevel={voiceRecording.audioLevel}
            className="flex-1"
          />
        )}
        
        {(isProcessing || isSpeaking) && (
          <Loader2 className="w-4 h-4 animate-spin text-gold" />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-cream rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-charcoal">Voice Assistant</h3>
          <div className="flex items-center space-x-2">
            {isSpeaking && (
              <Button onClick={stopSpeaking} size="sm" variant="outline">
                <VolumeX className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={voiceRecording.isRecording ? stopListening : startListening}
              disabled={isProcessing}
              size="sm"
              variant={voiceRecording.isRecording ? 'destructive' : 'default'}
              className="bg-gold hover:bg-gold-light text-charcoal"
            >
              {voiceRecording.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {showWaveform && (
          <Waveform
            isRecording={voiceRecording.isRecording}
            audioData={[]}
            height={40}
            className="mb-4"
          />
        )}

        {showTranscript && voiceRecording.transcript && (
          <div className="bg-white rounded-lg p-3 mb-4">
            <p className="text-sm text-charcoal">{voiceRecording.transcript}</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gold mr-2" />
            <span className="text-brown">Processing...</span>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white rounded-2xl shadow-elevated p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-6 h-6 text-gold" />
          <h2 className="text-xl font-semibold text-charcoal">Voice Assistant</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {conversation.length > 0 && (
            <Button onClick={clearConversation} size="sm" variant="outline">
              Clear
            </Button>
          )}
          {isSpeaking && (
            <Button onClick={stopSpeaking} size="sm" variant="outline">
              <VolumeX className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="mb-6 max-h-64 overflow-y-auto space-y-3">
          {conversation.map((entry, index) => (
            <div
              key={index}
              className={`flex ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  entry.type === 'user'
                    ? 'bg-gold text-charcoal'
                    : 'bg-beige text-charcoal'
                }`}
              >
                <p className="text-sm">{entry.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-70">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                  {entry.type === 'assistant' && (
                    <Button
                      onClick={() => speakText(entry.content)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Volume2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Voice Recording Interface */}
      <div className="space-y-4">
        {showWaveform && (
          <Waveform
            isRecording={voiceRecording.isRecording}
            audioData={[]}
            height={60}
          />
        )}

        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={voiceRecording.isRecording ? stopListening : startListening}
            disabled={isProcessing || isSpeaking}
            size="lg"
            variant={voiceRecording.isRecording ? 'destructive' : 'default'}
            className={voiceRecording.isRecording ? '' : 'bg-gold hover:bg-gold-light text-charcoal'}
          >
            {voiceRecording.isRecording ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        {showTranscript && voiceRecording.transcript && (
          <div className="bg-beige rounded-lg p-4">
            <h4 className="text-sm font-medium text-charcoal mb-2">Transcript:</h4>
            <p className="text-charcoal">{voiceRecording.transcript}</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gold mr-2" />
            <span className="text-brown">Processing your message...</span>
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-center justify-center py-2">
            <Volume2 className="w-5 h-5 text-gold mr-2 animate-pulse" />
            <span className="text-brown">Speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
}