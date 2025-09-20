'use client';

import { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { SwipeCardData } from '@/lib/types';

interface SwipeCardDeckProps {
  cards: SwipeCardData[];
  onSwipeLeft?: (card: SwipeCardData) => void;
  onSwipeRight?: (card: SwipeCardData) => void;
  onSwipeUp?: (card: SwipeCardData) => void;
}

export function SwipeCardDeck({ cards, onSwipeLeft, onSwipeRight, onSwipeUp }: SwipeCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitX, setExitX] = useState(0);
  const [exitY, setExitY] = useState(0);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      if (offset > 0 || velocity > 0) {
        // Swipe right (like)
        setExitX(1000);
        onSwipeRight?.(cards[currentIndex]);
      } else {
        // Swipe left (pass)
        setExitX(-1000);
        onSwipeLeft?.(cards[currentIndex]);
      }
    } else if (info.offset.y < -threshold) {
      // Swipe up (save)
      setExitY(-1000);
      onSwipeUp?.(cards[currentIndex]);
    }
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const currentCard = cards[currentIndex];
    
    if (direction === 'left') {
      setExitX(-1000);
      onSwipeLeft?.(currentCard);
    } else if (direction === 'right') {
      setExitX(1000);
      onSwipeRight?.(currentCard);
    } else if (direction === 'up') {
      setExitY(-1000);
      onSwipeUp?.(currentCard);
    }
  };

  const nextCard = () => {
    setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1));
    setExitX(0);
    setExitY(0);
  };

  const prevCard = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    setExitX(0);
    setExitY(0);
  };

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-cream rounded-2xl">
        <div className="text-center">
          <Heart className="w-16 h-16 text-brown/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal mb-2">No more crafts to explore</h3>
          <p className="text-brown">Check back later for new amazing crafts!</p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;

  return (
    <div className="relative w-full max-w-md mx-auto h-[600px]">
      {/* Card Stack */}
      <div className="relative w-full h-full">
        {cards.slice(currentIndex, currentIndex + 2).map((card, index) => {
          const isTopCard = index === 0;
          const isNextCard = index === 1;
          
          return (
            <motion.div
              key={card.id}
              className={`absolute inset-0 bg-cream rounded-2xl shadow-lg overflow-hidden ${
                isTopCard ? 'z-10' : 'z-0'
              }`}
              style={{
                scale: isNextCard ? 0.95 : 1,
                y: isNextCard ? 10 : 0,
              }}
              drag={isTopCard}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={isTopCard ? handleDragEnd : undefined}
              animate={isTopCard ? {
                x: exitX,
                y: exitY,
                opacity: exitX !== 0 || exitY !== 0 ? 0 : 1,
                rotate: exitX > 0 ? 30 : exitX < 0 ? -30 : 0,
              } : {}}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => {
                if (isTopCard && (exitX !== 0 || exitY !== 0)) {
                  nextCard();
                }
              }}
            >
              {/* Card Image */}
              <div className="relative h-2/3">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 rounded-full p-2">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 h-1/3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-charcoal mb-2 font-serif">
                    {card.title}
                  </h3>
                  <p className="text-brown text-sm mb-3 line-clamp-2">
                    {card.description}
                  </p>
                  
                  {/* Artisan Info */}
                  <div className="text-sm text-brown/80 mb-3">
                    <p className="font-semibold">{card.artisan.name}</p>
                    <p>{card.artisan.location}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {card.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gold/20 text-gold text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Difficulty Badge */}
                <div className="flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    card.difficulty === 'beginner' 
                      ? 'bg-green-100 text-green-800'
                      : card.difficulty === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {card.difficulty}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-red-200 text-red-500 hover:bg-red-50"
          onClick={() => handleSwipe('left')}
          disabled={isLastCard}
        >
          <X className="w-8 h-8" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-blue-200 text-blue-500 hover:bg-blue-50"
          onClick={() => handleSwipe('up')}
          disabled={isLastCard}
        >
          <Heart className="w-8 h-8" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-green-200 text-green-500 hover:bg-green-50"
          onClick={() => handleSwipe('right')}
          disabled={isLastCard}
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-center space-x-2 mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevCard}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-brown px-3 py-1">
          {currentIndex + 1} of {cards.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextCard}
          disabled={isLastCard}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
