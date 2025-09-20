/**
 * Application constants for CraftStory
 */

// App metadata
export const APP_NAME = 'CraftStory';
export const APP_DESCRIPTION = 'AI-powered marketplace assistant for local Indian artisans';
export const APP_VERSION = '1.0.0';

// Premium theme colors (matching globals.css)
export const THEME_COLORS = {
  cream: '#FAF9F6',
  beige: '#FFF4E6', 
  charcoal: '#2B2B2B',
  brown: '#5A4634',
  gold: '#C9A227',
  goldLight: '#FFD369',
  white: '#FFFFFF',
} as const;

// Voice assistant settings
export const VOICE_CONFIG = {
  sampleRate: 48000,
  encoding: 'WEBM_OPUS',
  maxRecordingTime: 30000, // 30 seconds
  silenceThreshold: 0.01,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxImages: 5,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// API endpoints
export const API_ENDPOINTS = {
  speech: {
    transcribe: '/api/speech/transcribe',
    tts: '/api/speech/tts',
  },
  gemini: {
    process: '/api/gemini/process',
  },
  auth: {
    user: '/api/auth/user',
  },
} as const;

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Pin card dimensions for product grid
export const PIN_CARD_CONFIG = {
  minHeight: 200,
  maxHeight: 400,
  width: 280,
  gap: 16,
} as const;

// Tutorial steps
export const TUTORIAL_STEPS = [
  'welcome',
  'voice_assistant',
  'photo_upload', 
  'product_info',
  'complete'
] as const;

// Craft categories
export const CRAFT_CATEGORIES = [
  'Pottery',
  'Textiles',
  'Jewelry',
  'Woodwork',
  'Metalwork',
  'Painting',
  'Sculpture',
  'Embroidery',
  'Weaving',
  'Other'
] as const;

// Experience levels
export const EXPERIENCE_LEVELS = [
  'Beginner (0-2 years)',
  'Intermediate (3-5 years)', 
  'Advanced (6-10 years)',
  'Expert (10+ years)',
  'Master Artisan (20+ years)'
] as const;

export type CraftCategory = typeof CRAFT_CATEGORIES[number];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];
export type TutorialStep = typeof TUTORIAL_STEPS[number];