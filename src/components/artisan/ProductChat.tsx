'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceAssistant } from '@/components/shared/VoiceAssistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { geminiService } from '@/lib/geminiService';
import { speechService } from '@/lib/speechService';
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, CheckCircle, ArrowRight, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductInfo {
  name: string;
  description: string;
  materials: string[];
  techniques: string[];
  story: string;
  culturalContext: string;
  timeToComplete: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  category: string;
}

interface ProductChatProps {
  images: string[];
  onComplete: (productInfo: ProductInfo) => void;
  onSkip: () => void;
  initialContext?: string;
}

interface ConversationEntry {
  type: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  field?: keyof ProductInfo;
  audioUrl?: string;
}

const PRODUCT_QUESTIONS = [
  {
    field: 'name' as keyof ProductInfo,
    question: 'What would you like to call this beautiful craft?',
    followUp: 'That\'s a lovely name! ',
    required: true,
  },
  {
    field: 'description' as keyof ProductInfo,
    question: 'Can you describe what makes this craft special? Tell me about its appearance, colors, and unique features.',
    followUp: 'Wonderful description! ',
    required: true,
  },
  {
    field: 'materials' as keyof ProductInfo,
    question: 'What materials did you use to create this? Please list all the materials.',
    followUp: 'Great choice of materials! ',
    required: true,
  },
  {
    field: 'techniques' as keyof ProductInfo,
    question: 'What techniques or methods did you use to make this craft? How did you create it?',
    followUp: 'Those are impressive techniques! ',
    required: true,
  },
  {
    field: 'story' as keyof ProductInfo,
    question: 'Every craft has a story. What inspired you to create this? Is there a special meaning behind it?',
    followUp: 'What a beautiful story! ',
    required: true,
  },
  {
    field: 'culturalContext' as keyof ProductInfo,
    question: 'Does this craft have any cultural significance or traditional background? Tell me about its heritage.',
    followUp: 'Thank you for sharing that cultural context! ',
    required: false,
  },
  {
    field: 'timeToComplete' as keyof ProductInfo,
    question: 'How long did it take you to complete this craft?',
    followUp: 'That\'s quite an investment of time! ',
    required: false,
  },
  {
    field: 'difficulty' as keyof ProductInfo,
    question: 'Would you say this craft is beginner, intermediate, or advanced level to make?',
    followUp: 'Good to know the skill level! ',
    required: false,
  },
  {
    field: 'category' as keyof ProductInfo,
    question: 'What category would you put this craft in? For example: pottery, textiles, jewelry, woodwork, etc.',
    followUp: 'Perfect category! ',
    required: true,
  },
  {
    field: 'price' as keyof ProductInfo,
    question: 'If you were to sell this craft, what price would you set? You can skip this if you prefer.',
    followUp: 'Thank you for sharing that! ',
    required: false,
  },
];

