'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface GoogleSignInButtonProps {
  variant?: 'default' | 'glassmorphism' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

export function GoogleSignInButton({ 
  variant = 'glassmorphism', 
  size = 'md',
  className = '',
  onSuccess 
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const baseClasses = 'transition-all duration-300 font-medium';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    default: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-md',
    glassmorphism: 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 shadow-lg hover:shadow-xl',
    outline: 'bg-transparent text-charcoal border-2 border-gold hover:bg-gold hover:text-white'
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading || isSigningIn}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading || isSigningIn ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <Image
          src="/google-logo.svg"
          alt="Google"
          width={20}
          height={20}
          className="mr-2"
        />
      )}
      {loading || isSigningIn ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
