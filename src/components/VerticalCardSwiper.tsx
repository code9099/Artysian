'use client';

import { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Keyboard, Mousewheel } from 'swiper/modules';
import { Heart, X, Star, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeCardData } from '@/lib/types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';

interface VerticalCardSwiperProps {
  cards: SwipeCardData[];
  onSwipeLeft?: (card: SwipeCardData) => void;
  onSwipeRight?: (card: SwipeCardData) => void;
  onSwipeUp?: (card: SwipeCardData) => void;
  className?: string;
}

export function VerticalCardSwiper({ 
  cards, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp,
  className = '' 
}: VerticalCardSwiperProps) {
  const swiperRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSlideChange = (swiper: { activeIndex: number }) => {
    setCurrentIndex(swiper.activeIndex);
  };

  const handleSwipeAction = (direction: 'left' | 'right' | 'up') => {
    if (isAnimating || currentIndex >= cards.length) return;
    
    const currentCard = cards[currentIndex];
    setIsAnimating(true);
    
    // Add visual feedback
    const activeSlide = document.querySelector('.swiper-slide-active .card-content');
    if (activeSlide) {
      activeSlide.classList.add(`swipe-${direction}`);
    }
    
    setTimeout(() => {
      // Execute callback
      if (direction === 'left') {
        onSwipeLeft?.(currentCard);
      } else if (direction === 'right') {
        onSwipeRight?.(currentCard);
      } else if (direction === 'up') {
        onSwipeUp?.(currentCard);
      }
      
      // Move to next slide
      if (swiperRef.current) {
        swiperRef.current.slideNext();
      }
      
      setIsAnimating(false);
    }, 300);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isAnimating) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        handleSwipeAction('left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleSwipeAction('right');
        break;
      case 'ArrowUp':
        event.preventDefault();
        handleSwipeAction('up');
        break;
      case ' ': // Spacebar for like
        event.preventDefault();
        handleSwipeAction('right');
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating]);

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-cream rounded-3xl shadow-lg">
        <div className="text-center">
          <Heart className="w-16 h-16 text-brown/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal mb-2">No more crafts to explore</h3>
          <p className="text-brown">Check back later for new amazing crafts!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      {/* Instructions */}
      <div className="text-center mb-4">
        <p className="text-sm text-brown/80 mb-2">
          Swipe up ↑ to save • Swipe left ← to pass • Swipe right → to like
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-brown/60">
          <span>← ← ← Pass</span>
          <span className="text-gold font-medium">{currentIndex + 1} of {cards.length}</span>
          <span>Like → → →</span>
        </div>
      </div>

      {/* 3D Card Stack */}
      <div className="relative h-[600px] perspective-1000">
        <Swiper
          ref={swiperRef}
          effect="cards"
          grabCursor={true}
          modules={[EffectCards, Keyboard, Mousewheel]}
          className="vertical-card-swiper"
          onSlideChange={handleSlideChange}
          keyboard={{
            enabled: true,
          }}
          mousewheel={{
            enabled: true,
            forceToAxis: true,
          }}
          cardsEffect={{
            perSlideOffset: 8,
            perSlideRotate: 2,
            rotate: true,
            slideShadows: true,
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {cards.map((card, index) => (
            <SwiperSlide key={card.id} className="swiper-slide-custom">
              <div className="card-content relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden transform-gpu">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading={index < 3 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  {/* Top Section - Rating & Save */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-1 bg-white/90 rounded-full px-3 py-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-charcoal">
                        {card.rating || '4.5'}
                      </span>
                    </div>
                    
                    {card.price && (
                      <div className="bg-gold/90 text-charcoal rounded-full px-3 py-1">
                        <span className="text-sm font-bold">{card.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Section - Main Content */}
                  <div className="space-y-4">
                    {/* Title */}
                    <h2 className="text-3xl font-bold text-white font-serif leading-tight">
                      {card.title}
                    </h2>

                    {/* Description */}
                    <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
                      {card.description}
                    </p>

                    {/* Artisan Info */}
                    <div className="flex items-center space-x-3 text-white/80">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">{card.artisan.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{card.artisan.location}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {card.tags.slice(0, 4).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full border border-white/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Difficulty Badge */}
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        card.difficulty === 'beginner' 
                          ? 'bg-green-500/80 text-white'
                          : card.difficulty === 'intermediate'
                          ? 'bg-yellow-500/80 text-white'
                          : 'bg-red-500/80 text-white'
                      }`}>
                        {card.difficulty?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Swipe Indicators */}
                <div className="absolute top-1/2 left-4 transform -translate-y-1/2 opacity-0 swipe-indicator-left">
                  <div className="bg-red-500 text-white rounded-full p-3">
                    <X className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 swipe-indicator-right">
                  <div className="bg-green-500 text-white rounded-full p-3">
                    <Heart className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 opacity-0 swipe-indicator-up">
                  <div className="bg-blue-500 text-white rounded-full p-3">
                    <Star className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center space-x-6 mt-8">
        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-lg"
          onClick={() => handleSwipeAction('left')}
          disabled={isAnimating || currentIndex >= cards.length}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-lg"
          onClick={() => handleSwipeAction('up')}
          disabled={isAnimating || currentIndex >= cards.length}
        >
          <Star className="w-7 h-7" />
        </Button>
        
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200 shadow-lg"
          onClick={() => handleSwipeAction('right')}
          disabled={isAnimating || currentIndex >= cards.length}
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="text-center mt-4">
        <p className="text-xs text-brown/60">
          Keyboard: ← Pass • → Like • ↑ Save • Space Like
        </p>
      </div>
    </div>
  );
}