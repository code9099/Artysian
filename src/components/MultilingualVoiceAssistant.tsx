'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Square, Play, Pause, RotateCcw, MessageCircle, Globe } from 'lucide-react';
import { speechService } from '@/lib/speechService';
import { geminiService } from '@/lib/geminiService';
import { INDIAN_LANGUAGES, getLanguageConfig } from '@/lib/languages';
import { toast } from 'sonner';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

interface MultilingualVoiceAssistantProps {
  initialLanguage?: string;
  onLanguageChange?: (language: string) => void;
  onConversationUpdate?: (messages: ConversationMessage[]) => void;
  context?: string; // Context for the conversation (e.g., "artisan_onboarding", "product_description")
  placeholder?: string;
}

export function MultilingualVoiceAssistant({
  initialLanguage = 'en',
  onLanguageChange,
  onConversationUpdate,
  context = 'general',
  placeholder = 'Start speaking to begin the conversation...'
}: MultilingualVoiceAssistantProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const languageConfig = getLanguageConfig(language);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setIsPlayingAudio(false);
      setCurrentPlayingId(null);
    };
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  // Update parent component when conversation changes
  useEffect(() => {
    if (onConversationUpdate) {
      onConversationUpdate(conversation);
    }
  }, [conversation, onConversationUpdate]);

  // Initialize conversation with greeting
  useEffect(() => {
    if (!isInitialized && languageConfig) {
      initializeConversation();
      setIsInitialized(true);
    }
  }, [languageConfig, isInitialized]);

  const initializeConversation = async () => {
    const greetingMessages = {
      'en': 'Hello! I\'m your AI assistant. I\'m here to help you with your craft story. How can I assist you today?',
      'hi': 'नमस्ते! मैं आपका AI सहायक हूँ। मैं आपकी शिल्प कहानी में आपकी मदद करने के लिए यहाँ हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?',
      'ta': 'வணக்கம்! நான் உங்கள் AI உதவியாளர். உங்கள் கைவினைக் கதையில் உங்களுக்கு உதவ நான் இங்கே இருக்கிறேன். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      'bn': 'নমস্কার! আমি আপনার AI সহায়ক। আমি আপনার কারুশিল্পের গল্পে সাহায্য করতে এখানে আছি। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?'
    };

    const greeting = greetingMessages[language as keyof typeof greetingMessages] || greetingMessages['en'];
    
    const assistantMessage: ConversationMessage = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      text: greeting,
      timestamp: new Date()
    };

    // Generate audio for greeting
    try {
      const audioUrl = await generateAudio(greeting);
      assistantMessage.audioUrl = audioUrl;
    } catch (error) {
      console.error('Failed to generate greeting audio:', error);
    }

    setConversation([assistantMessage]);
    
    // Auto-play greeting
    if (assistantMessage.audioUrl) {
      setTimeout(() => playAudio(assistantMessage.id, assistantMessage.audioUrl!), 500);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
    
    // Reinitialize conversation in new language
    setConversation([]);
    setIsInitialized(false);
    toast.success(`Language changed to ${getLanguageConfig(newLanguage)?.name}`);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setCurrentTranscript('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info('Recording started... Speak now!');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Recording stopped. Processing...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const audioData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      // Convert speech to text
      const transcript = await speechService.speechToText(audioData, languageConfig?.speechCode || 'en-US');
      
      if (!transcript.trim()) {
        throw new Error('No speech detected. Please try again.');
      }

      setCurrentTranscript(transcript);

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        text: transcript,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, userMessage]);

      // Generate AI response
      await generateResponse(transcript);

    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to process audio');
      toast.error('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateResponse = async (userInput: string) => {
    try {
      // Create context for the AI based on conversation history
      const conversationHistory = conversation.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');

      // Generate response using Gemini
      const response = await fetch('/api/gemini/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: userInput,
          languageCode: language,
          context: context,
          conversationHistory: conversationHistory,
          action: 'conversational_response'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      const aiResponse = data.response || 'I understand. Please tell me more.';

      // Add AI response to conversation
      const assistantMessage: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        text: aiResponse,
        timestamp: new Date()
      };

      // Generate audio for response
      try {
        const audioUrl = await generateAudio(aiResponse);
        assistantMessage.audioUrl = audioUrl;
      } catch (error) {
        console.error('Failed to generate response audio:', error);
      }

      setConversation(prev => [...prev, assistantMessage]);

      // Auto-play response
      if (assistantMessage.audioUrl) {
        setTimeout(() => playAudio(assistantMessage.id, assistantMessage.audioUrl!), 500);
      }

    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate response');
    }
  };

  const generateAudio = async (text: string): Promise<string> => {
    const response = await speechService.textToSpeech(text, languageConfig?.ttsCode || 'en-US');
    return response;
  };

  const playAudio = async (messageId: string, audioUrl: string) => {
    if (isPlayingAudio) {
      audioRef.current?.pause();
    }

    try {
      setIsPlayingAudio(true);
      setCurrentPlayingId(messageId);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      setCurrentPlayingId(null);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setCurrentPlayingId(null);
  };

  const clearConversation = () => {
    setConversation([]);
    setCurrentTranscript('');
    setError(null);
    setIsInitialized(false);
  };

  return (
    <div className="bg-cream rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-gold" />
          <h3 className="text-xl font-semibold text-charcoal font-serif">
            Voice Assistant
          </h3>
        </div>
        
        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-brown" />
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-beige border border-brown/20 rounded-lg px-3 py-1 text-sm text-charcoal"
          >
            {INDIAN_LANGUAGES.slice(0, 8).map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conversation Area */}
      <div 
        ref={conversationRef}
        className="h-96 overflow-y-auto bg-beige/30 rounded-lg p-4 mb-6 space-y-4"
      >
        {conversation.length === 0 ? (
          <div className="text-center text-brown/60 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{placeholder}</p>
          </div>
        ) : (
          conversation.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gold text-charcoal'
                    : 'bg-white text-charcoal border border-beige'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.audioUrl && message.type === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (currentPlayingId === message.id && isPlayingAudio) {
                          stopAudio();
                        } else {
                          playAudio(message.id, message.audioUrl!);
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      {currentPlayingId === message.id && isPlayingAudio ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white text-charcoal border border-beige px-4 py-3 rounded-2xl max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Transcript */}
      {currentTranscript && (
        <div className="mb-4 p-3 bg-gold/10 rounded-lg border border-gold/20">
          <p className="text-sm text-charcoal">
            <strong>You said:</strong> "{currentTranscript}"
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gold hover:bg-gold-light text-charcoal'
          } px-8 py-3`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Start Recording'}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={clearConversation}
          className="border-brown text-brown hover:bg-brown hover:text-cream"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-gold/10 rounded-lg border border-gold/20">
        <p className="text-xs text-brown text-center">
          💡 <strong>Tip:</strong> Speak clearly and wait for the assistant to respond. 
          You can switch languages anytime using the dropdown above.
        </p>
      </div>
    </div>
  );
}