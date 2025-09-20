import { getLanguageConfig } from './languages';

class SpeechService {
  /**
   * Convert speech to text using Google Cloud Speech-to-Text via API route
   */
  async speechToText(audioData: string, languageCode: string): Promise<string> {
    try {
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: audioData,
          languageCode: languageCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const data = await response.json();
      return data.transcript || '';
    } catch (error) {
      console.error('Speech-to-Text error:', error);
      throw new Error('Failed to process speech. Please try again.');
    }
  }

  /**
   * Convert text to speech using Google Cloud Text-to-Speech via API route
   */
  async textToSpeech(text: string, languageCode: string): Promise<string> {
    try {
      const languageConfig = getLanguageConfig(languageCode);
      if (!languageConfig) {
        throw new Error('Unsupported language');
      }

      const response = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          languageCode: languageConfig.ttsCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to synthesize speech');
      }

      const data = await response.json();
      return data.audioDataUri;
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      throw new Error('Failed to generate speech. Please try again.');
    }
  }

  /**
   * Check if the service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    try {
      // Test with a simple request
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: 'data:audio/webm;base64,test',
          languageCode: 'en-US',
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Speech service not configured:', error);
      return false;
    }
  }
}

export const speechService = new SpeechService();