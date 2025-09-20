'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const isFirebaseError = error.message.includes('Firebase') || error.message.includes('auth/');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-4">
      <div className="max-w-md w-full bg-cream rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-charcoal mb-4 font-serif">
          {isFirebaseError ? 'Firebase Configuration Error' : 'Something went wrong'}
        </h1>
        
        <p className="text-brown mb-6">
          {isFirebaseError 
            ? 'There\'s an issue with the Firebase configuration. Please check your environment variables.'
            : 'An unexpected error occurred. Please try refreshing the page.'
          }
        </p>
        
        {isFirebaseError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
            <code className="text-sm text-red-700 break-all">{error.message}</code>
          </div>
        )}
        
        <div className="space-y-3">
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>
        
        {isFirebaseError && (
          <div className="mt-6 text-sm text-brown">
            <p className="font-semibold mb-2">Need help?</p>
            <p>Check your .env.local file and ensure all Firebase environment variables are set correctly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
