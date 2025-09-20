/**
 * Language service for managing user language preferences and translations
 */

import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseClient';
import { INDIAN_LANGUAGES, LanguageConfig, getLanguageConfig } from './languages';

export interface UserLanguagePreference {
  languageCode: string;
  region?: string;
  dateFormat?: string;
  numberFormat?: string;
  currency?: string;
  timezone?: string;
  updatedAt: Date;
}

class LanguageService {
  /**
   * Set user language preference in Firestore
   */
  async setUserLanguage(
    uid: string, 
    languageCode: string,
    preferences?: Partial<UserLanguagePreference>
  ): Promise<void> {
    try {
      const languageConfig = getLanguageConfig(languageCode);
      if (!languageConfig) {
        throw new Error(`Unsupported language: ${languageCode}`);
      }

      const updateData = {
        languageCode,
        languagePreferences: {
          languageCode,
          region: preferences?.region || languageConfig.region,
          dateFormat: preferences?.dateFormat || 'default',
          numberFormat: preferences?.numberFormat || 'default',
          currency: preferences?.currency || 'INR',
          timezone: preferences?.timezone || 'Asia/Kolkata',
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'users', uid), updateData);
    } catch (error) {
      console.error('Error setting user language:', error);
      throw new Error('Failed to set user language preference');
    }
  }

  /**
   * Get user language preference from Firestore
   */
  async getUserLanguage(uid: string): Promise<UserLanguagePreference | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      const languagePreferences = userData.languagePreferences;

      if (!languagePreferences) {
        // Return basic preference from languageCode field
        return {
          languageCode: userData.languageCode || 'en',
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        };
      }

      return {
        languageCode: languagePreferences.languageCode,
        region: languagePreferences.region,
        dateFormat: languagePreferences.dateFormat,
        numberFormat: languagePreferences.numberFormat,
        currency: languagePreferences.currency,
        timezone: languagePreferences.timezone,
        updatedAt: languagePreferences.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting user language:', error);
      return null;
    }
  }

  /**
   * Get language configuration with Google Cloud API codes
   */
  getLanguageConfig(languageCode: string): LanguageConfig | null {
    return getLanguageConfig(languageCode) || null;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return INDIAN_LANGUAGES;
  }

  /**
   * Get popular languages (first 8)
   */
  getPopularLanguages(): LanguageConfig[] {
    return INDIAN_LANGUAGES.slice(0, 8);
  }

  /**
   * Get languages by region
   */
  getLanguagesByRegion(region: string): LanguageConfig[] {
    return INDIAN_LANGUAGES.filter(lang => lang.region === region);
  }

  /**
   * Detect browser language and return supported language
   */
  detectBrowserLanguage(): LanguageConfig {
    const browserLanguage = navigator.language.split('-')[0];
    const supportedLanguage = INDIAN_LANGUAGES.find(lang => lang.code === browserLanguage);
    return supportedLanguage || INDIAN_LANGUAGES[0]; // Default to English
  }

  /**
   * Validate language code
   */
  isValidLanguageCode(languageCode: string): boolean {
    return INDIAN_LANGUAGES.some(lang => lang.code === languageCode);
  }

  /**
   * Get speech-to-text language code for Google Cloud API
   */
  getSpeechLanguageCode(languageCode: string): string {
    const config = getLanguageConfig(languageCode);
    return config?.speechCode || 'en-US';
  }

  /**
   * Get text-to-speech language code for Google Cloud API
   */
  getTTSLanguageCode(languageCode: string): string {
    const config = getLanguageConfig(languageCode);
    return config?.ttsCode || 'en-US';
  }

  /**
   * Get Gemini API language code
   */
  getGeminiLanguageCode(languageCode: string): string {
    const config = getLanguageConfig(languageCode);
    return config?.geminiCode || 'en';
  }

  /**
   * Format number according to language locale
   */
  formatNumber(number: number, languageCode: string): string {
    try {
      const config = getLanguageConfig(languageCode);
      const locale = config?.speechCode || 'en-US';
      return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  /**
   * Format currency according to language locale
   */
  formatCurrency(amount: number, languageCode: string, currency = 'INR'): string {
    try {
      const config = getLanguageConfig(languageCode);
      const locale = config?.speechCode || 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount}`;
    }
  }

  /**
   * Format date according to language locale
   */
  formatDate(date: Date, languageCode: string, options?: Intl.DateTimeFormatOptions): string {
    try {
      const config = getLanguageConfig(languageCode);
      const locale = config?.speechCode || 'en-US';
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date, languageCode: string): string {
    try {
      const config = getLanguageConfig(languageCode);
      const locale = config?.speechCode || 'en-US';
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      
      const now = new Date();
      const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
      
      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(diffInSeconds, 'second');
      } else if (Math.abs(diffInSeconds) < 3600) {
        return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
      } else if (Math.abs(diffInSeconds) < 86400) {
        return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
      } else {
        return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
      }
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  /**
   * Get language direction (LTR or RTL)
   */
  getLanguageDirection(languageCode: string): 'ltr' | 'rtl' {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
  }

  /**
   * Store guest language preference in localStorage
   */
  setGuestLanguage(languageCode: string): void {
    if (this.isValidLanguageCode(languageCode)) {
      localStorage.setItem('craftstory_guest_language', languageCode);
    }
  }

  /**
   * Get guest language preference from localStorage
   */
  getGuestLanguage(): string | null {
    return localStorage.getItem('craftstory_guest_language');
  }

  /**
   * Clear guest language preference
   */
  clearGuestLanguage(): void {
    localStorage.removeItem('craftstory_guest_language');
  }
}

export const languageService = new LanguageService();