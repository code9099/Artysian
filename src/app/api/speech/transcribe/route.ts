import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';

// Initialize Speech client with proper error handling
let speechClient: SpeechClient;
try {
  speechClient = new SpeechClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? undefined : {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }
  });
  console.log('Speech client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Speech client:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Check if Speech client is initialized
    if (!speechClient) {
      console.error('Speech client not initialized');
      return NextResponse.json({ 
        error: 'Speech service not available. Please check configuration.' 
      }, { status: 503 });
    }

    const { audioData, languageCode } = await request.json();

    if (!audioData) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // For development, return a mock response
    if (process.env.NODE_ENV === 'development' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Development mode: returning mock transcript');
      const mockTranscripts = [
        'This is a traditional blue pottery bowl from Rajasthan',
        'I am a skilled artisan with 15 years of experience in pottery',
        'My name is Priya and I specialize in traditional Indian crafts',
        'I use natural materials like clay and organic dyes in my work'
      ];
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({ transcript: randomTranscript });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData.split(',')[1], 'base64');

    if (audioBuffer.length === 0) {
      return NextResponse.json({ error: 'Invalid audio data' }, { status: 400 });
    }

    const request_config = {
      audio: {
        content: audioBuffer,
      },
      config: {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode: languageCode || 'en-US',
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        useEnhanced: true,
      },
    };

    console.log('Sending request to Google Speech API...');
    const [response] = await speechClient.recognize(request_config);
    
    const transcript = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join(' ')
      .trim() || '';

    console.log('Received transcript:', transcript);
    return NextResponse.json({ transcript });

  } catch (error) {
    console.error('Speech-to-Text error:', error);
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: errorMessage,
        suggestion: 'Please check your Google Cloud credentials and API access'
      },
      { status: 500 }
    );
  }
}
