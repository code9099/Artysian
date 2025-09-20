# Firestore Database Schema

This document describes the Firestore collections and their structure for the CraftStory application.

## Collections Overview

### 1. `users`
Stores basic user information and authentication data.

```typescript
interface User {
  id: string;                    // Document ID (same as Firebase Auth UID)
  email: string;
  role: 'artisan' | 'explorer';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profile?: {
    displayName?: string;
    photoURL?: string;
    preferences?: {
      language: string;
      notifications: boolean;
    };
  };
}
```

### 2. `artisans`
Stores detailed artisan profiles and onboarding information.

```typescript
interface Artisan {
  id: string;                    // Document ID (same as user ID)
  userId: string;                // Reference to users collection
  name: string;
  craftType: string;
  location: string;
  bio: string;
  language: string;              // Primary language (en, hi, ta)
  experienceYears: number;       // Years of experience
  culturalBackground: string;    // Cultural heritage and background
  languages: string[];           // Array of supported languages
  voiceData?: string;            // Base64 encoded voice sample
  isOnboarded: boolean;
  socialLinks?: {
    instagram?: string;
    website?: string;
    facebook?: string;
  };
  stats?: {
    totalCrafts: number;
    totalViews: number;
    totalLikes: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `crafts`
Stores craft items and their AI-generated content.

```typescript
interface Craft {
  id: string;                    // Document ID
  artisanId: string;             // Reference to artisans collection
  title: string;
  description: string;            // AI-generated description
  myth: string;                  // AI-generated cultural myth
  story: string;                 // AI-generated personal story
  images: string[];              // Array of image URLs
  culturalContext: string;       // AI-enhanced cultural context
  materials: string[];           // Array of materials used
  techniques: string[];          // Array of techniques used
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToComplete: string;        // Human-readable time estimate
  location: string;              // Where the craft was made
  tags: string[];                // AI-generated and manual tags
  isPublished: boolean;
  aiGenerated: {
    descriptionGenerated: boolean;
    mythGenerated: boolean;
    storyGenerated: boolean;
    tagsGenerated: boolean;
    lastGenerated: Timestamp;
  };
  stats?: {
    views: number;
    likes: number;
    saves: number;
    shares: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4. `interactions`
Tracks user interactions with crafts.

```typescript
interface Interaction {
  id: string;                    // Document ID
  userId: string;                // Reference to users collection
  craftId: string;               // Reference to crafts collection
  type: 'like' | 'save' | 'share' | 'view';
  timestamp: Timestamp;
  metadata?: {
    source?: string;             // Where the interaction came from
    duration?: number;           // For views, how long they viewed
  };
}
```

### 5. `ai_jobs`
Tracks AI processing jobs and their status.

```typescript
interface AIJob {
  id: string;                    // Document ID
  type: 'generate_bio' | 'generate_description' | 'suggest_captions' | 'visualize_story';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId: string;                // Who initiated the job
  input: any;                    // Input data for the job
  output?: any;                  // Output data from the job
  error?: string;                // Error message if failed
  processingTime?: number;       // Time taken to process in milliseconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

### 6. `story_visualizations`
Stores AI-generated story visualizations.

```typescript
interface StoryVisualization {
  id: string;                    // Document ID
  storyId: string;               // Reference to the story/craft
  userId: string;                // Who requested the visualization
  imageUrl: string;              // URL to the generated image
  prompt: string;                // Prompt used for generation
  style: 'traditional' | 'modern' | 'artistic';
  dimensions: {
    width: number;
    height: number;
  };
  createdAt: Timestamp;
}
```

### 7. `social_posts`
Stores generated social media content.

```typescript
interface SocialPost {
  id: string;                    // Document ID
  craftId: string;               // Reference to crafts collection
  artisanId: string;             // Reference to artisans collection
  platform: 'instagram' | 'facebook' | 'twitter';
  content: {
    caption: string;
    hashtags: string[];
    suggestedPostingTime?: string;
  };
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: Timestamp;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
}
```

## Indexes Required

### Composite Indexes for Queries

1. **Crafts by Artisan and Status**
   - Collection: `crafts`
   - Fields: `artisanId` (Ascending), `isPublished` (Ascending), `createdAt` (Descending)

2. **Interactions by User and Type**
   - Collection: `interactions`
   - Fields: `userId` (Ascending), `type` (Ascending), `timestamp` (Descending)

3. **Crafts by Tags and Status**
   - Collection: `crafts`
   - Fields: `tags` (Arrays), `isPublished` (Ascending), `createdAt` (Descending)

4. **AI Jobs by User and Status**
   - Collection: `ai_jobs`
   - Fields: `userId` (Ascending), `status` (Ascending), `createdAt` (Descending)

## Data Relationships

```
users (1) ←→ (1) artisans
artisans (1) ←→ (many) crafts
users (many) ←→ (many) interactions ←→ (many) crafts
crafts (1) ←→ (many) story_visualizations
crafts (1) ←→ (many) social_posts
users (1) ←→ (many) ai_jobs
```

## Security Considerations

- All collections use Firebase Security Rules for access control
- User data is isolated by user ID
- Artisans can only modify their own crafts
- Explorers can only read published crafts
- AI jobs are private to the user who created them
- Image URLs should be validated and sanitized
- All text content should be sanitized before storage

## Performance Considerations

- Use pagination for large result sets
- Implement caching for frequently accessed data
- Consider using subcollections for very large datasets
- Monitor query performance and add indexes as needed
- Use batch operations for multiple writes
- Implement proper error handling and retry logic
