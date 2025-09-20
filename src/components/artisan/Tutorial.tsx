'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Mic, Camera, Globe, X, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { speechService } from '@/lib/speechService';
import { useAuth } from '@/contexts/AuthContext';
import { TUTORIAL_STEPS } from '@/lib/constants';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  enableVoice?: boolean;
  autoPlay?: boolean;
}

interface TutorialSlide {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  voiceText: string;
  color: string;
  bgColor: string;
  animation?: string;
}

export function Tutorial({ 
  onComplete, 
  onSkip, 
  enableVoice = true, 
  autoPlay = true 
}: TutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(enableVoice);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();

  const slides: TutorialSlide[] = [
    {
      id: 'welcome',
      icon: Globe,
      title: 'Welcome to CraftStory',
      description: 'Your AI-powered assistant for showcasing traditional crafts to the world.',
      voiceText: 'Welcome to CraftStory! I\'m your AI assistant, here to help you share your beautiful crafts with the world.',
      color: 'text-gold',
      bgColor: 'bg-gold/20',
      animation: 'animate-bounce'
    },
    {
      id: 'voice_assistant',
      icon: Mic,
      title: 'Voice Assistant',
      description: 'I can understand and speak in your language. Just talk to me naturally about your crafts.',
      voiceText: 'I can understand and speak in your language. Just talk to me naturally about your crafts, and I\'ll help you create amazing descriptions.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      animation: 'animate-pulse'
    },
    {
      id: 'photo_upload',
      icon: Camera,
      title: 'Photo Upload',
      description: 'Say "swipe up" to open the camera and capture your beautiful creations.',
      voiceText: 'When you\'re ready to upload photos, just say "swipe up" and I\'ll open the camera for you. You can take new photos or choose from your gallery.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      animation: 'animate-bounce'
    },
    {
      id: 'product_info',
      icon: ArrowUp,
      title: 'Product Information',
      description: 'I\'ll ask you questions about your craft and create professional descriptions automatically.',
      voiceText: 'I\'ll ask you questions about your craft - the materials you use, the story behind it, and the techniques involved. Then I\'ll create professional descriptions automatically.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'complete',
      icon: ArrowUp,
      title: 'Ready to Start!',
      description: 'You can skip this tutorial anytime by swiping up. Let\'s create your first craft listing!',
      voiceText: 'You\'re all set! Remember, you can skip any step by swiping up. Let\'s create your first craft listing together!',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      animation: 'animate-bounce'
    }
  ];

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  // Auto-play voice when slide changes
  useEffect(() => {
    if (hasStarted && isVoiceEnabled && autoPlay && currentSlideData.voiceText) {
      const timer = setTimeout(() => {
        speakText(currentSlideData.voiceText);
      }, 500); // Small delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [currentSlide, hasStarted, isVoiceEnabled, autoPlay]);

  // Start tutorial
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
    }
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!isVoiceEnabled) return;

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
      };

      setCurrentAudio(audio);
      await audio.play();
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled, currentLanguage.ttsCode, currentAudio]);

  const stopSpeaking = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsSpeaking(false);
    }
  }, [currentAudio]);

  const handleNext = useCallback(() => {
    stopSpeaking();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      markTutorialComplete();
      onComplete();
    }
  }, [currentSlide, slides.length, onComplete, stopSpeaking]);

  const handlePrevious = useCallback(() => {
    stopSpeaking();
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide, stopSpeaking]);

  const handleSkip = useCallback(() => {
    stopSpeaking();
    markTutorialComplete();
    onSkip();
  }, [onSkip, stopSpeaking]);

  const markTutorialComplete = useCallback(async () => {
    if (user && !user.isGuest) {
      try {
        // Mark tutorial as completed in user profile
        localStorage.setItem('craftstory_tutorial_completed', 'true');
        // Could also update Firestore here
      } catch (error) {
        console.error('Error marking tutorial complete:', error);
      }
    } else {
      localStorage.setItem('craftstory_guest_tutorial_completed', 'true');
    }
  }, [user]);

  const toggleVoice = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setIsVoiceEnabled(!isVoiceEnabled);
  }, [isVoiceEnabled, isSpeaking, stopSpeaking]);

  // Handle swipe up gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const diff = startY - currentY;
      
      if (diff > 50) { // Swipe up detected
        handleSkip();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [handleSkip]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onTouchStart={handleTouchStart}
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl">
        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleVoice}
              size="sm"
              variant="ghost"
              className="p-2"
            >
              {isVoiceEnabled ? (
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-gold animate-pulse' : 'text-brown'}`} />
              ) : (
                <VolumeX className="w-4 h-4 text-brown" />
              )}
            </Button>
            
            {isVoiceEnabled && currentSlideData.voiceText && (
              <Button
                onClick={() => speakText(currentSlideData.voiceText)}
                size="sm"
                variant="ghost"
                className="p-2"
                disabled={isSpeaking}
              >
                <Volume2 className="w-4 h-4 text-brown" />
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleSkip}
            size="sm"
            variant="ghost"
            className="p-2 hover:bg-beige rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-brown" />
          </Button>
        </div>

        {/* Slide Content */}
        <div className="mt-12 mb-8">
          <div className={`w-24 h-24 ${currentSlideData.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 ${currentSlideData.animation || ''}`}>
            <Icon className={`w-12 h-12 ${currentSlideData.color}`} />
          </div>
          
          <h2 className="text-2xl font-bold text-charcoal mb-4 font-serif">
            {currentSlideData.title}
          </h2>
          
          <p className="text-brown text-lg leading-relaxed">
            {currentSlideData.description}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                stopSpeaking();
                setCurrentSlide(index);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-gold scale-125' 
                  : index < currentSlide 
                    ? 'bg-gold/60' 
                    : 'bg-beige hover:bg-beige/80'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="text-sm text-brown">
            {currentSlide + 1} of {slides.length}
          </div>
          
          <Button
            onClick={handleNext}
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Swipe Up Hint */}
        <div className="mt-6 text-sm text-brown/70">
          <div className="flex items-center justify-center space-x-2">
            <ArrowUp className="w-4 h-4 animate-bounce" />
            <span>Swipe up to skip tutorial</span>
          </div>
        </div>

        {/* Voice Status */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gold/20 rounded-full px-3 py-1 flex items-center space-x-2">
              <Volume2 className="w-3 h-3 text-gold animate-pulse" />
              <span className="text-xs text-gold">Speaking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}