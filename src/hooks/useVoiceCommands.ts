/**
 * Custom hook for handling voice commands
 */

import { useState, useCallback, useRef } from 'react';
import { useVoiceRecording } from './useVoiceRecording';
import { useLanguage } from '@/contexts/LanguageContext';
import { speechService } from '@/lib/speechService';
import { toast } from 'sonner';

export interface VoiceCommand {
  patterns: string[];
  action: () => void | Promise<void>;
  feedback?: string;
  description?: string;
}

export interface VoiceCommandsConfig {
  commands: Record<string, VoiceCommand>;
  enableFeedback?: boolean;
  listeningTimeout?: number;
  confidenceThreshold?: number;
}

export function useVoiceCommands(config: VoiceCommandsConfig) {
  const {
    commands,
    enableFeedback = true,
    listeningTimeout = 10000,
    confidenceThreshold = 0.7,
  } = config;

  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  
  const { currentLanguage } = useLanguage();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const voiceRecording = useVoiceRecording({
    maxDuration: 10,
    autoTranscribe: true,
    onRecordingComplete: handleVoiceInput,
  });

  const speakFeedback = useCallback(async (text: string) => {
    if (!enableFeedback) return;

    try {
      const audioDataUri = await speechService.textToSpeech(text, currentLanguage.ttsCode);
      const audio = new Audio(audioDataUri);
      audio.play();
    } catch (error) {
      console.error('Error speaking feedback:', error);
    }
  }, [enableFeedback, currentLanguage.ttsCode]);

  const handleVoiceInput = useCallback(async (
    audioBlob: Blob,
    audioDataUri: string,
    transcript?: string
  ) => {
    if (!transcript) {
      if (enableFeedback) {
        speakFeedback('I didn\'t catch that. Please try again.');
      }
      return;
    }

    setIsProcessingCommand(true);
    setLastCommand(transcript);

    const normalizedTranscript = transcript.toLowerCase().trim();
    let commandExecuted = false;

    // Check each command for pattern matches
    for (const [commandName, command] of Object.entries(commands)) {
      const isMatch = command.patterns.some(pattern => 
        normalizedTranscript.includes(pattern.toLowerCase())
      );

      if (isMatch) {
        try {
          await command.action();
          commandExecuted = true;
          
          if (command.feedback) {
            speakFeedback(command.feedback);
          }
          
          toast.success(`Command executed: ${commandName}`);
          break;
        } catch (error) {
          console.error(`Error executing command ${commandName}:`, error);
          speakFeedback('Sorry, I couldn\'t execute that command.');
          toast.error(`Failed to execute command: ${commandName}`);
        }
      }
    }

    if (!commandExecuted) {
      const availableCommands = Object.values(commands)
        .map(cmd => cmd.patterns[0])
        .slice(0, 3)
        .join(', ');
      
      speakFeedback(`I didn't understand that command. Try saying: ${availableCommands}`);
      toast.info('Command not recognized. Check available commands.');
    }

    setIsProcessingCommand(false);
  }, [commands, enableFeedback, speakFeedback]);

  const startListening = useCallback(() => {
    if (voiceRecording.isRecording) return;

    setIsListening(true);
    voiceRecording.startRecording();

    if (enableFeedback) {
      speakFeedback('Listening for commands...');
    }

    // Auto-stop after timeout
    timeoutRef.current = setTimeout(() => {
      stopListening();
      if (enableFeedback) {
        speakFeedback('Listening timeout. Try again.');
      }
    }, listeningTimeout);
  }, [voiceRecording, enableFeedback, listeningTimeout, speakFeedback]);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsListening(false);
    voiceRecording.stopRecording();
  }, [voiceRecording]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const addCommand = useCallback((name: string, command: VoiceCommand) => {
    commands[name] = command;
  }, [commands]);

  const removeCommand = useCallback((name: string) => {
    delete commands[name];
  }, [commands]);

  const getAvailableCommands = useCallback(() => {
    return Object.entries(commands).map(([name, command]) => ({
      name,
      patterns: command.patterns,
      description: command.description,
    }));
  }, [commands]);

  const executeCommand = useCallback(async (commandName: string) => {
    const command = commands[commandName];
    if (!command) {
      toast.error(`Command not found: ${commandName}`);
      return;
    }

    try {
      setIsProcessingCommand(true);
      await command.action();
      
      if (command.feedback) {
        speakFeedback(command.feedback);
      }
      
      toast.success(`Command executed: ${commandName}`);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      speakFeedback('Sorry, I couldn\'t execute that command.');
      toast.error(`Failed to execute command: ${commandName}`);
    } finally {
      setIsProcessingCommand(false);
    }
  }, [commands, speakFeedback]);

  return {
    // State
    isListening,
    isProcessingCommand,
    lastCommand,
    isRecording: voiceRecording.isRecording,
    transcript: voiceRecording.transcript,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    addCommand,
    removeCommand,
    executeCommand,
    speakFeedback,
    
    // Utilities
    getAvailableCommands,
    isSupported: voiceRecording.isSupported,
  };
}

// Predefined command sets for common use cases
export const createPhotoUploadCommands = (
  openCamera: () => void,
  openGallery: () => void,
  uploadPhotos: () => void,
  clearPhotos: () => void
): Record<string, VoiceCommand> => ({
  camera: {
    patterns: ['swipe up', 'camera', 'take photo', 'capture', 'shoot'],
    action: openCamera,
    feedback: 'Opening camera',
    description: 'Open camera to take a photo',
  },
  gallery: {
    patterns: ['gallery', 'choose files', 'select photos', 'pick images', 'browse'],
    action: openGallery,
    feedback: 'Opening gallery',
    description: 'Choose photos from gallery',
  },
  upload: {
    patterns: ['upload', 'save', 'submit', 'send'],
    action: uploadPhotos,
    feedback: 'Uploading photos',
    description: 'Upload selected photos',
  },
  clear: {
    patterns: ['clear', 'cancel', 'remove all', 'delete all'],
    action: clearPhotos,
    feedback: 'Photos cleared',
    description: 'Clear all selected photos',
  },
});

export const createNavigationCommands = (
  goBack: () => void,
  goNext: () => void,
  goHome: () => void
): Record<string, VoiceCommand> => ({
  back: {
    patterns: ['go back', 'previous', 'back'],
    action: goBack,
    feedback: 'Going back',
    description: 'Go to previous page',
  },
  next: {
    patterns: ['next', 'continue', 'proceed'],
    action: goNext,
    feedback: 'Going to next step',
    description: 'Go to next step',
  },
  home: {
    patterns: ['home', 'dashboard', 'main page'],
    action: goHome,
    feedback: 'Going home',
    description: 'Go to home page',
  },
});