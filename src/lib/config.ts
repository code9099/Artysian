/**
 * Configuration validation and setup for CraftStory app
 * Ensures all required environment variables and services are properly configured
 */

export interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  googleCloud: {
    apiKey: string;
    projectId: string;
    location: string;
  };
  features: {
    voiceAssistant: boolean;
    speechToText: boolean;
    textToSpeech: boolean;
    geminiAI: boolean;
    visionAPI: boolean;
    pwa: boolean;
  };
  environment: 'development' | 'production' | 'test';
}

/**
 * Validate and return app configuration
 */
export function getAppConfig(): AppConfig {
  const config: AppConfig = {
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
    googleCloud: {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
    },
    features: {
      voiceAssistant: true,
      speechToText: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      textToSpeech: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      geminiAI: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      visionAPI: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      pwa: process.env.NODE_ENV === 'production',
    },
    environment: (process.env.NODE_ENV as any) || 'development',
  };

  return config;
}

/**
 * Validate that all required configuration is present
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const config = getAppConfig();
  const errors: string[] = [];

  // Validate Firebase configuration
  if (!config.firebase.apiKey) errors.push('Missing NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!config.firebase.authDomain) errors.push('Missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!config.firebase.projectId) errors.push('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!config.firebase.storageBucket) errors.push('Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!config.firebase.messagingSenderId) errors.push('Missing NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!config.firebase.appId) errors.push('Missing NEXT_PUBLIC_FIREBASE_APP_ID');

  // Validate Google Cloud configuration
  if (!config.googleCloud.apiKey) errors.push('Missing NEXT_PUBLIC_GOOGLE_API_KEY');
  if (!config.googleCloud.projectId) errors.push('Missing GOOGLE_CLOUD_PROJECT_ID');

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get feature flags based on configuration
 */
export function getFeatureFlags() {
  const config = getAppConfig();
  return config.features;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

/**
 * Premium theme configuration
 */
export const THEME_CONFIG = {
  colors: {
    primary: {
      cream: '#FAF9F6',
      beige: '#FFF4E6',
      gold: '#C9A227',
      goldLight: '#FFD369',
    },
    neutral: {
      charcoal: '#2B2B2B',
      brown: '#5A4634',
      white: '#FFFFFF',
    },
  },
  fonts: {
    sans: ['Poppins', 'system-ui', 'sans-serif'],
    serif: ['Literata', 'serif'],
  },
  spacing: {
    unit: 8, // Base spacing unit in pixels
  },
  borderRadius: {
    default: '12px',
    card: '16px',
    button: '8px',
  },
  shadows: {
    card: '0 4px 12px rgba(139, 69, 19, 0.1)',
    elevated: '0 8px 24px rgba(139, 69, 19, 0.15)',
  },
} as const;

export default getAppConfig;