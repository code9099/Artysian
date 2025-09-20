'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { geminiService } from '@/lib/geminiService';
import { Sparkles, Edit3, Save, RotateCcw, MapPin, Clock, Star, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductInfo {
  name: string;
  description: string;
  materials: string[];
  techniques: string[];
  story: string;
  culturalContext: string;
  timeToComplete: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  category: string;
}

interface GeneratedSummary {
  title: string;
  description: string;
  shortDescription: string;
  highlights: string[];
  tags: string[];
  seoDescription: string;
  socialMediaCaption: string;
  culturalStory: string;
  technicalDetails: string;
}

interface ProductSummaryProps {
  productInfo: ProductInfo;
  images: string[];
  onSave: (summary: GeneratedSummary, productInfo: ProductInfo) => void;
  onEdit: () => void;
  location?: { latitude: number; longitude: number; address: string };
}

export function ProductSummary({ 
  productInfo, 
  images, 
  onSave, 
  onEdit, 
  location 
}: ProductSummaryProps) {
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState<GeneratedSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();

  // Generate summary on mount
  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/gemini/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateProductSummary',
          profileData: {
            ...productInfo,
            images,
            location,
            language: currentLanguage.code,
          },
          languageCode: currentLanguage.code,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      const summary = data.summary || createFallbackSummary();
      
      setGeneratedSummary(summary);
      setEditedSummary(summary);
      
      toast.success('Product summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      const fallbackSummary = createFallbackSummary();
      setGeneratedSummary(fallbackSummary);
      setEditedSummary(fallbackSummary);
      toast.error('Using basic summary. You can edit it below.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createFallbackSummary = (): GeneratedSummary => {
    return {
      title: productInfo.name,
      description: productInfo.description,
      shortDescription: productInfo.description.substring(0, 150) + '...',
      highlights: [
        `Made with ${productInfo.materials.join(', ')}`,
        `Uses ${productInfo.techniques.join(', ')} techniques`,
        `${productInfo.difficulty} level craftsmanship`,
        `Takes ${productInfo.timeToComplete} to complete`,
      ],
      tags: [
        productInfo.category.toLowerCase(),
        ...productInfo.materials.map(m => m.toLowerCase()),
        'handmade',
        'traditional',
        'artisan',
      ],
      seoDescription: `${productInfo.name} - ${productInfo.description.substring(0, 120)}...`,
      socialMediaCaption: `✨ ${productInfo.name} ✨\n\n${productInfo.story}\n\n#handmade #${productInfo.category.toLowerCase()} #artisan`,
      culturalStory: productInfo.culturalContext,
      technicalDetails: `Materials: ${productInfo.materials.join(', ')}\nTechniques: ${productInfo.techniques.join(', ')}\nDifficulty: ${productInfo.difficulty}\nTime: ${productInfo.timeToComplete}`,
    };
  };

  const handleEdit = (field: keyof GeneratedSummary, value: string) => {
    if (!editedSummary) return;
    
    setEditedSummary({
      ...editedSummary,
      [field]: value,
    });
  };

  const handleSave = async () => {
    if (!editedSummary) return;
    
    setIsSaving(true);
    
    try {
      // Capture geolocation if available
      let currentLocation = location;
      if (!currentLocation && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Current location', // Could be enhanced with reverse geocoding
          };
        } catch (error) {
          console.log('Geolocation not available');
        }
      }

      // Update product info with location
      const finalProductInfo = {
        ...productInfo,
        location: currentLocation,
      };

      onSave(editedSummary, finalProductInfo);
      toast.success('Product listing saved successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product listing');
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateSummary = () => {
    generateSummary();
  };

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-elevated p-8 text-center">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-gold animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-4 font-serif">
            Creating Your Product Listing
          </h2>
          <p className="text-brown mb-6">
            Our AI is crafting a beautiful description for your {productInfo.name}...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
            <span className="text-brown">This may take a moment</span>
          </div>
        </div>
      </div>
    );
  }

  if (!generatedSummary || !editedSummary) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-elevated p-8 text-center">
          <h2 className="text-xl font-semibold text-charcoal mb-4">
            Failed to Generate Summary
          </h2>
          <Button onClick={generateSummary} className="bg-gold hover:bg-gold-light text-charcoal">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-gold rounded-2xl p-6 text-charcoal">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-bold font-serif">Your Product Listing</h1>
              <p className="opacity-80">AI-generated and fully editable</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={regenerateSummary}
              variant="outline"
              size="sm"
              className="border-charcoal text-charcoal hover:bg-charcoal hover:text-gold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
              className="border-charcoal text-charcoal hover:bg-charcoal hover:text-gold"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Images */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-elevated p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Product Images</h3>
            <div className="grid grid-cols-2 gap-3">
              {images.slice(0, 4).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${productInfo.name} ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-beige"
                />
              ))}
            </div>
            {images.length > 4 && (
              <p className="text-sm text-brown mt-2">
                +{images.length - 4} more images
              </p>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Description */}
          <div className="bg-white rounded-2xl shadow-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-charcoal">Product Details</h3>
              {isEditing && (
                <span className="text-sm text-brown">Click to edit</span>
              )}
            </div>
            
            {/* Title */}
            <div className="mb-4">
              <label className="text-sm font-medium text-brown block mb-2">Title</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedSummary.title}
                  onChange={(e) => handleEdit('title', e.target.value)}
                  className="w-full p-3 border border-beige rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              ) : (
                <h2 className="text-xl font-bold text-charcoal font-serif">
                  {editedSummary.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-sm font-medium text-brown block mb-2">Description</label>
              {isEditing ? (
                <textarea
                  value={editedSummary.description}
                  onChange={(e) => handleEdit('description', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-beige rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              ) : (
                <p className="text-charcoal leading-relaxed">
                  {editedSummary.description}
                </p>
              )}
            </div>

            {/* Short Description */}
            <div>
              <label className="text-sm font-medium text-brown block mb-2">Short Description</label>
              {isEditing ? (
                <textarea
                  value={editedSummary.shortDescription}
                  onChange={(e) => handleEdit('shortDescription', e.target.value)}
                  rows={2}
                  className="w-full p-3 border border-beige rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              ) : (
                <p className="text-brown text-sm">
                  {editedSummary.shortDescription}
                </p>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-white rounded-2xl shadow-elevated p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Key Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editedSummary.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-gold flex-shrink-0" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => {
                        const newHighlights = [...editedSummary.highlights];
                        newHighlights[index] = e.target.value;
                        handleEdit('highlights', newHighlights as any);
                      }}
                      className="flex-1 p-2 border border-beige rounded focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                    />
                  ) : (
                    <span className="text-charcoal text-sm">{highlight}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-elevated p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Tags</h3>
            {isEditing ? (
              <textarea
                value={editedSummary.tags.join(', ')}
                onChange={(e) => handleEdit('tags', e.target.value.split(',').map(tag => tag.trim()) as any)}
                rows={2}
                placeholder="Enter tags separated by commas"
                className="w-full p-3 border border-beige rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {editedSummary.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gold/20 text-gold text-sm rounded-full border border-gold/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cultural Story */}
          <div className="bg-white rounded-2xl shadow-elevated p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Cultural Story</h3>
            {isEditing ? (
              <textarea
                value={editedSummary.culturalStory}
                onChange={(e) => handleEdit('culturalStory', e.target.value)}
                rows={3}
                className="w-full p-3 border border-beige rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            ) : (
              <p className="text-charcoal leading-relaxed">
                {editedSummary.culturalStory}
              </p>
            )}
          </div>

          {/* Technical Details */}
          <div className="bg-white rounded-2xl shadow-elevated p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Technical Details</h3>
            {isEditing ? (
              <textarea
                value={editedSummary.technicalDetails}
                onChange={(e) => handleEdit('technicalDetails', e.target.value)}
                rows={4}
                className="w-full p-3 border border-beige rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            ) : (
              <pre className="text-charcoal text-sm whitespace-pre-wrap font-sans">
                {editedSummary.technicalDetails}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Location Info */}
      {location && (
        <div className="bg-white rounded-2xl shadow-elevated p-6">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-semibold text-charcoal">Location</h3>
          </div>
          <p className="text-brown">{location.address}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-elevated p-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onEdit}
            variant="outline"
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Product Info
          </Button>
          
          <div className="text-sm text-brown">
            <Clock className="w-4 h-4 inline mr-1" />
            Auto-saved
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gold hover:bg-gold-light text-charcoal"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save & Publish
            </>
          )}
        </Button>
      </div>
    </div>
  );
}