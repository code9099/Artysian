'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { INDIAN_LANGUAGES, LanguageConfig, getLanguageConfig } from '@/lib/languages';

interface LanguageContextType {
  currentLanguage: LanguageConfig;
  setLanguage: (languageCode: string) => Promise<void>;
  availableLanguages: LanguageConfig[];
  isRTL: boolean;
  translate: (key: string, fallback?: string) => string;
  formatNumber: (number: number) => string;
  formatDate: (date: Date) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Basic translations for common UI elements
const translations: Record<string, Record<string, string>> = {
  en: {
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.continue': 'Continue',
    'auth.signIn': 'Sign In',
    'auth.signOut': 'Sign Out',
    'auth.guest': 'Guest',
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'craft.title': 'Title',
    'craft.description': 'Description',
    'craft.materials': 'Materials',
    'craft.price': 'Price',
    'craft.location': 'Location',
  },
  hi: {
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.previous': 'पिछला',
    'common.continue': 'जारी रखें',
    'auth.signIn': 'साइन इन करें',
    'auth.signOut': 'साइन आउट करें',
    'auth.guest': 'अतिथि',
    'nav.home': 'होम',
    'nav.explore': 'खोजें',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.profile': 'प्रोफ़ाइल',
    'craft.title': 'शीर्षक',
    'craft.description': 'विवरण',
    'craft.materials': 'सामग्री',
    'craft.price': 'मूल्य',
    'craft.location': 'स्थान',
  },
  ta: {
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'பிழை',
    'common.success': 'வெற்றி',
    'common.cancel': 'ரத்து செய்',
    'common.save': 'சேமி',
    'common.delete': 'நீக்கு',
    'common.edit': 'திருத்து',
    'common.back': 'பின்',
    'common.next': 'அடுத்து',
    'common.previous': 'முந்தைய',
    'common.continue': 'தொடர்',
    'auth.signIn': 'உள்நுழை',
    'auth.signOut': 'வெளியேறு',
    'auth.guest': 'விருந்தினர்',
    'nav.home': 'முகப்பு',
    'nav.explore': 'ஆராய்',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.profile': 'சுயவிவரம்',
    'craft.title': 'தலைப்பு',
    'craft.description': 'விளக்கம்',
    'craft.materials': 'பொருட்கள்',
    'craft.price': 'விலை',
    'craft.location': 'இடம்',
  },
  // Add more languages as needed
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentLanguageCode, setCurrentLanguageCode] = useState<string>('en');

  // Initialize language from user preferences or localStorage
  useEffect(() => {
    let languageCode = 'en'; // Default

    if (user && !user.isGuest && user.languageCode) {
      languageCode = user.languageCode;
    } else if (user?.isGuest) {
      // Check localStorage for guest language
      const guestLanguage = localStorage.getItem('craftstory_guest_language');
      if (guestLanguage) {
        languageCode = guestLanguage;
      }
    } else {
      // Check browser language
      const browserLanguage = navigator.language.split('-')[0];
      const supportedLanguage = INDIAN_LANGUAGES.find(lang => lang.code === browserLanguage);
      if (supportedLanguage) {
        languageCode = browserLanguage;
      }
    }

    setCurrentLanguageCode(languageCode);
  }, [user]);

  const currentLanguage = getLanguageConfig(currentLanguageCode) || INDIAN_LANGUAGES[0];

  const setLanguage = async (languageCode: string) => {
    const languageConfig = getLanguageConfig(languageCode);
    if (!languageConfig) {
      throw new Error('Unsupported language');
    }

    setCurrentLanguageCode(languageCode);

    // Update user language preference
    if (user && !user.isGuest) {
      try {
        // Use authService to update language
        // await authService.setUserLanguage(user.uid, languageCode);
      } catch (error) {
        console.error('Failed to update user language:', error);
      }
    } else if (user?.isGuest) {
      // Store in localStorage for guest users
      localStorage.setItem('craftstory_guest_language', languageCode);
    }

    // Update document language attribute
    document.documentElement.lang = languageCode;
  };

  const translate = (key: string, fallback?: string): string => {
    const languageTranslations = translations[currentLanguageCode] || translations.en;
    return languageTranslations[key] || fallback || key;
  };

  const formatNumber = (number: number): string => {
    try {
      return new Intl.NumberFormat(currentLanguage.speechCode).format(number);
    } catch (error) {
      return number.toString();
    }
  };

  const formatDate = (date: Date): string => {
    try {
      return new Intl.DateTimeFormat(currentLanguage.speechCode, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  };

  // Check if language is right-to-left
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(currentLanguageCode);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    availableLanguages: INDIAN_LANGUAGES,
    isRTL,
    translate,
    formatNumber,
    formatDate,
  };

  return (
    <LanguageContext.Provider value={value}>
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for translation
export function useTranslation() {
  const { translate, currentLanguage } = useLanguage();
  
  return {
    t: translate,
    language: currentLanguage,
  };
}