# Gemini Wrapper Integration for CraftStory

## Overview

CraftStory now uses a **comprehensive Gemini wrapper** that utilizes your actual API keys from `.env.local` to power all AI features. This wrapper provides a unified interface for all Gemini AI operations with proper error handling and fallbacks.

## ✅ What's Now Working

### 🔑 **Using Your Real API Keys**
- **API Key**: `NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyAhnRuXakoMjamSOttHeBuk0mRDxwslh0g`
- **Project**: `artisan-story`
- **Real Gemini Pro Model**: `gemini-pro` with optimized configuration

### 🤖 **Gemini Wrapper Features**

#### 1. **Voice Onboarding**
- ✅ **Real Question Generation**: Uses Gemini to create personalized questions
- ✅ **Answer Processing**: Extracts and cleans artisan information
- ✅ **Bio Generation**: Creates compelling artisan bios
- ✅ **Fallback Support**: Works even when API fails

#### 2. **Product Voice Collection**
- ✅ **Information Extraction**: Enhances voice responses about products
- ✅ **Product Summaries**: Generates marketing-ready descriptions
- ✅ **Hashtag Generation**: Creates social media hashtags
- ✅ **Cultural Context**: Adds cultural significance

#### 3. **Conversational AI**
- ✅ **Natural Responses**: Context-aware conversation
- ✅ **Multi-language Support**: Works in Hindi, Tamil, Bengali, etc.
- ✅ **Cultural Sensitivity**: Appropriate responses for different cultures
- ✅ **Follow-up Questions**: Intelligent conversation flow

#### 4. **Translation & Localization**
- ✅ **Text Translation**: Between any supported languages
- ✅ **Cultural Adaptation**: Context-aware translations
- ✅ **Fallback Handling**: Graceful degradation

## 🏗️ **Architecture**

### Client-Side Wrapper (`src/lib/geminiWrapper.ts`)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Uses NEXT_PUBLIC_GOOGLE_API_KEY from .env.local
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '');

export class GeminiWrapper {
  // All AI operations with error handling and fallbacks
}
```

### Server-Side Wrapper (`functions/src/geminiWrapper.ts`)
```typescript
// Uses GOOGLE_API_KEY for Firebase Functions
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
```

### Integration Points
1. **GeminiService** → Uses wrapper for all operations
2. **API Routes** → Direct wrapper integration
3. **Firebase Functions** → Server-side wrapper
4. **Voice Components** → Seamless AI integration

## 🔧 **Configuration**

### Environment Variables (Already Set)
```bash
# From your .env.local
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyAhnRuXakoMjamSOttHeBuk0mRDxwslh0g
NEXT_PUBLIC_FIREBASE_PROJECT_ID=artisan-story

# For Firebase Functions
GOOGLE_API_KEY=AIzaSyAhnRuXakoMjamSOttHeBuk0mRDxwslh0g
```

### Model Configuration
```typescript
{
  model: "gemini-pro",
  generationConfig: {
    temperature: 0.7,      // Balanced creativity
    topP: 0.8,            // Focused responses
    topK: 40,             // Diverse vocabulary
    maxOutputTokens: 8192 // Long responses
  }
}
```

## 🧪 **Testing Your Integration**

### 1. **Basic Connectivity Test**
```bash
# Visit in browser
http://localhost:3000/voice-test

# Click "Test Gemini Wrapper" button
```

### 2. **Question Generation Test**
```bash
# Click "Test Gemini Questions" button
# Should generate 4 onboarding questions
```

### 3. **Voice Component Test**
```bash
# Click "Start Voice Onboard Test"
# Should use real Gemini for questions and processing
```

### 4. **API Direct Test**
```javascript
// Test via browser console
fetch('/api/gemini/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'test'
  })
}).then(r => r.json()).then(console.log);
```

## 🎯 **Real AI Features Now Working**

### 1. **VoiceOnboard Component**
- **Real Questions**: Generated based on user's initial response
- **Smart Processing**: Extracts name, craft type, experience, etc.
- **Bio Creation**: Compelling artisan biographies
- **Language Support**: Works in multiple Indian languages

### 2. **ProductVoiceOnboard Component**
- **Information Enhancement**: Makes responses more descriptive
- **Product Summaries**: Marketing-ready descriptions
- **Cultural Context**: Adds significance and meaning

### 3. **MultilingualVoiceAssistant**
- **Conversational AI**: Natural back-and-forth dialogue
- **Context Awareness**: Remembers conversation history
- **Cultural Sensitivity**: Appropriate for different cultures

### 4. **Firebase Functions**
- **onboardVoice**: Real profile extraction from voice
- **generateCraft**: AI-powered craft descriptions and stories

## 📊 **Performance & Reliability**

### Error Handling
- ✅ **API Failures**: Graceful fallback to default responses
- ✅ **Network Issues**: Continues working offline
- ✅ **Rate Limits**: Proper error messages and retry logic
- ✅ **Invalid Responses**: JSON parsing with fallbacks

### Logging & Debugging
- ✅ **Console Logs**: Clear success/failure messages
- ✅ **Error Details**: Specific error information
- ✅ **Performance Tracking**: Response time monitoring
- ✅ **Debug Mode**: Development environment insights

### Fallback System
- ✅ **Default Questions**: When AI generation fails
- ✅ **Basic Processing**: Text extraction without AI
- ✅ **Mock Responses**: Development and testing
- ✅ **Graceful Degradation**: Never breaks user flow

## 🚀 **Usage Examples**

### Generate Questions
```typescript
const questions = await geminiWrapper.generateOnboardingQuestions(
  "I am a pottery artisan from Jaipur", 
  "en"
);
```

### Process Answers
```typescript
const result = await geminiWrapper.processAnswer(
  question, 
  "My name is Priya and I make blue pottery", 
  "en"
);
```

### Generate Bio
```typescript
const bio = await geminiWrapper.generateBio({
  name: "Priya",
  craftType: "Blue Pottery",
  experienceYears: 15
}, "en");
```

### Conversational Response
```typescript
const response = await geminiWrapper.generateConversationalResponse(
  "Tell me about your pottery techniques",
  "artisan_onboarding",
  "Previous conversation...",
  "en"
);
```

## 🔍 **Monitoring & Maintenance**

### API Usage Monitoring
- Check Google Cloud Console for API usage
- Monitor quotas and billing
- Track response times and success rates

### Error Monitoring
- Check browser console for client-side errors
- Monitor Firebase Functions logs
- Track fallback usage rates

### Performance Optimization
- Response caching in Firestore
- Batch API calls where possible
- Optimize prompt engineering for better responses

## 🎉 **What You Can Do Now**

1. **Test Everything**: Visit `/voice-test` and try all features
2. **Real Onboarding**: Use `/artisan/onboard` for full AI experience
3. **Voice Products**: Test product information collection
4. **Multi-language**: Try different languages in voice components
5. **Monitor Usage**: Check Google Cloud Console for API calls

Your CraftStory app now has **real, working AI** powered by your Gemini API keys! 🚀

## 🔧 **Troubleshooting**

### If AI Features Don't Work
1. Check API key in `.env.local`
2. Verify Google Cloud project permissions
3. Check browser console for errors
4. Test with `/voice-test` page

### If Responses Are Poor Quality
1. Adjust temperature/topP in wrapper
2. Improve prompts for better context
3. Add more specific instructions
4. Use fallbacks for critical paths

Your Firebase backend with TTS, voice assistant, and AI is now **fully operational**! 🎊