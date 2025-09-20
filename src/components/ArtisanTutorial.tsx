'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Mic, Camera, Globe, X } from 'lucide-react';

interface ArtisanTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ArtisanTutorial({ onComplete, onSkip }: ArtisanTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Globe,
      title: 'Choose Your Language',
      description: 'Select your preferred language for voice interactions and AI assistance.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Mic,
      title: 'Voice Introduction',
      description: 'Tell us about your craft through voice. Our AI will ask questions to build your profile.',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Camera,
      title: 'Upload Your Craft Photos',
      description: 'Showcase your beautiful creations by uploading photos from your gallery or camera.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: ArrowUp,
      title: 'Swipe Up to Skip',
      description: 'You can skip this tutorial anytime by swiping up or clicking the skip button.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSwipeUp = (e: React.TouchEvent) => {
    e.preventDefault();
    onSkip();
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onTouchStart={(e) => {
        const touch = e.touches[0];
        const startY = touch.clientY;
        
        const handleTouchMove = (moveEvent: TouchEvent) => {
          const currentY = moveEvent.touches[0].clientY;
          const diff = startY - currentY;
          
          if (diff > 50) { // Swipe up detected
            onSkip();
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
      }}
    >
      <div className="bg-cream rounded-2xl p-8 max-w-md w-full text-center relative">
        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 hover:bg-beige rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-brown" />
        </button>

        {/* Slide Content */}
        <div className="mb-8">
          <div className={`w-20 h-20 ${currentSlideData.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Icon className={`w-10 h-10 ${currentSlideData.color}`} />
          </div>
          
          <h2 className="text-2xl font-bold text-charcoal mb-4 font-serif">
            {currentSlideData.title}
          </h2>
          
          <p className="text-brown text-lg">
            {currentSlideData.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-gold' : 'bg-beige'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>

        {/* Swipe Up Hint */}
        <div className="mt-6 text-sm text-brown">
          <div className="flex items-center justify-center space-x-2">
            <ArrowUp className="w-4 h-4" />
            <span>Swipe up to skip</span>
          </div>
        </div>
      </div>
    </div>
  );
}
