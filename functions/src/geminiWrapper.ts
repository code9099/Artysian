import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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
      console.log('✅ Gemini initialized successfully in Firebase Functions');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini in Firebase Functions:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Extract artisan profile from voice transcript
   */
  async extractArtisanProfile(transcript: string, language: string = 'en'): Promise<any> {
    if (!this.isInitialized) {
      console.warn('Gemini not initialized, using fallback profile');
      return this.getFallbackProfile();
    }

    try {
      const prompt = `
        Extract artisan information from this transcript: "${transcript}"
        Language: ${language}
        
        Return a JSON object with:
        - name: artisan's name
        - craftType: type of craft they practice
        - location: their location
        - bio: a brief bio paragraph (2-3 sentences)
        
        Be culturally sensitive and preserve the artisan's voice.
        Make the bio engaging and personal.
        
        Return ONLY valid JSON, no additional text or formatting.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const profile = JSON.parse(jsonMatch[0]);
        console.log('✅ Extracted artisan profile via Gemini');
        return profile;
      } else {
        throw new Error('Could not parse JSON from Gemini response');
      }
    } catch (error) {
      console.error('❌ Gemini profile extraction failed:', error);
      return this.getFallbackProfile();
    }
  }

  /**
   * Generate craft description and story
   */
  async generateCraftDescription(craftData: any): Promise<any> {
    if (!this.isInitialized) {
      console.warn('Gemini not initialized, using fallback description');
      return this.getFallbackCraftDescription();
    }

    try {
      const prompt = `
        Generate a compelling craft description from this information:
        ${JSON.stringify(craftData)}
        
        Create a JSON object with:
        - description: A compelling description (2-3 paragraphs) that captures the essence and beauty
        - myth: A cultural myth or legend related to this craft type
        - story: A personal story that could accompany this piece
        - culturalContext: Enhanced cultural context explaining the significance
        - suggestedTags: Array of tags for discovery and categorization
        
        Be culturally sensitive, educational, and engaging for both artisans and craft enthusiasts.
        Preserve the authentic voice and cultural significance of the craft.
        
        Return ONLY valid JSON, no additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const description = JSON.parse(jsonMatch[0]);
        console.log('✅ Generated craft description via Gemini');
        return description;
      } else {
        throw new Error('Could not parse JSON from Gemini response');
      }
    } catch (error) {
      console.error('❌ Gemini craft description failed:', error);
      return this.getFallbackCraftDescription();
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
        message: 'Gemini is working correctly in Firebase Functions!',
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
  private getFallbackProfile() {
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

  private getFallbackCraftDescription() {
    const mockDescriptions = [
      {
        description: "This exquisite hand-thrown ceramic bowl showcases the ancient art of blue pottery, a technique unique to Rajasthan. The intricate floral patterns are painted using natural cobalt oxide, creating the signature blue and white design that has been passed down through generations. Each brushstroke tells a story of the artisan's connection to their cultural heritage, while the smooth curves and balanced proportions reflect the harmony between traditional technique and artistic expression.",
        myth: "According to local legend, the blue pottery technique was gifted to the people of Jaipur by the goddess of creativity herself. It is said that those who craft with pure intention and respect for tradition will find their pieces blessed with the ability to bring harmony to any home they grace. The blue color represents the sky connecting earth to heaven, while the white symbolizes purity of heart.",
        story: "In the quiet hours before dawn, when the first light touches the clay, Priya begins her work. Her grandmother's hands guide hers as she shapes the bowl, each curve a prayer, each pattern a memory. This piece carries not just beauty, but the whispers of generations who came before, the stories of Rajasthan's royal courts, and the dreams of artisans who found their calling in the dance of clay and color.",
        culturalContext: "Blue pottery represents the fusion of Persian and Indian artistic traditions, brought to Rajasthan by skilled craftsmen centuries ago. The technique requires specific clay from local riverbeds and natural pigments, making each piece a unique reflection of the region's landscape and culture. This art form has survived through generations, adapting to modern times while maintaining its traditional essence.",
        suggestedTags: ["blue pottery", "Rajasthan", "ceramics", "traditional", "handmade", "cultural heritage", "Jaipur", "floral patterns", "cobalt oxide", "Indian art"]
      }
    ];
    return mockDescriptions[0];
  }
}

// Export singleton instance
export const geminiWrapper = new GeminiWrapper();