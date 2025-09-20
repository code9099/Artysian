'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { X, Crown, Heart, Upload, Star, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface GuestUpgradePromptProps {
  trigger: 'favorites' | 'upload' | 'profile' | 'general';
  onClose?: () => void;
  onUpgrade?: () => void;
  className?: string;
}

const PROMPT_CONTENT = {
  favorites: {
    icon: Heart,
    title: 'Save Your Favorites',
    description: 'Create an account to save your favorite crafts and sync them across all your devices.',
    features: ['Save unlimited favorites', 'Sync across devices', 'Get personalized recommendations'],
  },
  upload: {
    icon: Upload,
    title: 'Share Your Crafts',
    description: 'Sign up to upload your beautiful crafts and connect with art lovers worldwide.',
    features: ['Upload unlimited crafts', 'AI-powered descriptions', 'Connect with buyers'],
  },
  profile: {
    icon: Star,
    title: 'Build Your Profile',
    description: 'Create your artisan profile to showcase your skills and build your reputation.',
    features: ['Professional artisan profile', 'Showcase your portfolio', 'Build your reputation'],
  },
  general: {
    icon: Crown,
    title: 'Unlock Full Experience',
    description: 'Sign up to access all features and get the most out of CraftStory.',
    features: ['Save favorites', 'Upload crafts', 'Connect with community'],
  },
};

export function GuestUpgradePrompt({ 
  trigger, 
  onClose, 
  onUpgrade, 
  className = '' 
}: GuestUpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { signInWithGoogle } = useAuth();

  const content = PROMPT_CONTENT[trigger];
  const Icon = content.icon;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleUpgrade = async () => {
    try {
      await signInWithGoogle();
      toast.success('Welcome to CraftStory!');
      onUpgrade?.();
      handleClose();
    } catch (error) {
      console.error('Sign up failed:', error);
      toast.error('Sign up failed. Please try again.');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden ${className}`}>
        {/* Header */}
        <div className="bg-gradient-gold p-6 text-charcoal relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-charcoal/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-charcoal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-serif">{content.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-brown text-center mb-6 leading-relaxed">
            {content.description}
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {content.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                </div>
                <span className="text-charcoal text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gold hover:bg-gold-light text-charcoal text-lg py-3"
              size="lg"
            >
              Sign Up with Google
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full border-brown text-brown hover:bg-brown hover:text-cream"
            >
              Continue as Guest
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-gold/10 rounded-lg border border-gold/20">
            <p className="text-xs text-brown text-center">
              <strong>Free forever</strong> • No credit card required • Sign up in seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing guest upgrade prompts
export function useGuestUpgrade() {
  const { user, isGuest } = useAuth();
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const showUpgradePrompt = (trigger: GuestUpgradePromptProps['trigger']) => {
    if (isGuest) {
      setActivePrompt(trigger);
      return true;
    }
    return false;
  };

  const hideUpgradePrompt = () => {
    setActivePrompt(null);
  };

  const requireAuth = (
    trigger: GuestUpgradePromptProps['trigger'],
    action?: () => void
  ) => {
    if (isGuest) {
      showUpgradePrompt(trigger);
      return false;
    }
    action?.();
    return true;
  };

  return {
    activePrompt,
    showUpgradePrompt,
    hideUpgradePrompt,
    requireAuth,
    isGuest,
    canUpload: !isGuest,
    canSaveFavorites: !isGuest,
  };
}