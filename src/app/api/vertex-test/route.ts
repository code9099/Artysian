import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

export async function GET() {
  try {
    // Initialize Vertex AI with proper credentials
    const vertex_ai = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'artisan-story',
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? undefined : {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }
    });

    console.log('Testing Vertex AI with project:', process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    // Initialize the model
    const model = vertex_ai.preview.getGenerativeModel({
      model: 'gemini-1.5-flash-001',
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.8,
      },
    });

    // Test with a simple prompt
    const prompt = 'Hello! Please respond with a simple JSON object containing a greeting message and the current model you are using.';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: 'Vertex AI is working correctly!',
      project: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
      model: 'gemini-1.5-flash-001',
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vertex AI test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        project: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        location: process.env.VERTEX_AI_LOCATION || 'us-central1',
        hasServiceAccount: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasCredentialsFile: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Initialize Vertex AI
    const vertex_ai = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'artisan-story',
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? undefined : {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }
    });

    const model = vertex_ai.preview.getGenerativeModel({
      model: 'gemini-1.5-flash-001',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      prompt: prompt,
      response: text,
      model: 'gemini-1.5-flash-001',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vertex AI POST test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}