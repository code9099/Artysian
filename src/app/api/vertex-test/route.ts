import { NextRequest, NextResponse } from 'next/server';
// Using the Gemini API instead of Vertex AI for consistency
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '');
    
    console.log('Testing Gemini AI...');

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
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
      message: 'Gemini AI is working correctly!',
      model: 'gemini-1.5-flash',
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini AI test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        hasApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
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

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '');

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini AI POST test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}