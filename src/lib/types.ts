// Core data types for CraftStory application

export interface User {
  id: string;
  email: string;
  role: 'artisan' | 'explorer';
  createdAt: Date;
  updatedAt: Date;
  profile?: ArtisanProfile;
}

export interface ArtisanProfile {
  id: string;
  userId: string;
  name: string;
  craftType: string;
  location: string;
  bio: string;
  language: string; // Primary language (en, hi, ta)
  experienceYears: number;
  culturalBackground: string;
  languages: string[];
  voiceData?: string; // base64 audio data
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  questionTranslated: string;
  field: keyof ArtisanProfile;
  required: boolean;
  answered: boolean;
  answer?: string;
}

export interface LanguageConfig {
  code: string;
  name: string;
  speechCode: string; // For Speech-to-Text API
  ttsCode: string; // For Text-to-Speech API
  geminiCode: string; // For Gemini API
}

export interface Craft {
  id: string;
  artisanId: string;
  title: string;
  description: string;
  myth: string;
  story: string;
  images: string[]; // URLs to images
  culturalContext: string;
  materials: string[];
  techniques: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToComplete: string;
  location: string;
  tags: string[];
  isPublished: boolean;
  aiGenerated?: {
    descriptionGenerated: boolean;
    mythGenerated: boolean;
    storyGenerated: boolean;
    tagsGenerated: boolean;
    lastGenerated: Date;
  };
  stats?: {
    views: number;
    likes: number;
    saves: number;
    shares: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  userId: string;
  craftId: string;
  type: 'like' | 'save' | 'share' | 'view';
  createdAt: Date;
}

export interface AIJob {
  id: string;
  type: 'generate_bio' | 'generate_description' | 'suggest_captions' | 'visualize_story';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: unknown;
  output?: unknown;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI Flow Types
export interface ArtisanBioInput {
  audioDataURI?: string;
  transcript?: string;
  language?: string;
}

export interface ArtisanBioOutput {
  name: string;
  craftType: string;
  location: string;
  bio: string;
  confidence: number;
}

export interface CraftDescriptionInput {
  images: string[];
  basicInfo: {
    title: string;
    materials: string[];
    techniques: string[];
  };
  culturalContext?: string;
}

export interface CraftDescriptionOutput {
  description: string;
  myth: string;
  story: string;
  culturalContext: string;
  suggestedTags: string[];
}

export interface InstagramCaptionInput {
  craftId: string;
  imageUrl: string;
  description: string;
  tone?: 'professional' | 'casual' | 'storytelling';
}

export interface InstagramCaptionOutput {
  captions: string[];
  hashtags: string[];
  suggestedPostingTime?: string;
}

export interface VisualizeStoryInput {
  story: string;
  style?: 'traditional' | 'modern' | 'artistic';
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface VisualizeStoryOutput {
  imageUrl: string;
  prompt: string;
  style: string;
}

// Component Props Types
export interface SwipeCardData {
  id: string;
  title: string;
  description: string;
  image: string;
  artisan: {
    name: string;
    location: string;
  };
  tags: string[];
  difficulty: string;
  price?: string;
  rating?: number;
}

export interface VoiceOnboardProps {
  onTranscript: (transcript: string) => void;
  onAudioData: (audioData: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
}

export interface UploadCameraProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export interface ProductPinProps {
  craft: Craft;
  onEdit: (craft: Craft) => void;
  onPublish: (craft: Craft) => void;
  onDelete?: (craft: Craft) => void;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation Types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  badge?: string;
}

// Dashboard Card Types
export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  href: string;
  badge?: string;
  color: 'gold' | 'brown' | 'charcoal' | 'cream';
}
