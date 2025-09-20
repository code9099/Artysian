import { NextRequest, NextResponse } from 'next/server';
import { geminiWrapper } from '@/lib/geminiWrapper';

export async function POST(request: NextRequest) {
  try {
    const { transcript, languageCode, userId, question, answer, action, profileData, text: inputText, fromLanguage, toLanguage, currentProfile, context, conversationHistory } = await request.json();

    console.log('🤖 Gemini API called with action:', action);

    // Handle different actions using the wrapper
    switch (action) {
      case 'generateQuestions':
        const questions = await geminiWrapper.generateOnboardingQuestions(transcript, languageCode);
        return NextResponse.json({
          type: 'questions',
          questions: questions
        });

      case 'generateBio':
        const bio = await geminiWrapper.generateBio(profileData, languageCode);
        return NextResponse.json({
          type: 'bio',
          bio: bio
        });

      case 'translate':
        const translatedText = await geminiWrapper.translateText(inputText, fromLanguage, toLanguage);
        return NextResponse.json({
          type: 'translation',
          translatedText: translatedText
        });

      case 'extractProductInfo':
        const extractedInfo = await geminiWrapper.extractProductInfo(transcript, question);
        return NextResponse.json({
          type: 'productInfo',
          extractedInfo: extractedInfo
        });

      case 'generateProductSummary':
        const summary = await geminiWrapper.generateProductSummary(profileData);
        return NextResponse.json({
          type: 'summary',
          summary: summary
        });

      case 'generate_hashtags':
        const hashtags = await geminiWrapper.generateHashtags(profileData);
        return NextResponse.json({
          type: 'hashtags',
          hashtags: hashtags
        });

      case 'conversational_response':
        const response = await geminiWrapper.generateConversationalResponse(transcript, context, conversationHistory, languageCode);
        return NextResponse.json({
          type: 'conversation',
          response: response
        });

      case 'test':
        const testResult = await geminiWrapper.testConnection();
        return NextResponse.json({
          status: testResult.success ? 'ok' : 'error',
          message: testResult.message,
          response: testResult.response
        });

      default:
        // Handle legacy question/answer processing
        if (question && answer) {
          const result = await geminiWrapper.processAnswer(question, answer, languageCode, currentProfile);
          return NextResponse.json({
            type: 'answer',
            data: result
          });
        } else if (transcript) {
          // For initial processing, generate questions
          const questions = await geminiWrapper.generateOnboardingQuestions(transcript, languageCode);
          return NextResponse.json({
            type: 'initial',
            data: {
              nextQuestion: questions[0] || null,
              profileUpdate: {}
            }
          });
        } else {
          return NextResponse.json({ error: 'No valid input provided' }, { status: 400 });
        }
    }

  } catch (error) {
    console.error('❌ Gemini API processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process with Gemini',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
