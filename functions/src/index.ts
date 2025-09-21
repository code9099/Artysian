import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { onboardVoice } from './onboardVoice';
import { generateCraft } from './generateCraft';
import { visualizeStory } from './visualizeStory';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { geminiWrapper } from './geminiWrapper';

// Initialize Express app
const app = express();

// Enable CORS
app.use(cors({ origin: true }));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Processing Endpoints
app.post('/onboard-voice', onboardVoice);
app.post('/generate-craft', generateCraft);
app.post('/visualize-story', visualizeStory);

// ------------------------------
// API routes expected by frontend
// ------------------------------

// Initialize Google Cloud clients lazily
let speechClient: SpeechClient | null = null;
let ttsClient: TextToSpeechClient | null = null;

function getSpeechClient(): SpeechClient {
  if (!speechClient) {
    speechClient = new SpeechClient();
  }
  return speechClient;
}

function getTtsClient(): TextToSpeechClient {
  if (!ttsClient) {
    ttsClient = new TextToSpeechClient();
  }
  return ttsClient;
}

// POST /api/speech/transcribe
app.post('/api/speech/transcribe', async (req, res) => {
  try {
    const { audioData, languageCode } = req.body || {};
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Development fallback
    if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const mockTranscripts = [
        'This is a traditional blue pottery bowl from Rajasthan',
        'I am a skilled artisan with 15 years of experience in pottery',
        'My name is Priya and I specialize in traditional Indian crafts',
        'I use natural materials like clay and organic dyes in my work',
      ];
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      await new Promise((r) => setTimeout(r, 800));
      return res.json({ transcript: randomTranscript });
    }

    const buffer = Buffer.from(String(audioData).split(',')[1] || '', 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Invalid audio data' });
    }

    const [sttResponse] = await getSpeechClient().recognize({
      audio: { content: buffer },
      config: {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode: languageCode || 'en-US',
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        useEnhanced: true,
      },
    });

    const transcript = (sttResponse.results || [])
      .map((r) => r.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ')
      .trim();

    return res.json({ transcript });
  } catch (err: any) {
    console.error('STT error:', err);
    return res.status(500).json({
      error: 'Failed to transcribe audio',
      details: err?.message || String(err),
    });
  }
});

// POST /api/speech/tts
app.post('/api/speech/tts', async (req, res) => {
  try {
    const { text, languageCode } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Development fallback
    if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const mockAudioBase64 =
        'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      const audioDataUri = `data:audio/wav;base64,${mockAudioBase64}`;
      await new Promise((r) => setTimeout(r, 300));
      return res.json({ audioDataUri });
    }

    const [ttsResponse] = await getTtsClient().synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: languageCode || 'en-US',
        ssmlGender: 'NEUTRAL',
      },
      audioConfig: { audioEncoding: 'MP3' },
    } as any);

    const audioContent = ttsResponse.audioContent;
    if (!audioContent) {
      return res.status(500).json({ error: 'No audio content received' });
    }

    const base64Audio = Buffer.from(audioContent as Buffer).toString('base64');
    const audioDataUri = `data:audio/mp3;base64,${base64Audio}`;
    return res.json({ audioDataUri });
  } catch (err: any) {
    console.error('TTS error:', err);
    return res.status(500).json({
      error: 'Failed to synthesize speech',
      details: err?.message || String(err),
    });
  }
});

// POST /api/gemini/process
app.post('/api/gemini/process', async (req, res) => {
  try {
    const {
      transcript,
      languageCode,
      userId,
      question,
      answer,
      action,
      profileData,
      text: inputText,
      fromLanguage,
      toLanguage,
      currentProfile,
      context,
      conversationHistory,
    } = req.body || {};

    switch (action) {
      case 'generateQuestions': {
        const questions = await geminiWrapper.generateOnboardingQuestions(transcript, languageCode);
        return res.json({ type: 'questions', questions });
      }
      case 'generateBio': {
        const bio = await geminiWrapper.generateBio(profileData, languageCode);
        return res.json({ type: 'bio', bio });
      }
      case 'translate': {
        const translatedText = await geminiWrapper.translateText(inputText, fromLanguage, toLanguage);
        return res.json({ type: 'translation', translatedText });
      }
      case 'extractProductInfo': {
        const extractedInfo = await geminiWrapper.extractProductInfo(transcript, question);
        return res.json({ type: 'productInfo', extractedInfo });
      }
      case 'generateProductSummary': {
        const summary = await geminiWrapper.generateProductSummary(profileData);
        return res.json({ type: 'summary', summary });
      }
      case 'generate_hashtags': {
        const hashtags = await geminiWrapper.generateHashtags(profileData);
        return res.json({ type: 'hashtags', hashtags });
      }
      case 'conversational_response': {
        const response = await geminiWrapper.generateConversationalResponse(
          transcript,
          context,
          conversationHistory,
          languageCode
        );
        return res.json({ type: 'conversation', response });
      }
      case 'test': {
        const testResult = await geminiWrapper.testConnection();
        return res.json({
          status: testResult.success ? 'ok' : 'error',
          message: testResult.message,
          response: testResult.response,
        });
      }
      default: {
        if (question && answer) {
          const data = await geminiWrapper.processAnswer(question, answer, languageCode, currentProfile);
          return res.json({ type: 'answer', data });
        } else if (transcript) {
          const questions = await geminiWrapper.generateOnboardingQuestions(transcript, languageCode);
          return res.json({ type: 'initial', data: { nextQuestion: questions[0] || null, profileUpdate: {} } });
        }
        return res.status(400).json({ error: 'No valid input provided' });
      }
    }
  } catch (err: any) {
    console.error('Gemini process error:', err);
    return res.status(500).json({
      error: 'Failed to process with Gemini',
      details: err?.message || String(err),
    });
  }
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);

// Individual function exports for direct calling
export { onboardVoice as onboardVoiceFunction } from './onboardVoice';
export { generateCraft as generateCraftFunction } from './generateCraft';
export { visualizeStory as visualizeStoryFunction } from './visualizeStory';
