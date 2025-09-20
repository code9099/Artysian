'use client';

import { useState, useEffect, useRef } from 'react';
import { useCrafts } from '@/hooks/useCrafts';
import { useAuth } from '@/contexts/AuthContext';
import { CraftData } from '@/lib/craftService';
import { Heart, X, MapPin, Clock, Star, User, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SwipeCardsProps {
  onLike?: (craft: CraftData) => void;
  onPass?: (craft: CraftData) => void;
  onShare?: (craft: CraftData) => void;
  className?: string;
}

export function SwipeCards({ onLike, onPass, onShare, className = '' }: SwipeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { crafts, loading, error, loadMore, hasMore } = useCrafts({
    publishedOnly: true,
    limit: 10,
  });

  const currentCraft = crafts[currentIndex];

  // Load more cards when running low
  useEffect(() => {
    if (currentIndex >= crafts.length - 3 && hasMore && !loading) {
      loadMore();
    }
  }, [currentIndex, crafts.length, hasMore, loading, loadMore]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentCraft) return;

    if (direction === 'right') {
      handleLike();
    } else {
      handlePass();
    }

    // Move to next card
    setCurrentIndex(prev => prev + 1);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleLike = () => {
    if (!currentCraft) return;
    
    if (user?.isGuest) {
      toast.error('Please sign up to save favorites');
      return;
    }

    onLike?.(currentCraft);
    toast.success('Added to favorites!');
  };

  const handlePass = () => {
    if (!currentCraft) return;
    onPass?.(currentCraft);
  };

  const handleShare = () => {
    if (!currentCraft) return;
    onShare?.(currentCraft);
  };

  // Mouse/Touch event handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStartPos({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStartPos.x;
    const deltaY = clientY - dragStartPos.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  if (loading && crafts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-brown">Loading amazing crafts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!currentCraft) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-charcoal mb-4">No more crafts!</h3>
          <p className="text-brown mb-6">You've seen all available crafts. Check back later for more!</p>
          <Button onClick={() => setCurrentIndex(0)}>Start Over</Button>
        </div>
      </div>
    );
  }

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  return (
    <div className={`relative w-full max-w-sm mx-auto h-96 ${className}`}>
      {/* Background cards for stack effect */}
      {crafts.slice(currentIndex + 1, currentIndex + 3).map((craft, index) => (
        <div
          key={craft.id}
          className="absolute inset-0 bg-white rounded-2xl shadow-lg"
          style={{
            transform: `scale(${1 - (index + 1) * 0.05}) translateY(${(index + 1) * 10}px)`,
            zIndex: 10 - index,
          }}
        >
          <img
            src={craft.images[0] || '/placeholder-craft.jpg'}
            alt={craft.title}
            className="w-full h-64 object-cover rounded-t-2xl"
          />
        </div>
      ))}

      {/* Current card */}
      <div
        ref={cardRef}
        className="absolute inset-0 bg-white rounded-2xl shadow-xl cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity,
          zIndex: 20,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <div className="relative h-64 overflow-hidden rounded-t-2xl">
          <img
            src={currentCraft.images[0] || '/placeholder-craft.jpg'}
            alt={currentCraft.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
          
          {/* Swipe indicators */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg transform rotate-12">
              LIKE
            </div>
          </div>
          
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg transform -rotate-12">
              PASS
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-charcoal font-serif line-clamp-1">
                {currentCraft.title}
              </h3>
              <p className="text-brown text-sm line-clamp-2 mt-1">
                {currentCraft.shortDescription || currentCraft.description}
              </p>
            </div>
            
            <Button
              onClick={handleShare}
              size="sm"
              variant="ghost"
              className="text-brown hover:text-gold"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Metadata */}
          <div className="space-y-2 text-sm text-brown mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Artisan</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span className="capitalize">{currentCraft.difficulty}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{currentCraft.timeToComplete}</span>
              </div>
            </div>
            
            {currentCraft.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{currentCraft.location.address}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {currentCraft.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gold/20 text-gold text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {currentCraft.tags.length > 3 && (
              <span className="px-2 py-1 bg-brown/20 text-brown text-xs rounded-full">
                +{currentCraft.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
        <Button
          onClick={() => handleSwipe('left')}
          size="lg"
          variant="outline"
          className="w-14 h-14 rounded-full border-red-300 text-red-500 hover:bg-red-50"
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          onClick={() => handleSwipe('right')}
          size="lg"
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white"
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-brown">
          {currentIndex + 1} of {crafts.length} crafts
        </p>
      </div>
    </div>
  );
}