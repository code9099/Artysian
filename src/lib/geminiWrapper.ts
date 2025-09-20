import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from .env.local
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '');

export class GeminiWrapper {
    private model: any;
    private isInitialized: boolean = false;

    constructor() {
        this.initializeModel();
    }

    private initializeModel() {
        try {
            this.model = genAI.getGenerativeModel({
                model: "gemini-pro",
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 8192,
                },
            });
            this.isInitialized = true;
            console.log('✅ Gemini initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Gemini:', error);
            this.isInitialized = false;
        }
    }

    /**
     * Generate onboarding questions for artisans
     */
    async generateOnboardingQuestions(transcript: string, language: string = 'en'): Promise<any[]> {
        if (!this.isInitialized) {
            console.warn('Gemini not initialized, using fallback questions');
            return this.getFallbackQuestions(language);
        }

        try {
            const isEnglish = language === 'en';
            const prompt = `
        Based on this initial transcript from an artisan: "${transcript}"
        Language: ${language}
        
        Generate 4 onboarding questions to learn about this artisan. Return a JSON array with this exact structure:
        
        [
          {
            "id": "name",
            "question": "What is your name?",
            "questionTranslated": "${isEnglish ? 'What is your name?' : 'आपका नाम क्या है?'}",
            "field": "name",
            "required": true,
            "answered": false
          },
          {
            "id": "craftType", 
            "question": "What type of craft do you practice?",
            "questionTranslated": "${isEnglish ? 'What type of craft do you practice?' : 'आप किस प्रकार का शिल्प करते हैं?'}",
            "field": "craftType",
            "required": true,
            "answered": false
          },
          {
            "id": "experienceYears",
            "question": "How many years of experience do you have?", 
            "questionTranslated": "${isEnglish ? 'How many years of experience do you have?' : 'आपके पास कितने साल का अनुभव है?'}",
            "field": "experienceYears",
            "required": true,
            "answered": false
          },
          {
            "id": "culturalBackground",
            "question": "Tell us about your cultural background and heritage.",
            "questionTranslated": "${isEnglish ? 'Tell us about your cultural background and heritage.' : 'अपनी सांस्कृतिक पृष्ठभूमि और विरासत के बारे में बताएं।'}",
            "field": "culturalBackground", 
            "required": true,
            "answered": false
          }
        ]
        
        Make questions conversational and culturally appropriate for ${language === 'en' ? 'English' : 'Hindi'}.
        Return ONLY the JSON array, no additional text.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                console.log('✅ Generated questions via Gemini:', questions.length);
                return questions;
            } else {
                throw new Error('Could not parse JSON from Gemini response');
            }
        } catch (error) {
            console.error('❌ Gemini question generation failed:', error);
            return this.getFallbackQuestions(language);
        }
    }

    /**
     * Process artisan answer and generate follow-up
     */
    async processAnswer(question: any, answer: string, language: string, currentProfile: any = {}): Promise<any> {
        if (!this.isInitialized) {
            return this.getFallbackProcessing(question, answer);
        }

        try {
            const prompt = `
        Process this artisan's answer to extract information:
        
        Question: "${question.question}"
        Answer: "${answer}"
        Current Profile: ${JSON.stringify(currentProfile)}
        Language: ${language}
        
        Return a JSON object with:
        {
          "profileUpdate": {
            "${question.field}": "extracted and cleaned value"
          },
          "nextQuestion": null
        }
        
        Clean up the answer and make it more descriptive. If it's about experience, extract years as a number.
        Return ONLY valid JSON, no additional text.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const processed = JSON.parse(jsonMatch[0]);
                console.log('✅ Processed answer via Gemini');
                return processed;
            } else {
                throw new Error('Could not parse JSON from Gemini response');
            }
        } catch (error) {
            console.error('❌ Gemini answer processing failed:', error);
            return this.getFallbackProcessing(question, answer);
        }
    }

    /**
     * Generate artisan bio from profile data
     */
    async generateBio(profileData: any, language: string = 'en'): Promise<string> {
        if (!this.isInitialized) {
            return this.getFallbackBio(profileData);
        }

        try {
            const prompt = `
        Generate a compelling artisan bio from this profile data:
        ${JSON.stringify(profileData)}
        Language: ${language}
        
        Create a 2-3 sentence bio that captures their craft, experience, and cultural heritage.
        Make it engaging and authentic for an artisan marketplace.
        
        Return only the bio text, no JSON wrapper or additional formatting.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const bio = response.text().trim();

            console.log('✅ Generated bio via Gemini');
            return bio;
        } catch (error) {
            console.error('❌ Gemini bio generation failed:', error);
            return this.getFallbackBio(profileData);
        }
    }

    /**
     * Extract product information from voice transcript
     */
    async extractProductInfo(transcript: string, question: any): Promise<string> {
        if (!this.isInitialized) {
            return transcript.trim();
        }

        try {
            const prompt = `
        Extract and enhance product information from this transcript:
        
        Question: "${question.question}"
        Answer: "${transcript}"
        
        Clean up the response and make it more descriptive and engaging.
        If it's about materials, list them clearly.
        If it's about techniques, explain them briefly.
        If it's about cultural significance, make it compelling.
        
        Return only the enhanced text, no JSON wrapper.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const enhanced = response.text().trim();

            console.log('✅ Enhanced product info via Gemini');
            return enhanced;
        } catch (error) {
            console.error('❌ Gemini product info extraction failed:', error);
            return transcript.trim();
        }
    }

    /**
     * Generate product summary
     */
    async generateProductSummary(productData: any): Promise<string> {
        if (!this.isInitialized) {
            return this.getFallbackProductSummary(productData);
        }

        try {
            const prompt = `
        Generate a compelling product summary from this information:
        ${JSON.stringify(productData)}
        
        Create a 2-3 sentence description that would appeal to customers.
        Focus on craftsmanship, cultural heritage, and unique qualities.
        Make it engaging and authentic for an artisan marketplace.
        
        Return only the summary text, no JSON wrapper.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const summary = response.text().trim();

            console.log('✅ Generated product summary via Gemini');
            return summary;
        } catch (error) {
            console.error('❌ Gemini product summary failed:', error);
            return this.getFallbackProductSummary(productData);
        }
    }

    /**
     * Generate conversational response for real-time chat
     */
    async generateConversationalResponse(userInput: string, context: string, conversationHistory: string, language: string): Promise<string> {
        if (!this.isInitialized) {
            return this.getFallbackResponse(userInput, context);
        }

        try {
            const contextPrompt = context === 'artisan_onboarding'
                ? 'You are a friendly AI assistant helping an artisan create their profile. You need to learn about their name, craft type, experience, and cultural background through natural conversation.'
                : context === 'product_description'
                    ? 'You are helping an artisan describe their specific craft product in detail.'
                    : 'You are a helpful AI assistant for artisans and craft enthusiasts.';

            const languageName = language === 'en' ? 'English' :
                language === 'hi' ? 'Hindi' :
                    language === 'ta' ? 'Tamil' :
                        language === 'bn' ? 'Bengali' : 'the selected language';

            const prompt = `
        You are a warm, enthusiastic AI assistant having a real-time voice conversation with an artisan.
        
        Context: ${contextPrompt}
        Language: Respond in ${languageName}
        Conversation so far: ${conversationHistory || 'This is the beginning of our conversation'}
        
        The artisan just said: "${userInput}"
        
        Respond naturally as if you're having a phone conversation. Guidelines:
        - Be warm, friendly, and genuinely interested
        - Keep responses short (1-2 sentences max) since this is real-time
        - Ask ONE specific follow-up question to keep the conversation flowing
        - Show enthusiasm about their craft and culture
        - If they mention their name, acknowledge it warmly
        - If they mention their craft, ask about their experience or techniques
        - If they mention experience, ask about what they love most about their craft
        - If they mention cultural background, show interest and ask for more details
        - Use natural conversation fillers like "That's wonderful!" or "How interesting!"
        - Be encouraging and positive
        - Avoid repeating information they already shared
        
        Remember: This is a REAL-TIME conversation, so be concise and natural.
        
        Return only your response text, no JSON wrapper or additional formatting.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const reply = response.text().trim();

            console.log('✅ Generated real-time response via Gemini');
            return reply;
        } catch (error) {
            console.error('❌ Gemini conversational response failed:', error);
            return this.getFallbackResponse(userInput, context);
        }
    }

    /**
     * Get fallback response when Gemini fails
     */
    private getFallbackResponse(userInput: string, context: string): string {
        const input = userInput.toLowerCase();

        if (context === 'artisan_onboarding') {
            if (input.includes('name') || input.includes('i am') || input.includes("i'm")) {
                return "Nice to meet you! What type of craft do you practice?";
            } else if (input.includes('pottery') || input.includes('ceramic')) {
                return "Pottery is such a beautiful art form! How long have you been working with clay?";
            } else if (input.includes('weav') || input.includes('textile')) {
                return "Textile weaving is amazing! What materials do you like to work with?";
            } else if (input.includes('carv') || input.includes('wood')) {
                return "Wood carving requires such skill! What inspired you to start carving?";
            } else if (input.includes('year') || input.includes('experience')) {
                return "That's wonderful experience! What do you love most about your craft?";
            } else {
                return "That sounds fascinating! Could you tell me more about your craft background?";
            }
        }

        return "I understand. Please tell me more about that.";
    }

    /**
     * Generate hashtags for social media
     */
    async generateHashtags(productData: any): Promise<string> {
        if (!this.isInitialized) {
            return "#handmade, #craft, #artisan, #traditional, #handcrafted, #art, #culture, #heritage, #unique, #authentic";
        }

        try {
            const prompt = `
        Based on this craft information, generate relevant hashtags for social media:
        ${JSON.stringify(productData)}
        
        Generate 10-15 hashtags that would be good for:
        - Instagram posts
        - Facebook posts  
        - Twitter posts
        
        Include hashtags for:
        - The craft type/category
        - Materials used
        - Techniques
        - Cultural heritage
        - General craft/handmade tags
        - Location-based tags if mentioned
        
        Return hashtags as a comma-separated list, each starting with #
        Example: #handmade, #pottery, #traditional, #indian, #ceramic
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const hashtags = response.text().trim();

            console.log('✅ Generated hashtags via Gemini');
            return hashtags;
        } catch (error) {
            console.error('❌ Gemini hashtag generation failed:', error);
            return "#handmade, #craft, #artisan, #traditional, #handcrafted, #art, #culture, #heritage, #unique, #authentic";
        }
    }

    /**
     * Translate text between languages
     */
    async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
        if (!this.isInitialized) {
            return text; // Return original if translation fails
        }

        try {
            const prompt = `
        Translate this text from ${fromLang} to ${toLang}:
        "${text}"
        
        Return only the translated text, no additional formatting or explanation.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const translated = response.text().trim();

            console.log('✅ Translated text via Gemini');
            return translated;
        } catch (error) {
            console.error('❌ Gemini translation failed:', error);
            return text;
        }
    }

    /**
     * Test if Gemini is working
     */
    async testConnection(): Promise<{ success: boolean; message: string; response?: string }> {
        if (!this.isInitialized) {
            return {
                success: false,
                message: 'Gemini not initialized - check API key'
            };
        }

        try {
            const result = await this.model.generateContent('Hello! Please respond with a simple greeting and confirm you are working.');
            const response = await result.response;
            const text = response.text();

            return {
                success: true,
                message: 'Gemini is working correctly!',
                response: text
            };
        } catch (error) {
            return {
                success: false,
                message: `Gemini test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    // Fallback methods
    private getFallbackQuestions(language: string) {
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

    private getFallbackProcessing(question: any, answer: string) {
        const profileUpdate: any = {};

        switch (question.field) {
            case 'name':
                const nameMatch = answer.match(/(?:my name is|i am|i'm)\s+([a-zA-Z\s]+)/i);
                profileUpdate.name = nameMatch ? nameMatch[1].trim() : answer.trim();
                break;
            case 'craftType':
                profileUpdate.craftType = answer.trim();
                break;
            case 'experienceYears':
                const yearMatch = answer.match(/(\d+)\s*(?:years?|yrs?)/i);
                profileUpdate.experienceYears = yearMatch ? parseInt(yearMatch[1]) : answer.trim();
                break;
            case 'culturalBackground':
                profileUpdate.culturalBackground = answer.trim();
                break;
            default:
                profileUpdate[question.field] = answer.trim();
        }

        return { profileUpdate, nextQuestion: null };
    }

    private getFallbackBio(profileData: any): string {
        const name = profileData.name || 'Artisan';
        const craftType = profileData.craftType || 'traditional crafts';
        const experience = profileData.experienceYears || 'many';

        return `${name} is a skilled artisan specializing in ${craftType} with ${experience} years of experience. They are passionate about preserving traditional craft techniques and sharing their cultural heritage through their beautiful handmade creations.`;
    }

    private getFallbackProductSummary(productData: any): string {
        const name = productData.name || 'Handcrafted Item';
        const materials = productData.materials || 'traditional materials';
        return `${name} - A beautiful handcrafted piece made with ${materials}, showcasing traditional artisan techniques and cultural heritage.`;
    }
}

// Export singleton instance
export const geminiWrapper = new GeminiWrapper();