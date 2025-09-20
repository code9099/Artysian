'use client';

import { Loader2, Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gold' | 'minimal' | 'craft';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const getSpinnerContent = () => {
    switch (variant) {
      case 'gold':
        return (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className={`${sizeClasses[size]} border-3 border-gold/30 border-t-gold rounded-full animate-spin`} />
              <Sparkles className={`absolute inset-0 ${sizeClasses[size]} text-gold animate-pulse`} />
            </div>
            {text && <p className="text-gold text-sm font-medium">{text}</p>}
          </div>
        );
      
      case 'minimal':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-brown`} />
            {text && <span className="text-brown text-sm">{text}</span>}
          </div>
        );
      
      case 'craft':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-charcoal animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
            {text && (
              <div className="text-center">
                <p className="text-charcoal font-medium">{text}</p>
                <p className="text-brown text-sm">This may take a moment...</p>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-charcoal`} />
            {text && <p className="text-charcoal text-sm">{text}</p>}
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {getSpinnerContent()}
    </div>
  );
}

// Full page loading component
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
      <LoadingSpinner variant="craft" size="xl" text={text} />
    </div>
  );
}

// Inline loading component
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner variant="minimal" text={text} />
    </div>
  );
}