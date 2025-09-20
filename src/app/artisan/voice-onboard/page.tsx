'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CraftVoiceAssistant } from '@/components/CraftVoiceAssistant';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, Volume2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getLanguageConfig } from '@/lib/languages';

interface SessionData {
  sessionId: string;
  artisanId: string;
  language: string;
  currentStep: string;
  responses: Array<{
    step: string;
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  productImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function VoiceOnboardPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Get language from localStorage or user profile
  useEffect(() => {
    const storedLanguage = localStorage.getItem('craftstory_guest_language') || 
                          localStorage.getItem('craftstory_selected_language') ||
                          user?.languageCode || 
                          'en';
    setSelectedLanguage(storedLanguage);
  }, [user]);

  const languageConfig = getLanguageConfig(selectedLanguage);

  const handleStart = () => {
    setIsReady(true);
    setShowVoiceAssistant(true);
  };

  const handleComplete = (sessionData: SessionData) => {
    // Store session data
    localStorage.setItem('craftstory_voice_session', JSON.stringify(sessionData));
    
    // Redirect to dashboard
    router.push('/artisan/dashboard');
  };

  const handleStop = () => {
    setShowVoiceAssistant(false);
    setIsReady(false);
  };

  const handleManualMode = () => {
    router.push('/artisan/onboard');
  };

  if (!isReady) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={['artisan']} redirectTo="/role-select" guestAllowed={false}>
        <div className="min-h-screen bg-gradient-warm py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="text-center">
                <h1 className="text-3xl font-bold text-charcoal font-serif">
                  Voice-Guided Product Listing
                </h1>
                <p className="text-brown">
                  Let our AI assistant help you list your craft in {languageConfig?.name}
                </p>
              </div>
              
              <div></div> {/* Spacer for flex layout */}
            </div>

            {/* Welcome Card */}
            <div className="bg-cream rounded-3xl p-8 shadow-lg text-center mb-8">
              <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-charcoal" />
              </div>
              
              <h2 className="text-2xl font-bold text-charcoal mb-4 font-serif">
                Welcome to CraftVoice Assistant!
              </h2>
              
              <p className="text-lg text-brown mb-6 max-w-2xl mx-auto">
                I'm your friendly AI assistant who will help you create a beautiful listing for your craft. 
                We'll have a natural conversation in <strong>{languageConfig?.name}</strong>, and I'll guide you through each step.
              </p>

              {/* What to Expect */}
              <div className="bg-beige/50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">What to expect:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start space-x-3">
                    <Volume2 className="w-5 h-5 text-gold mt-1" />
                    <div>
                      <h4 className="font-medium text-charcoal">Voice Conversation</h4>
                      <p className="text-sm text-brown">I'll speak to you in {languageConfig?.name} and listen to your responses</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Mic className="w-5 h-5 text-gold mt-1" />
                    <div>
                      <h4 className="font-medium text-charcoal">Natural Responses</h4>
                      <p className="text-sm text-brown">Just speak naturally - I'll understand and ask follow-up questions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps Preview */}
              <div className="bg-white/50 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-charcoal mb-4">We'll cover these steps:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-charcoal font-bold">1</span>
                    </div>
                    <p className="text-brown">Product Photos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-charcoal font-bold">2</span>
                    </div>
                    <p className="text-brown">Materials Used</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-charcoal font-bold">3</span>
                    </div>
                    <p className="text-brown">Craft Story</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-charcoal font-bold">4</span>
                    </div>
                    <p className="text-brown">Pricing & Shipping</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="bg-gold hover:bg-gold-light text-charcoal text-lg px-8 py-4"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Start Voice Assistant
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleManualMode}
                  className="border-brown text-brown hover:bg-brown hover:text-cream text-lg px-8 py-4"
                >
                  Use Manual Mode Instead
                </Button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gold/10 rounded-2xl p-6 border border-gold/20">
              <h3 className="text-lg font-semibold text-charcoal mb-3">Tips for the best experience:</h3>
              <ul className="space-y-2 text-brown">
                <li className="flex items-start space-x-2">
                  <span className="text-gold">•</span>
                  <span>Make sure you're in a quiet environment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-gold">•</span>
                  <span>Speak clearly and at a normal pace</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-gold">•</span>
                  <span>Have your craft ready for photos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-gold">•</span>
                  <span>You can say "skip" to move to the next question</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-gold">•</span>
                  <span>You can stop the assistant anytime and continue manually</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['artisan']} redirectTo="/role-select" guestAllowed={false}>
      <div className="min-h-screen bg-gradient-warm py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={handleStop}
              className="border-brown text-brown hover:bg-brown hover:text-cream"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Stop & Go Back
            </Button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-charcoal font-serif">
                Voice-Guided Product Listing
              </h1>
              <p className="text-brown">
                Speaking in {languageConfig?.name}
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleManualMode}
              className="border-gold text-gold hover:bg-gold hover:text-charcoal"
            >
              Switch to Manual
            </Button>
          </div>

          {/* Voice Assistant */}
          {showVoiceAssistant && (
            <CraftVoiceAssistant
              language={selectedLanguage}
              artisanId={user?.uid || 'demo-user'}
              onComplete={handleComplete}
              onStop={handleStop}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}