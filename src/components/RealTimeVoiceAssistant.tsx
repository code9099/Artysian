'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Phone, PhoneOff, Square } from 'lucide-react';
import { speechService } from '@/lib/speechService';
import { geminiWrapper } from '@/lib/geminiWrapper';
import { firestoreService } from '@/lib/firestoreService';
import { OnboardingQuestion, ArtisanProfile } from '@/lib/types';
import { INDIAN_LANGUAGES, getLanguageConfig } from '@/lib/languages';
import { toast } from 'sonner';

interface RealTimeVoiceAssistantProps {
  onComplete: (profile: ArtisanProfile) => void;
  userId: string;
  context?: 'artisan_onboarding' | 'product_description' | 'general';
}

export function RealTimeVoiceAssistant({
  onComplete,
  userId,
  context = 'artisan_onboarding'
}: RealTimeVoiceAssistantProps) {
  const [language, setLanguage] = useState('en');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [profileData, setProfileData] = useState<Partial<ArtisanProfile>>({});
  const [currentQuestion, setCurrentQuestion] = useState<OnboardingQuestion | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const languageConfig = getLanguageConfig(language);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setIsAssistantSpeaking(false);
      // Resume listening after assistant finishes speaking
      if (isCallActive) {
        setTimeout(() => startListening(), 500);
      }
    };
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCall();
    };
  }, []);

  const startCall = async () => {
    try {
      setError(null);
      console.log('🔥 Starting real-time voice call...');
      
      // Get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });
      
      streamRef.current = stream;
      setIsCallActive(true);
      
      // Start with greeting
      await speakGreeting();
      
      toast.success('Voice call started! Speak naturally.');
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start voice call. Please check microphone permissions.');
      toast.error('Failed to start voice call');
    }
  };

  const stopCall = () => {
    console.log('🔥 Stopping voice call...');
    
    // Stop all audio processing
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    setIsCallActive(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsAssistantSpeaking(false);
  };

  const speakGreeting = async () => {
    const greetings = {
      'en': `Hello! I'm your AI assistant. I'm here to help you create your artisan profile. Let's start with a simple question - could you tell me your name and what type of craft you practice?`,
      'hi': `नमस्ते! मैं आपका AI सहायक हूँ। मैं आपकी कारीगर प्रोफ़ाइल बनाने में आपकी मदद करने के लिए यहाँ हूँ। आइए एक सरल प्रश्न से शुरू करते हैं - क्या आप मुझे अपना नाम और आप किस प्रकार का शिल्प करते हैं, बता सकते हैं?`,
      'ta': `வணக்கம்! நான் உங்கள் AI உதவியாளர். உங்கள் கைவினைஞர் சுயவிவரத்தை உருவாக்க உங்களுக்கு உதவ நான் இங்கே இருக்கிறேன். ஒரு எளிய கேள்வியுடன் தொடங்குவோம் - உங்கள் பெயர் மற்றும் நீங்கள் என்ன வகையான கைவினை செய்கிறீர்கள் என்று சொல்ல முடியுமா?`,
      'bn': `নমস্কার! আমি আপনার AI সহায়ক। আমি আপনার কারিগর প্রোফাইল তৈরি করতে সাহায্য করার জন্য এখানে আছি। একটি সহজ প্রশ্ন দিয়ে শুরু করি - আপনি কি আমাকে আপনার নাম এবং আপনি কী ধরনের কারুশিল্প করেন তা বলতে পারেন?`
    };

    const greeting = greetings[language as keyof typeof greetings] || greetings['en'];
    await speakText(greeting);
  };

  const speakText = async (text: string) => {
    try {
      setIsAssistantSpeaking(true);
      
      if (!languageConfig) {
        throw new Error('Language configuration not found');
      }

      const audioData = await speechService.textToSpeech(text, languageConfig.ttsCode);
      
      if (audioRef.current && audioData) {
        audioRef.current.src = audioData;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsAssistantSpeaking(false);
      // Continue listening even if TTS fails
      if (isCallActive) {
        setTimeout(() => startListening(), 500);
      }
    }
  };

  const startListening = useCallback(async () => {
    if (!streamRef.current || isAssistantSpeaking || isProcessing) {
      return;
    }

    try {
      setIsListening(true);
      audioChunksRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudio(audioBlob);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second

      // Auto-stop after silence (3 seconds)
      silenceTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsListening(false);
        }
      }, 3000);

    } catch (error) {
      console.error('Error starting listening:', error);
      setIsListening(false);
    }
  }, [isAssistantSpeaking, isProcessing]);

  const processAudio = async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) { // Too small, probably silence
      if (isCallActive && !isAssistantSpeaking) {
        setTimeout(() => startListening(), 500);
      }
      return;
    }

    setIsProcessing(true);
    setIsListening(false);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const audioData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      // Convert speech to text
      const transcript = await speechService.speechToText(audioData, languageConfig?.speechCode || 'en-US');
      
      if (!transcript.trim() || transcript.length < 3) {
        // No meaningful speech detected, continue listening
        if (isCallActive && !isAssistantSpeaking) {
          setTimeout(() => startListening(), 500);
        }
        return;
      }

      setCurrentTranscript(transcript);
      console.log('🎤 User said:', transcript);

      // Add to conversation history
      setConversationHistory(prev => [...prev, `User: ${transcript}`]);

      // Process with Gemini for real-time response
      await generateRealTimeResponse(transcript);

    } catch (error) {
      console.error('Error processing audio:', error);
      // Continue listening even if processing fails
      if (isCallActive && !isAssistantSpeaking) {
        setTimeout(() => startListening(), 1000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generateRealTimeResponse = async (userInput: string) => {
    try {
      // Build conversation context
      const conversationContext = conversationHistory.join('\n');
      
      // Generate response using Gemini
      const response = await geminiWrapper.generateConversationalResponse(
        userInput,
        context,
        conversationContext,
        language
      );

      console.log('🤖 Assistant responds:', response);

      // Add to conversation history
      setConversationHistory(prev => [...prev, `Assistant: ${response}`]);

      // Extract profile information if this is onboarding
      if (context === 'artisan_onboarding') {
        await extractProfileInfo(userInput, response);
      }

      // Speak the response
      await speakText(response);

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback response
      const fallbackResponse = "I understand. Could you tell me more about that?";
      await speakText(fallbackResponse);
    }
  };

  const extractProfileInfo = async (userInput: string, assistantResponse: string) => {
    try {
      // Use Gemini to extract profile information
      const extractionPrompt = `
        Extract artisan profile information from this conversation:
        User said: "${userInput}"
        Assistant responded: "${assistantResponse}"
        Current profile: ${JSON.stringify(profileData)}
        
        Return a JSON object with any new profile information found:
        {
          "name": "extracted name if mentioned",
          "craftType": "extracted craft type if mentioned", 
          "experienceYears": "extracted experience if mentioned",
          "location": "extracted location if mentioned",
          "culturalBackground": "extracted cultural info if mentioned"
        }
        
        Only include fields that were actually mentioned. Return empty object if no new info.
        Return ONLY valid JSON, no additional text.
      `;

      // This would use Gemini to extract info, but for now let's do basic extraction
      const updates: Partial<ArtisanProfile> = {};
      
      // Basic name extraction
      const nameMatch = userInput.match(/(?:my name is|i am|i'm called)\s+([a-zA-Z\s]+)/i);
      if (nameMatch) {
        updates.name = nameMatch[1].trim();
      }
      
      // Basic craft type extraction
      if (userInput.toLowerCase().includes('pottery') || userInput.toLowerCase().includes('ceramic')) {
        updates.craftType = 'Pottery & Ceramics';
      } else if (userInput.toLowerCase().includes('weav')) {
        updates.craftType = 'Textile Weaving';
      } else if (userInput.toLowerCase().includes('carv')) {
        updates.craftType = 'Wood Carving';
      }
      
      // Basic experience extraction
      const expMatch = userInput.match(/(\d+)\s*(?:years?|yrs?)/i);
      if (expMatch) {
        updates.experienceYears = parseInt(expMatch[1]);
      }

      if (Object.keys(updates).length > 0) {
        setProfileData(prev => ({ ...prev, ...updates }));
        
        // Save to Firestore
        try {
          await firestoreService.updateArtisanProfile(userId, updates);
        } catch (error) {
          console.error('Error saving profile updates:', error);
        }
      }

      // Check if we have enough information to complete
      const requiredFields = ['name', 'craftType'];
      const hasRequiredInfo = requiredFields.every(field => 
        profileData[field as keyof ArtisanProfile] || updates[field as keyof ArtisanProfile]
      );

      if (hasRequiredInfo && conversationHistory.length > 6) {
        // Generate final bio and complete
        setTimeout(async () => {
          const finalProfile = { ...profileData, ...updates };
          const bio = await geminiWrapper.generateBio(finalProfile, language);
          
          const completeProfile: ArtisanProfile = {
            ...finalProfile,
            bio,
            language,
            isOnboarded: true,
            id: userId,
            userId: userId
          } as ArtisanProfile;

          await firestoreService.saveArtisanProfile(userId, completeProfile);
          
          await speakText("Thank you! I have all the information I need. Your profile has been created successfully.");
          
          setTimeout(() => {
            stopCall();
            onComplete(completeProfile);
          }, 3000);
        }, 2000);
      }

    } catch (error) {
      console.error('Error extracting profile info:', error);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    toast.success(`Language changed to ${getLanguageConfig(newLanguage)?.name}`);
  };

  return (
    <div className="bg-cream rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
      {/* Call Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-charcoal mb-2 font-serif">
          Real-Time Voice Assistant
        </h3>
        <p className="text-brown">
          Have a natural conversation with our AI assistant
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        <span className="text-brown">Language:</span>
        <select 
          value={language} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-beige border border-brown/20 rounded-lg px-3 py-2 text-charcoal"
          disabled={isCallActive}
        >
          {INDIAN_LANGUAGES.slice(0, 8).map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Call Status */}
      <div className="bg-white rounded-2xl p-6 mb-6 text-center">
        {!isCallActive ? (
          <div>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-charcoal mb-2">Ready to Start</h4>
            <p className="text-brown mb-4">
              Click the button below to start your voice conversation with the AI assistant.
            </p>
            <Button
              onClick={startCall}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              Start Voice Call
            </Button>
          </div>
        ) : (
          <div>
            {/* Call Active Status */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Call Active</span>
              </div>
              <div className="text-brown">|</div>
              <div className="text-brown text-sm">
                Speaking in {languageConfig?.name}
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-3 rounded-lg ${isListening ? 'bg-green-100 border-green-300' : 'bg-gray-100'} border`}>
                <Mic className={`w-6 h-6 mx-auto mb-1 ${isListening ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-xs font-medium">
                  {isListening ? 'Listening' : 'Standby'}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isProcessing ? 'bg-blue-100 border-blue-300' : 'bg-gray-100'} border`}>
                <div className={`w-6 h-6 mx-auto mb-1 ${isProcessing ? 'animate-spin' : ''}`}>
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <Square className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <p className="text-xs font-medium">
                  {isProcessing ? 'Processing' : 'Ready'}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isAssistantSpeaking ? 'bg-purple-100 border-purple-300' : 'bg-gray-100'} border`}>
                <Volume2 className={`w-6 h-6 mx-auto mb-1 ${isAssistantSpeaking ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className="text-xs font-medium">
                  {isAssistantSpeaking ? 'Speaking' : 'Silent'}
                </p>
              </div>
            </div>

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="bg-gold/10 rounded-lg p-4 mb-4 border border-gold/20">
                <p className="text-sm text-charcoal">
                  <strong>You said:</strong> "{currentTranscript}"
                </p>
              </div>
            )}

            {/* Profile Progress */}
            {Object.keys(profileData).length > 0 && (
              <div className="bg-beige rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-charcoal mb-2">Profile Information Collected:</h5>
                <div className="text-sm text-brown space-y-1">
                  {profileData.name && <div><strong>Name:</strong> {profileData.name}</div>}
                  {profileData.craftType && <div><strong>Craft:</strong> {profileData.craftType}</div>}
                  {profileData.experienceYears && <div><strong>Experience:</strong> {profileData.experienceYears} years</div>}
                  {profileData.location && <div><strong>Location:</strong> {profileData.location}</div>}
                </div>
              </div>
            )}

            {/* End Call Button */}
            <Button
              onClick={stopCall}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
        <h5 className="font-semibold text-charcoal mb-2">How it works:</h5>
        <ul className="text-sm text-brown space-y-1">
          <li>• The microphone stays on during the call</li>
          <li>• Speak naturally - the assistant will respond in real-time</li>
          <li>• The AI will ask follow-up questions automatically</li>
          <li>• Your profile information is collected as you speak</li>
          <li>• The call ends when enough information is gathered</li>
        </ul>
      </div>
    </div>
  );
}