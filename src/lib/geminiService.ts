import { OnboardingQuestion, ArtisanProfile } from './types';
import { getLanguageConfig } from './languages';
import { geminiWrapper } from './geminiWrapper';

class GeminiService {
  /**
   * Generate onboarding questions based on initial transcript
   */
  async generateOnboardingQuestions(
    transcript: string,
    language: string
  ): Promise<OnboardingQuestion[]> {
    try {
      console.log('🤖 Generating questions with Gemini wrapper...');
      const questions = await geminiWrapper.generateOnboardingQuestions(transcript, language);
      return questions || this.getDefaultQuestions(language);
    } catch (error) {
      console.error('Gemini question generation error:', error);
      return this.getDefaultQuestions(language);
    }
  }

  /**
   * Process initial bio and get first question
   */
  async processInitialBio(
    userId: string, 
    transcript: string, 
    language: string
  ): Promise<{ nextQuestion?: OnboardingQuestion; profileUpdate: Partial<ArtisanProfile> }> {
    try {
      const response = await fetch('/api/gemini/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript,
          languageCode: language,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process with Gemini');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Gemini initial bio processing error:', error);
      // Fallback to default question
      return {
        nextQuestion: this.getDefaultQuestions(language)[0],
        profileUpdate: {}
      };
    }
  }

  /**
   * Process answer and generate follow-up or next question
   */
  async processAnswer(
    question: OnboardingQuestion, 
    answer: string, 
    language: string,
    currentProfile?: Partial<ArtisanProfile>
  ): Promise<{ nextQuestion?: OnboardingQuestion; profileUpdate: Partial<ArtisanProfile> }> {
    try {
      console.log('🤖 Processing answer with Gemini wrapper...');
      const result = await geminiWrapper.processAnswer(question, answer, language, currentProfile);
      return result;
    } catch (error) {
      console.error('Gemini answer processing error:', error);
      // Fallback: just store the answer as-is
      const profileUpdate: Partial<ArtisanProfile> = {};
      (profileUpdate as any)[question.field] = answer;
      return { profileUpdate };
    }
  }

  /**
   * Translate text between languages
   */
  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    try {
      console.log('🤖 Translating text with Gemini wrapper...');
      const translated = await geminiWrapper.translateText(text, fromLang, toLang);
      return translated || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  }

  /**
   * Generate final bio from collected profile data
   */
  async generateBio(profileData: Partial<ArtisanProfile>, language: string): Promise<string> {
    try {
      console.log('🤖 Generating bio with Gemini wrapper...');
      const bio = await geminiWrapper.generateBio(profileData, language);
      return bio || this.getFallbackBio(profileData);
    } catch (error) {
      console.error('Gemini bio generation error:', error);
      return this.getFallbackBio(profileData);
    }
  }

  /**
   * Get default questions if Gemini fails
   */
  private getDefaultQuestions(language: string): OnboardingQuestion[] {
    const languageConfig = getLanguageConfig(language);
    const isEnglish = language === 'en';
    
    return [
      {
        id: 'name',
        question: 'What is your name?',
        questionTranslated: isEnglish ? 'What is your name?' : 'आपका नाम क्या है?',
        field: 'name',
        required: true,
        answered: false
      },
      {
        id: 'craftType',
        question: 'What type of craft do you practice?',
        questionTranslated: isEnglish ? 'What type of craft do you practice?' : 'आप किस प्रकार का शिल्प करते हैं?',
        field: 'craftType',
        required: true,
        answered: false
      },
      {
        id: 'experienceYears',
        question: 'How many years of experience do you have?',
        questionTranslated: isEnglish ? 'How many years of experience do you have?' : 'आपके पास कितने साल का अनुभव है?',
        field: 'experienceYears',
        required: true,
        answered: false
      },
      {
        id: 'culturalBackground',
        question: 'Tell us about your cultural background and heritage.',
        questionTranslated: isEnglish ? 'Tell us about your cultural background and heritage.' : 'अपनी सांस्कृतिक पृष्ठभूमि और विरासत के बारे में बताएं।',
        field: 'culturalBackground',
        required: true,
        answered: false
      }
    ];
  }

  /**
   * Get fallback bio if generation fails
   */
  private getFallbackBio(profileData: Partial<ArtisanProfile>): string {
    return `Master artisan specializing in ${profileData.craftType || 'traditional crafts'} with ${profileData.experienceYears || 'many'} years of experience.`;
  }

  /**
   * Generate product summary from collected information
   */
  async generateProductSummary(productData: any, language: string): Promise<string> {
    try {
      console.log('🤖 Generating product summary with Gemini wrapper...');
      const summary = await geminiWrapper.generateProductSummary(productData);
      return summary || this.getFallbackProductSummary(productData);
    } catch (error) {
      console.error('Gemini product summary generation error:', error);
      return this.getFallbackProductSummary(productData);
    }
  }

  /**
   * Get fallback product summary if generation fails
   */
  private getFallbackProductSummary(productData: any): string {
    const name = productData.name || 'Handcrafted Item';
    const materials = productData.materials || 'traditional materials';
    return `${name} - A beautiful handcrafted piece made with ${materials}, showcasing traditional artisan techniques and cultural heritage.`;
  }

  /**
   * Check if the service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    try {
      console.log('🤖 Testing Gemini wrapper configuration...');
      const result = await geminiWrapper.testConnection();
      return result.success;
    } catch (error) {
      console.error('Gemini service not configured:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();