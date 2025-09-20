'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { User, Sparkles, Mic, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthPageProps {
  onSuccess?: () => void;
  showFeatures?: boolean;
}

export function AuthPage({ onSuccess, showFeatures = true }: AuthPageProps) {
  const { signInAsGuest, loading } = useAuth();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true);
    try {
      await signInAsGuest();
      onSuccess?.();
    } catch (error) {
      console.error('Guest sign in failed:', error);
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated p-8 max-w-md w-full text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-charcoal" />
          </div>
          <h1 className="text-3xl font-bold text-charcoal mb-2 font-serif">CraftStory</h1>
          <p className="text-brown">AI-Powered Marketplace for Local Artisans</p>
        </div>

        {/* Mission Statement */}
        <div className="mb-8 p-4 bg-gold/10 rounded-2xl border border-gold/20">
          <p className="text-sm text-charcoal">
            Empowering local artisans to market their craft, tell their stories, 
            and expand their reach to new digital audiences through AI.
          </p>
        </div>

        {/* Authentication Options */}
        <div className="space-y-4 mb-8">
          <GoogleSignInButton
            variant="default"
            size="lg"
            className="w-full"
            onSuccess={onSuccess}
          />

          <Button
            onClick={handleGuestSignIn}
            disabled={loading || isGuestLoading}
            variant="outline"
            className="w-full border-brown text-brown hover:bg-brown hover:text-cream py-3 text-lg"
            size="lg"
          >
            {isGuestLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brown mr-2" />
            ) : (
              <User className="w-5 h-5 mr-2" />
            )}
            Continue as Guest
          </Button>
        </div>

        {/* Features Preview */}
        {showFeatures && (
          <div className="grid grid-cols-2 gap-4 text-xs text-brown">
            <div className="text-center">
              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mic className="w-4 h-4 text-gold" />
              </div>
              <p>Voice Assistant</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Globe className="w-4 h-4 text-gold" />
              </div>
              <p>22 Languages</p>
            </div>
          </div>
        )}

        {/* Guest Mode Notice */}
        <div className="mt-6 p-3 bg-beige/50 rounded-lg">
          <p className="text-xs text-brown">
            <strong>Guest Mode:</strong> Explore crafts with limited features. 
            Sign up to upload crafts and save favorites.
          </p>
        </div>
      </div>
    </div>
  );
}