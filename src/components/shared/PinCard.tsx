'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCraft } from '@/hooks/useCrafts';
import { 
  Edit, 
  Eye, 
  Share2, 
  Heart, 
  MoreVertical, 
  MapPin, 
  Clock, 
  Star,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { CraftData } from '@/lib/craftService';
import { toast } from 'sonner';

interface PinCardProps {
  craft: CraftData;
  onEdit?: (craft: CraftData) => void;
  onView?: (craft: CraftData) => void;
  onShare?: (craft: CraftData) => void;
  showActions?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function PinCard({ 
  craft, 
  onEdit, 
  onView, 
  onShare,
  showActions = true,
  showStats = true,
  variant = 'default',
  className = ''
}: PinCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const { updateCraft, deleteCraft, togglePublish, incrementStat } = useCraft(craft.id);

  const handleEdit = () => {
    onEdit?.(craft);
    setShowMenu(false);
  };

  const handleView = () => {
    incrementStat('views');
    onView?.(craft);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: craft.title,
          text: craft.shortDescription || craft.description,
          url: window.location.origin + `/crafts/${craft.id}`,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.origin + `/crafts/${craft.id}`);
        toast.success('Link copied to clipboard!');
      }
      incrementStat('shares');
      onShare?.(craft);
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setShowMenu(false);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    incrementStat('likes');
  };

  const handlePublishToggle = async () => {
    try {
      await togglePublish();
      toast.success(craft.isPublished ? 'Craft unpublished' : 'Craft published');
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this craft? This action cannot be undone.')) {
      try {
        await deleteCraft();
        toast.success('Craft deleted successfully');
      } catch (error) {
        console.error('Error deleting craft:', error);
      }
    }
    setShowMenu(false);
  };

  const getCardHeight = () => {
    switch (variant) {
      case 'compact': return 'h-64';
      case 'detailed': return 'h-96';
      default: return 'h-80';
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-300 hover:shadow-elevated group ${getCardHeight()} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={craft.images[0] || '/placeholder-craft.jpg'}
          alt={craft.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onClick={handleView}
        />
        
        {/* Overlay */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            craft.isPublished 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {craft.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className={`absolute top-3 right-3 flex space-x-2 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Stats Overlay */}
        {showStats && (
          <div className="absolute bottom-3 left-3 right-3 flex justify-between text-white text-sm">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{craft.stats?.views || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{craft.stats?.likes || 0}</span>
              </div>
            </div>
            
            {craft.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{craft.location.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-12 right-3 bg-white rounded-lg shadow-lg border border-beige z-10 min-w-[150px]">
            <div className="py-2">
              <button
                className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-beige/50 flex items-center space-x-2"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-beige/50 flex items-center space-x-2"
                onClick={handleView}
              >
                <ExternalLink className="w-4 h-4" />
                <span>View</span>
              </button>
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-beige/50 flex items-center space-x-2"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-beige/50 flex items-center space-x-2"
                onClick={handlePublishToggle}
              >
                <Share2 className="w-4 h-4" />
                <span>{craft.isPublished ? 'Unpublish' : 'Publish'}</span>
              </button>
              
              <hr className="my-1 border-beige" />
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-charcoal mb-2 font-serif line-clamp-2">
            {craft.title}
          </h3>
          
          {variant !== 'compact' && (
            <p className="text-brown text-sm line-clamp-2 mb-3">
              {craft.shortDescription || craft.description}
            </p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {craft.tags.slice(0, variant === 'compact' ? 2 : 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gold/20 text-gold text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {craft.tags.length > (variant === 'compact' ? 2 : 3) && (
              <span className="px-2 py-1 bg-brown/20 text-brown text-xs rounded-full">
                +{craft.tags.length - (variant === 'compact' ? 2 : 3)}
              </span>
            )}
          </div>

          {/* Metadata */}
          {variant === 'detailed' && (
            <div className="space-y-2 text-xs text-brown">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span>{craft.timeToComplete}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Star className="w-3 h-3" />
                <span className="capitalize">{craft.difficulty}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Materials:</span>
                <span>{craft.materials.slice(0, 2).join(', ')}</span>
                {craft.materials.length > 2 && <span>+{craft.materials.length - 2}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {variant !== 'compact' && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-beige">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 text-sm transition-colors ${
                  isLiked ? 'text-red-500' : 'text-brown hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{craft.stats?.likes || 0}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-sm text-brown hover:text-gold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>

            {craft.price && (
              <div className="text-lg font-bold text-gold">
                ₹{craft.price.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}