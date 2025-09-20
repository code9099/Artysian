import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Initialize TTS client with proper error handling
let ttsClient: TextToSpeechClient;
try {
  ttsClient = new TextToSpeechClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? undefined : {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }
  });
  console.log('TTS client initialized successfully');
} catch (error) {
  console.error('Failed to initialize TTS client:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Check if TTS client is initialized
    if (!ttsClient) {
      console.error('TTS client not initialized');
      return NextResponse.json({ 
        error: 'Text-to-Speech service not available. Please check configuration.' 
      }, { status: 503 });
    }

    const { text, languageCode } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // For development, return a mock audio response
    if (process.env.NODE_ENV === 'development' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Development mode: returning mock audio');
      
      // Create a simple mock audio data URI (silent audio)
      const mockAudioBase64 = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      const audioDataUri = `data:audio/wav;base64,${mockAudioBase64}`;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return NextResponse.json({ audioDataUri });
    }

    const request_config = {
      input: { text },
      voice: {
        languageCode: languageCode || 'en-US',
        ssmlGender: 'NEUTRAL' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
      },
    };

    console.log('Sending request to Google TTS API...');
    const [response] = await ttsClient.synthesizeSpeech(request_config);
    const audioContent = response.audioContent;

    if (!audioContent) {
      throw new Error('No audio content received');
    }

    // Convert to base64 for client
    const base64Audio = Buffer.from(audioContent).toString('base64');
    const audioDataUri = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({ audioDataUri });

  } catch (error) {
    console.error('Text-to-Speech error:', error);
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to synthesize speech',
        details: errorMessage,
        suggestion: 'Please check your Google Cloud credentials and API access'
      },
      { status: 500 }
    );
  }
}