export function ProductChat({ images, onComplete, onSkip, initialContext }: ProductChatProps) {
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [productInfo, setProductInfo] = useState<Partial<ProductInfo>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const conversationRef = useRef<HTMLDivElement>(null);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  const initializeConversation = async () => {
    const welcomeMessage = `Hello! I'm excited to learn about your beautiful craft. I can see you've uploaded ${images.length} photo${images.length !== 1 ? 's' : ''}. Let's create an amazing description together! I'll ask you some questions about your craft, and you can answer naturally in your own words.`;
    
    const welcomeEntry: ConversationEntry = {
      type: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    };

    setConversation([welcomeEntry]);
    
    // Start with first question after a brief pause
    setTimeout(() => {
      askNextQuestion();
    }, 2000);
  };

  const askNextQuestion = async () => {
    if (currentQuestionIndex >= PRODUCT_QUESTIONS.length) {
      completeCollection();
      return;
    }

    const question = PRODUCT_QUESTIONS[currentQuestionIndex];
    const questionEntry: ConversationEntry = {
      type: 'assistant',
      content: question.question,
      timestamp: new Date(),
      field: question.field,
    };

    setConversation(prev => [...prev, questionEntry]);
  };

  const handleUserResponse = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    const currentQuestion = PRODUCT_QUESTIONS[currentQuestionIndex];
    if (!currentQuestion) return;

    // Add user response to conversation
    const userEntry: ConversationEntry = {
      type: 'user',
      content: transcript,
      timestamp: new Date(),
      field: currentQuestion.field,
    };

    setConversation(prev => [...prev, userEntry]);
    setIsProcessing(true);

    try {
      // Process the answer with Gemini
      const processedInfo = await processAnswer(currentQuestion.field, transcript);
      
      // Update product info
      setProductInfo(prev => ({
        ...prev,
        [currentQuestion.field]: processedInfo,
      }));

      // Provide acknowledgment
      const acknowledgment = currentQuestion.followUp + getAcknowledgmentMessage(currentQuestion.field, processedInfo);
      
      const ackEntry: ConversationEntry = {
        type: 'assistant',
        content: acknowledgment,
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, ackEntry]);

      // Move to next question
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeout(askNextQuestion, 1000);
      }, 2000);

    } catch (error) {
      console.error('Error processing answer:', error);
      toast.error('Sorry, I had trouble processing that. Could you try again?');
      
      const errorEntry: ConversationEntry = {
        type: 'assistant',
        content: 'I\'m sorry, I had trouble understanding that. Could you please try again?',
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, errorEntry]);
    } finally {
      setIsProcessing(false);
    }
  }, [currentQuestionIndex]);

  const processAnswer = async (field: keyof ProductInfo, answer: string): Promise<any> => {
    try {
      // Use Gemini to extract and structure the information
      const response = await fetch('/api/gemini/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extractProductInfo',
          transcript: answer,
          question: PRODUCT_QUESTIONS.find(q => q.field === field),
          languageCode: currentLanguage.code,
        }),
      });

      if (!response.ok) throw new Error('Failed to process answer');

      const data = await response.json();
      return data.extractedInfo || answer;
    } catch (error) {
      console.error('Error processing answer with Gemini:', error);
      // Fallback to raw answer
      return field === 'materials' || field === 'techniques' 
        ? answer.split(',').map(item => item.trim())
        : answer;
    }
  };

  const getAcknowledgmentMessage = (field: keyof ProductInfo, value: any): string => {
    switch (field) {
      case 'name':
        return `"${value}" - what a beautiful name for your craft!`;
      case 'materials':
        const materials = Array.isArray(value) ? value : [value];
        return `Using ${materials.join(', ')} shows great craftsmanship!`;
      case 'techniques':
        return 'Those techniques require real skill and patience.';
      case 'story':
        return 'Stories like this make crafts truly special and meaningful.';
      case 'culturalContext':
        return 'It\'s wonderful how you\'re preserving cultural traditions.';
      case 'difficulty':
        return `${value} level crafts show your expertise!`;
      case 'category':
        return `${value} is a beautiful category of traditional craft.`;
      default:
        return 'Thank you for sharing that information!';
    }
  };

  const completeCollection = async () => {
    setIsComplete(true);
    
    const completionMessage = `Perfect! I have all the information I need. Let me create a beautiful description for your craft. This will just take a moment...`;
    
    const completionEntry: ConversationEntry = {
      type: 'assistant',
      content: completionMessage,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, completionEntry]);
    
    // Generate final product info
    setTimeout(() => {
      generateFinalProductInfo();
    }, 2000);
  };

  const generateFinalProductInfo = async () => {
    try {
      setIsProcessing(true);
      
      // Fill in any missing required fields with defaults
      const finalProductInfo: ProductInfo = {
        name: productInfo.name || 'Handcrafted Item',
        description: productInfo.description || 'A beautiful handcrafted piece',
        materials: Array.isArray(productInfo.materials) ? productInfo.materials : [productInfo.materials || 'Traditional materials'],
        techniques: Array.isArray(productInfo.techniques) ? productInfo.techniques : [productInfo.techniques || 'Traditional techniques'],
        story: productInfo.story || 'A unique handcrafted creation',
        culturalContext: productInfo.culturalContext || 'Traditional craftsmanship',
        timeToComplete: productInfo.timeToComplete || 'Several hours',
        difficulty: productInfo.difficulty || 'intermediate',
        category: productInfo.category || 'Handcraft',
        price: productInfo.price,
      };

      const summaryMessage = `Wonderful! Here's what I've learned about your craft:

**${finalProductInfo.name}**
${finalProductInfo.description}

**Materials:** ${finalProductInfo.materials.join(', ')}
**Techniques:** ${finalProductInfo.techniques.join(', ')}
**Category:** ${finalProductInfo.category}
**Difficulty:** ${finalProductInfo.difficulty}

Your craft has a beautiful story and cultural significance. I'm ready to create the final listing!`;

      const summaryEntry: ConversationEntry = {
        type: 'assistant',
        content: summaryMessage,
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, summaryEntry]);
      setShowSummary(true);
      
      // Auto-complete after showing summary
      setTimeout(() => {
        onComplete(finalProductInfo);
      }, 5000);

    } catch (error) {
      console.error('Error generating final product info:', error);
      toast.error('Error creating product summary');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    // Create minimal product info from what we have
    const minimalInfo: ProductInfo = {
      name: productInfo.name || 'Handcrafted Item',
      description: productInfo.description || 'A beautiful handcrafted piece',
      materials: Array.isArray(productInfo.materials) ? productInfo.materials : ['Traditional materials'],
      techniques: Array.isArray(productInfo.techniques) ? productInfo.techniques : ['Traditional techniques'],
      story: productInfo.story || 'A unique creation',
      culturalContext: productInfo.culturalContext || 'Traditional craftsmanship',
      timeToComplete: productInfo.timeToComplete || 'Several hours',
      difficulty: productInfo.difficulty || 'intermediate',
      category: productInfo.category || 'Handcraft',
      price: productInfo.price,
    };

    onSkip();
    onComplete(minimalInfo);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-gold p-6 text-charcoal">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold font-serif">Tell Me About Your Craft</h2>
                <p className="text-sm opacity-80">
                  Question {Math.min(currentQuestionIndex + 1, PRODUCT_QUESTIONS.length)} of {PRODUCT_QUESTIONS.length}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleSkip}
              variant="outline"
              size="sm"
              className="border-charcoal text-charcoal hover:bg-charcoal hover:text-gold"
            >
              Skip Interview
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-charcoal/20 rounded-full h-2">
            <div
              className="bg-charcoal h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentQuestionIndex / PRODUCT_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Conversation */}
        <div 
          ref={conversationRef}
          className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-warm"
        >
          {conversation.map((entry, index) => (
            <div
              key={index}
              className={`flex ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  entry.type === 'user'
                    ? 'bg-gold text-charcoal'
                    : 'bg-white text-charcoal shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{entry.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                  {entry.type === 'assistant' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        // Speak the message
                        speechService.textToSpeech(entry.content, currentLanguage.ttsCode)
                          .then(audioDataUri => {
                            const audio = new Audio(audioDataUri);
                            audio.play();
                          });
                      }}
                    >
                      <Volume2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold" />
                  <span className="text-sm text-charcoal">Processing your answer...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Voice Input */}
        {!isComplete && (
          <div className="p-6 bg-white border-t border-beige">
            <VoiceAssistant
              variant="compact"
              onTranscript={handleUserResponse}
              showTranscript={true}
              showWaveform={true}
              autoSpeak={false}
            />
          </div>
        )}

        {/* Completion Actions */}
        {showSummary && (
          <div className="p-6 bg-gold/10 border-t border-gold/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-charcoal">
                  Interview Complete! Creating your listing...
                </span>
              </div>
              
              <Button
                onClick={() => onComplete(productInfo as ProductInfo)}
                className="bg-gold hover:bg-gold-light text-charcoal"
              >
                Create Listing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}