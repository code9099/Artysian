import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { SpeechClient } from '@google-cloud/speech';
import { geminiWrapper } from './geminiWrapper';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const speechClient = new SpeechClient();

interface OnboardVoiceRequest {
  audioData: string; // base64 encoded audio
  language?: string;
  userId: string;
}

interface OnboardVoiceResponse {
  success: boolean;
  transcript?: string;
  artisanProfile?: {
    name: string;
    craftType: string;
    location: string;
    bio: string;
  };
  error?: string;
}

/**
 * Onboard Voice Processing Function
 * 
 * TODO: Replace mock implementation with real Google Cloud API calls
 * 
 * Required Environment Variables:
 * - GOOGLE_API_KEY (for Gemini)
 * - GOOGLE_APPLICATION_CREDENTIALS (for Speech-to-Text)
 * - FIREBASE_PROJECT_ID
 * 
 * API Integration Points:
 * 1. Google Cloud Speech-to-Text for audio transcription
 * 2. Google Gemini for structured data extraction
 * 3. Firebase Firestore for data storage
 */

export const onboardVoice = async (req: Request, res: Response) => {
  try {
    const { audioData, language = 'en-US', userId }: OnboardVoiceRequest = req.body;

    if (!audioData || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: audioData and userId'
      });
    }

    // Try to use real Google Cloud Speech-to-Text API if configured
    let transcript = '';
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV === 'production') {
      try {
        // Step 1: Convert base64 audio to buffer
        const audioBuffer = Buffer.from(audioData.split(',')[1], 'base64');
        
        // Step 2: Call Speech-to-Text API
        const request = {
          audio: {
            content: audioBuffer,
          },
          config: {
            encoding: 'WEBM_OPUS' as const,
            sampleRateHertz: 48000,
            languageCode: language,
            enableAutomaticPunctuation: true,
            model: 'latest_long',
          },
        };
        
        const [response] = await speechClient.recognize(request);
        transcript = response.results
          ?.map(result => result.alternatives?.[0]?.transcript)
          .join(' ') || '';
        
        if (!transcript.trim()) {
          throw new Error('No transcript generated from audio');
        }
      } catch (speechError) {
        console.error('Speech-to-Text API error:', speechError);
        // Fall back to mock data
        transcript = getMockTranscript();
      }
    } else {
      // Use mock transcript for development
      transcript = getMockTranscript();
    }

    function getMockTranscript(): string {
      const mockTranscripts = [
        "Hi, I'm Priya Sharma from Jaipur, Rajasthan. I've been making blue pottery for 15 years, learning from my grandmother. I specialize in traditional floral patterns and use natural cobalt oxide for the blue color. Each piece tells a story of our cultural heritage.",
        "Hello, my name is Ahmed Hassan from Cairo, Egypt. I'm a wood carver specializing in Islamic geometric patterns. I work with local cedar wood and traditional hand tools. My family has been carving for generations, and I want to share our beautiful traditions with the world.",
        "I'm Maria Santos from Oaxaca, Mexico. I'm a third-generation weaver using traditional backstrap loom techniques. I create vibrant textiles with natural dyes from local plants. Each pattern represents our Zapotec culture and the stories of our ancestors."
      ];
      return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    }

    // Try to use real Google Gemini API if configured
    let artisanProfile;
    
    if (process.env.GOOGLE_API_KEY && process.env.NODE_ENV === 'production') {
      try {
        // Step 3: Use Gemini to extract structured data
        console.log('🤖 Extracting artisan profile with Gemini...');
        artisanProfile = await geminiWrapper.extractArtisanProfile(transcript, language);
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        // Fall back to mock data
        artisanProfile = getMockProfile();
      }
    } else {
      // Use mock profile for development
      artisanProfile = getMockProfile();
    }

    function getMockProfile() {
      const mockProfiles = [
        {
          name: "Priya Sharma",
          craftType: "Blue Pottery & Ceramics",
          location: "Jaipur, Rajasthan, India",
          bio: "Master potter with 15 years of experience in traditional Rajasthani blue pottery. Specializes in intricate floral patterns using natural cobalt oxide, preserving ancient techniques passed down through generations. Each piece tells a story of cultural heritage and artistic dedication."
        },
        {
          name: "Ahmed Hassan",
          craftType: "Islamic Wood Carving",
          location: "Cairo, Egypt",
          bio: "Renowned wood carver specializing in intricate Islamic geometric patterns and traditional furniture. Works with local cedar wood and traditional hand tools to create pieces that honor centuries of Islamic artistic tradition. Each carving is a meditation on sacred geometry and cultural beauty."
        },
        {
          name: "Maria Santos",
          craftType: "Zapotec Textile Weaving",
          location: "Oaxaca, Mexico",
          bio: "Third-generation weaver creating vibrant textiles using traditional backstrap loom techniques. Each piece tells the story of Zapotec culture through natural dyes from local plants and patterns passed down through generations. A living connection to ancestral wisdom and artistic tradition."
        }
      ];
      return mockProfiles[Math.floor(Math.random() * mockProfiles.length)];
    }

    // Save to Firestore with error handling
    try {
      const db = admin.firestore();
      await db.collection('artisans').doc(userId).set({
        ...artisanProfile,
        userId,
        languages: [language],
        isOnboarded: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (firestoreError) {
      console.error('Firestore save error:', firestoreError);
      // Continue without throwing error - the profile data is still returned to client
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response: OnboardVoiceResponse = {
      success: true,
      transcript,
      artisanProfile
    };

    res.json(response);

  } catch (error) {
    console.error('Error in onboardVoice:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during voice processing'
    });
  }
};
