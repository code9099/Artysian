'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { INDIAN_LANGUAGES, LanguageConfig } from '@/lib/languages';
import { CheckCircle, ArrowRight, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function LanguageSelectPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUserLanguage, user } = useAuth();
  const router = useRouter();

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleContinue = async () => {
    if (!selectedLanguage) {
      toast.error('Please select a language');
      return;
    }

    try {
      setIsLoading(true);
      
      if (user && !user.isGuest) {
        await setUserLanguage(selectedLanguage);
        // The setUserLanguage method will handle the redirect
      } else {
        // Store in localStorage for guest users
        localStorage.setItem('craftstory_guest_language', selectedLanguage);
        toast.success(`Language set to ${INDIAN_LANGUAGES.find(l => l.code === selectedLanguage)?.name}`);
        
        // Manual redirect for guest users
        const guestRole = localStorage.getItem('craftstory_guest_role');
        if (guestRole === 'artisan') {
          // Redirect to voice-guided onboarding
          router.push('/artisan/voice-onboard');
        } else if (guestRole === 'explorer') {
          router.push('/explore');
        } else {
          router.push('/role-select');
        }
      }
    } catch (error) {
      console.error('Error setting language:', error);
      toast.error('Failed to set language. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const popularLanguages = INDIAN_LANGUAGES.slice(0, 8);
  const otherLanguages = INDIAN_LANGUAGES.slice(8);

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <Globe className="w-16 h-16 text-gold mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-charcoal font-serif">
              Choose Your Language
            </h1>
          </div>
          <p className="text-xl text-brown max-w-3xl mx-auto leading-relaxed">
            Select your preferred language for the best CraftStory experience. 
            You can change this later in settings.
          </p>
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-yellow-100 rounded-xl text-sm text-left max-w-md mx-auto border border-yellow-200">
              <strong>Debug Info:</strong><br/>
              User Role: {user?.role || 'Not set'}<br/>
              Is Guest: {user?.isGuest ? 'Yes' : 'No'}<br/>
              User ID: {user?.uid || 'Not logged in'}
            </div>
          )}
        </div>

        {/* Popular Languages */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-charcoal mb-8 font-serif text-center">
            Popular Languages
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {popularLanguages.map((language) => (
              <LanguageCard
                key={language.code}
                language={language}
                isSelected={selectedLanguage === language.code}
                onClick={() => handleLanguageSelect(language.code)}
              />
            ))}
          </div>
        </div>

        {/* Other Languages */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-charcoal mb-8 font-serif text-center">
            All Languages
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {otherLanguages.map((language) => (
              <LanguageCard
                key={language.code}
                language={language}
                isSelected={selectedLanguage === language.code}
                onClick={() => handleLanguageSelect(language.code)}
              />
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center mb-12">
          <Button
            size="lg"
            className="bg-gold hover:bg-gold-light text-charcoal text-xl px-16 py-4 font-semibold shadow-lg"
            onClick={handleContinue}
            disabled={!selectedLanguage || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-charcoal mr-3"></div>
                Setting Language...
              </div>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-3 w-6 h-6" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LanguageCardProps {
  language: LanguageConfig;
  isSelected: boolean;
  onClick: () => void;
}

function LanguageCard({ language, isSelected, onClick }: LanguageCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all duration-300 text-center group hover:scale-105 ${
        isSelected
          ? 'border-gold bg-gold-light shadow-lg'
          : 'border-beige bg-cream hover:border-gold hover:shadow-md'
      }`}
    >
      <div className="text-3xl mb-2">{language.flag}</div>
      <div className="font-semibold text-charcoal text-sm mb-1">
        {language.name}
      </div>
      <div className="text-xs text-brown">
        {language.nativeName}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {language.region}
      </div>
      {isSelected && (
        <CheckCircle className="w-5 h-5 text-gold mx-auto mt-2" />
      )}
    </button>
  );
}
