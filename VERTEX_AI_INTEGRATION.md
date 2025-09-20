# Vertex AI Integration for CraftStory

## Overview

This document explains how CraftStory now uses **Google Cloud Vertex AI** instead of the basic Gemini API for all AI-powered features. This provides better performance, reliability, and enterprise-grade capabilities.

## What Changed

### Before (❌ Old Implementation)
- Used `@google/generative-ai` client library
- Basic Gemini API with limited configuration
- No proper service account authentication
- Limited to simple API key authentication

### After (✅ New Implementation)
- Uses `@google-cloud/vertexai` enterprise library
- Full Vertex AI integration with advanced configuration
- Proper service account authentication
- Enterprise-grade security and reliability

## Key Features Enabled

### 1. **Vertex AI Gemini Models**
- **Model**: `gemini-1.5-flash-001` (latest and most capable)
- **Advanced Configuration**: Custom temperature, top-p, max tokens
- **Better Performance**: Optimized for production workloads

### 2. **Proper Authentication**
- Service account-based authentication
- Environment variable fallbacks
- Secure credential management

### 3. **Enhanced Error Handling**
- Comprehensive error reporting
- Fallback mechanisms
- Debug information for troubleshooting

## Configuration

### Environment Variables Required

```bash
# Google Cloud Project
GOOGLE_CLOUD_PROJECT_ID=artisan-story

# Vertex AI Configuration
VERTEX_AI_LOCATION=us-central1

# Service Account Credentials (Option 1: File)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Service Account Credentials (Option 2: Environment Variables)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@artisan-story.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_PRIVATE_KEY]\n-----END PRIVATE KEY-----\n"
```

### Service Account Permissions Required

Your service account needs these IAM roles:
- `Vertex AI User` - For Gemini API access
- `Speech-to-Text API User` - For voice transcription
- `Text-to-Speech API User` - For voice synthesis
- `Firebase Admin` - For Firestore and Storage access

## API Endpoints Updated

### 1. `/api/gemini/process` - Main AI Processing
- **Before**: Basic Gemini API
- **After**: Full Vertex AI with advanced configuration
- **Features**: Question generation, bio creation, conversation processing

### 2. `/api/speech/transcribe` - Speech-to-Text
- **Enhanced**: Better service account authentication
- **Fallbacks**: Environment variable credentials

### 3. `/api/speech/tts` - Text-to-Speech
- **Enhanced**: Better service account authentication
- **Fallbacks**: Environment variable credentials

### 4. `/api/vertex-test` - New Testing Endpoint
- **Purpose**: Validate Vertex AI configuration
- **Methods**: GET (simple test), POST (custom prompts)

## Firebase Functions Updated

### 1. `onboardVoice` Function
- **Before**: Mock data only
- **After**: Real Vertex AI integration with fallbacks
- **Features**: Artisan profile extraction from voice

### 2. `generateCraft` Function
- **Before**: Mock data only
- **After**: Real Vertex AI integration with fallbacks
- **Features**: Craft description and story generation

## Testing and Validation

### 1. **Validation Script**
```bash
npm run validate-vertex
```
This checks:
- Environment variables
- Service account file
- Package dependencies
- Configuration completeness

### 2. **API Testing**
Visit `/api/vertex-test` to test Vertex AI directly:
- GET: Simple connectivity test
- POST: Custom prompt testing

### 3. **Component Testing**
Visit `/voice-test` to test all voice components:
- VoiceOnboard component
- ProductVoiceOnboard component
- All API integrations

## Voice Components Enhanced

### 1. **VoiceOnboard Component**
- **Real AI**: Uses Vertex AI for question generation
- **Fallbacks**: Default questions when AI fails
- **Error Handling**: Graceful degradation

### 2. **ProductVoiceOnboard Component**
- **Real AI**: Uses Vertex AI for information extraction
- **Fallbacks**: Basic text processing when AI fails
- **Error Handling**: Continues workflow even with AI failures

## Production Deployment

### 1. **Environment Setup**
Ensure all environment variables are set in your production environment:
- Vercel: Add to Environment Variables
- Firebase Hosting: Use `firebase functions:config:set`
- Other platforms: Follow their environment variable setup

### 2. **Service Account**
- Upload `service-account.json` securely
- Or use environment variables for credentials
- Ensure proper IAM permissions

### 3. **API Quotas**
Monitor your Google Cloud quotas:
- Vertex AI API calls
- Speech-to-Text API calls
- Text-to-Speech API calls

## Monitoring and Debugging

### 1. **Logs**
Check logs for:
- Vertex AI initialization messages
- API call success/failure
- Authentication issues

### 2. **Error Handling**
The system includes comprehensive error handling:
- API failures fall back to mock data
- Authentication errors are logged clearly
- Network issues don't crash the application

### 3. **Debug Mode**
In development, debug information is shown:
- API configuration details
- Authentication status
- Model responses

## Cost Optimization

### 1. **Model Selection**
- Using `gemini-1.5-flash-001` for optimal cost/performance
- Configured with appropriate token limits

### 2. **Caching**
- Results are cached in Firestore
- Reduces redundant API calls

### 3. **Fallbacks**
- Mock data prevents unnecessary API calls during development
- Graceful degradation reduces failed API charges

## Security

### 1. **Authentication**
- Service account-based (not API keys)
- Proper credential rotation support
- Environment-based configuration

### 2. **Data Privacy**
- No sensitive data logged
- Proper error message sanitization
- Secure credential handling

## Next Steps

1. **Test the Integration**: Run `npm run validate-vertex`
2. **Test Components**: Visit `/voice-test`
3. **Monitor Usage**: Check Google Cloud Console
4. **Scale as Needed**: Adjust quotas and limits

Your CraftStory app now has enterprise-grade AI capabilities powered by Google Cloud Vertex AI! 🚀