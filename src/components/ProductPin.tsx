'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Share2, Heart, MoreVertical } from 'lucide-react';
import { Craft } from '@/lib/types';

interface ProductPinProps {
  craft: Craft;
  onEdit: (craft: Craft) => void;
  onPublish: (craft: Craft) => void;
  onDelete?: (craft: Craft) => void;
}

export function ProductPin({ craft, onEdit, onPublish, onDelete }: ProductPinProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    onEdit(craft);
    setShowMenu(false);
  };

  const handlePublish = () => {
    onPublish(craft);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this craft?')) {
      onDelete(craft);
    }
    setShowMenu(false);
  };

  return (
    <div 
      className="bg-cream rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={craft.images[0] || '/placeholder-craft.jpg'}
          alt={craft.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        
        {/* Overlay */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* Action Buttons */}
        <div className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-300 ${
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

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            craft.isPublished 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {craft.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Stats */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-white text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{craft.stats?.views || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{craft.stats?.likes || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-charcoal mb-2 font-serif line-clamp-1">
            {craft.title}
          </h3>
          <p className="text-brown text-sm line-clamp-2 mb-3">
            {craft.description}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {craft.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gold/20 text-gold text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {craft.tags.length > 3 && (
              <span className="px-2 py-1 bg-brown/20 text-brown text-xs rounded-full">
                +{craft.tags.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-brown text-brown hover:bg-brown hover:text-cream"
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          
          {!craft.isPublished ? (
            <Button
              size="sm"
              className="flex-1 bg-gold hover:bg-gold-light text-charcoal"
              onClick={handlePublish}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gold text-gold hover:bg-gold hover:text-charcoal"
              onClick={() => {/* Handle unpublish */}}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Unpublish
            </Button>
          )}
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-beige z-10 min-w-[150px]">
            <div className="py-2">
              <button
                className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-beige/50"
                onClick={handleEdit}
              >
                Edit Details
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-beige/50"
                onClick={() => {/* Handle duplicate */}}
              >
                Duplicate
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-beige/50"
                onClick={() => {/* Handle analytics */}}
              >
                View Analytics
              </button>
              {onDelete && (
                <button
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
