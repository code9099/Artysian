'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Globe, Square, CheckCircle, ArrowRight, Volume2 } from 'lucide-react';
import { speechService } from '@/lib/speechService';
import { geminiService } from '@/lib/geminiService';
import { firestoreService } from '@/lib/firestoreService';
import { OnboardingQuestion, ArtisanProfile } from '@/lib/types';
import { INDIAN_LANGUAGES, getLanguageConfig } from '@/lib/languages';

interface VoiceOnboardProps {
  onComplete: (profile: ArtisanProfile) => void;
  userId: string;
}

export function VoiceOnboard({
  onComplete,
  userId
}: VoiceOnboardProps) {
  const [language, setLanguage] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'complete'>('intro');
  const [transcript, setTranscript] = useState('');
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [profileData, setProfileData] = useState<Partial<ArtisanProfile>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsAnswered = questions.every(q => q.answered);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsPlayingAudio(false);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await processAudio(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioData: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const languageConfig = getLanguageConfig(language);
      if (!languageConfig) {
        throw new Error('Unsupported language');
      }

      // Convert speech to text with fallback
      let transcript = '';
      try {
        transcript = await speechService.speechToText(audioData, languageConfig.speechCode);
        if (!transcript.trim()) {
          throw new Error('No speech detected');
        }
      } catch (speechError) {
        console.error('Speech-to-text error:', speechError);
        setError('Could not understand speech. Please speak clearly and try again.');
        return;
      }

      setTranscript(transcript);

      if (currentStep === 'intro') {
        // Generate questions based on initial transcript with fallback
        let generatedQuestions;
        try {
          generatedQuestions = await geminiService.generateOnboardingQuestions(transcript, language);
          if (!generatedQuestions || generatedQuestions.length === 0) {
            throw new Error('No questions generated');
          }
        } catch (geminiError) {
          console.error('Gemini question generation error:', geminiError);
          // Use default questions as fallback
          generatedQuestions = getDefaultQuestions(language);
        }

        setQuestions(generatedQuestions);
        setCurrentStep('questions');
        
        // Play first question with error handling
        try {
          await playQuestion(generatedQuestions[0]);
        } catch (ttsError) {
          console.error('TTS error:', ttsError);
          // Continue without audio - user can still see the question
        }
      } else if (currentQuestion) {
        // Process answer to current question with fallback
        let nextQuestion = null;
        let profileUpdate: Partial<ArtisanProfile> = {};

        try {
          const result = await geminiService.processAnswer(
            currentQuestion,
            transcript,
            language,
            profileData
          );
          nextQuestion = result.nextQuestion;
          profileUpdate = result.profileUpdate;
        } catch (geminiError) {
          console.error('Gemini answer processing error:', geminiError);
          // Fallback: extract basic info from transcript
          profileUpdate = extractBasicInfo(currentQuestion, transcript);
        }

        // Update profile data
        const updatedProfileData = { ...profileData, ...profileUpdate };
        setProfileData(updatedProfileData);

        // Update question as answered
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
          ...currentQuestion,
          answered: true,
          answer: transcript
        };
        setQuestions(updatedQuestions);

        // Save to Firestore with error handling
        try {
          await firestoreService.updateArtisanProfile(userId, profileUpdate);
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          // Continue without saving - data is still in local state
        }

        if (nextQuestion) {
          // Play clarification question
          try {
            await playQuestion(nextQuestion);
          } catch (ttsError) {
            console.error('TTS error:', ttsError);
          }
        } else if (isLastQuestion || allQuestionsAnswered) {
          // All questions answered, generate final bio
          let bio = '';
          try {
            bio = await geminiService.generateBio(updatedProfileData, language);
          } catch (bioError) {
            console.error('Bio generation error:', bioError);
            bio = generateFallbackBio(updatedProfileData);
          }

          const finalProfile = {
            ...updatedProfileData,
            bio,
            language,
            isOnboarded: true
          } as ArtisanProfile;

          try {
            await firestoreService.saveArtisanProfile(userId, finalProfile);
          } catch (saveError) {
            console.error('Profile save error:', saveError);
            // Continue to completion even if save fails
          }

          setCurrentStep('complete');
        } else {
          // Move to next question
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
            try {
              await playQuestion(updatedQuestions[nextIndex]);
            } catch (ttsError) {
              console.error('TTS error:', ttsError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to extract basic info when Gemini fails
  const extractBasicInfo = (question: OnboardingQuestion, answer: string): Partial<ArtisanProfile> => {
    const profileUpdate: any = {};
    
    switch (question.field) {
      case 'name':
        // Extract name from answer
        const nameMatch = answer.match(/(?:my name is|i am|i'm)\s+([a-zA-Z\s]+)/i);
        if (nameMatch) {
          profileUpdate.name = nameMatch[1].trim();
        } else {
          profileUpdate.name = answer.trim();
        }
        break;
      case 'craftType':
        profileUpdate.craftType = answer.trim();
        break;
      case 'experienceYears':
        const yearMatch = answer.match(/(\d+)\s*(?:years?|yrs?)/i);
        if (yearMatch) {
          profileUpdate.experienceYears = parseInt(yearMatch[1]);
        } else {
          profileUpdate.experienceYears = answer.trim();
        }
        break;
      case 'culturalBackground':
        profileUpdate.culturalBackground = answer.trim();
        break;
      default:
        (profileUpdate as any)[question.field] = answer.trim();
    }
    
    return profileUpdate;
  };

  // Helper function to get default questions
  const getDefaultQuestions = (lang: string): OnboardingQuestion[] => {
    const isEnglish = lang === 'en';
    
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
  };

  // Helper function to generate fallback bio
  const generateFallbackBio = (profileData: Partial<ArtisanProfile>): string => {
    const name = profileData.name || 'Artisan';
    const craftType = profileData.craftType || 'traditional crafts';
    const experience = profileData.experienceYears || 'many';
    
    return `${name} is a skilled artisan specializing in ${craftType} with ${experience} years of experience. They are passionate about preserving traditional craft techniques and sharing their cultural heritage through their beautiful handmade creations.`;
  };

  const playQuestion = async (question: OnboardingQuestion) => {
    try {
      setIsPlayingAudio(true);
      const languageConfig = getLanguageConfig(language);
      if (!languageConfig) {
        throw new Error('Language configuration not found');
      }

      const audioData = await speechService.textToSpeech(
        question.questionTranslated,
        languageConfig.ttsCode
      );

      if (audioRef.current && audioData) {
        audioRef.current.src = audioData;
        await audioRef.current.play();
      } else {
        throw new Error('No audio data received');
      }
    } catch (error) {
      console.error('Error playing question:', error);
      // Don't show error to user for TTS failures - they can still read the question
      setIsPlayingAudio(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const handleComplete = () => {
    const finalProfile = {
      ...profileData,
      language,
      isOnboarded: true
    } as ArtisanProfile;
    onComplete(finalProfile);
  };

  const renderIntroStep = () => (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-charcoal mb-4 font-serif">
        Welcome to CraftStory
      </h3>
      <p className="text-brown mb-6">
        Let&apos;s get to know you and your craft. Please tell us about yourself in your own words.
      </p>

      {/* Language Selector */}
      <div className="flex items-center justify-center space-x-2 mb-8">
        <Globe className="w-5 h-5 text-brown" />
        <select 
          value={language} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-transparent border border-brown rounded-lg px-3 py-2 text-brown"
        >
          {INDIAN_LANGUAGES.slice(0, 8).map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Recording Area */}
      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center">
        {isRecording ? (
          <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center">
            <Square className="w-8 h-8 text-cream" />
          </div>
        ) : (
          <Mic className="w-16 h-16 text-charcoal" />
        )}
      </div>

      <div className="space-y-4">
        {!isRecording ? (
          <Button 
            onClick={startRecording}
            className="bg-gold hover:bg-gold-light text-charcoal"
            disabled={isProcessing}
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button 
            onClick={stopRecording}
            variant="outline"
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            <MicOff className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        )}

        {isProcessing && (
          <div className="text-brown">
            Processing your response...
          </div>
        )}
      </div>

      {/* Waveform Visualization */}
      <div className="flex justify-center items-center space-x-1 mt-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-gold rounded-full transition-all duration-300 ${
              isRecording ? 'animate-pulse' : ''
            }`}
            style={{
              height: `${Math.random() * 40 + 10}px`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderQuestionsStep = () => (
    <div className="text-center">
      {/* Call Interface Header */}
      <div className="bg-gradient-to-r from-gold to-gold-light rounded-2xl p-6 mb-6 text-charcoal">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-lg font-semibold">Voice Call in Progress</span>
        </div>
        <p className="text-sm opacity-80">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </div>

      {/* Assistant Speaking Indicator */}
      {isPlayingAudio && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-blue-700 font-medium">Assistant is speaking...</span>
          </div>
        </div>
      )}

      {/* Question Display - Call Style */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border-2 border-beige">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-charcoal" />
          </div>
          <div className="text-left">
            <p className="text-sm text-brown font-medium">AI Assistant</p>
            <p className="text-xs text-brown/70">Speaking in {getLanguageConfig(language)?.name}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-lg text-charcoal font-medium mb-2">{currentQuestion?.question}</p>
          <p className="text-brown italic text-sm">{currentQuestion?.questionTranslated}</p>
        </div>

        <Button
          variant="outline"
          onClick={() => currentQuestion && playQuestion(currentQuestion)}
          disabled={isPlayingAudio || isRecording}
          className="border-gold text-gold hover:bg-gold hover:text-charcoal"
          size="sm"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          {isPlayingAudio ? 'Playing...' : 'Replay Question'}
        </Button>
      </div>

      {/* Your Response Area - Call Style */}
      <div className="bg-cream rounded-2xl p-6 mb-6 border-2 border-gold/30">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center">
            <Mic className="w-6 h-6 text-cream" />
          </div>
          <div className="text-left">
            <p className="text-sm text-charcoal font-medium">Your Response</p>
            <p className="text-xs text-brown/70">
              {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </p>
          </div>
        </div>

        {/* Call-style Recording Button */}
        <div className="relative">
          {!isRecording && !isProcessing ? (
            <Button 
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              disabled={isPlayingAudio}
            >
              <Mic className="w-8 h-8" />
            </Button>
          ) : isRecording ? (
            <Button 
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse"
            >
              <Square className="w-8 h-8" />
            </Button>
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="mt-4 min-h-[2rem]">
          {isRecording && (
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Recording your response...</span>
            </div>
          )}
          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="font-medium">Processing your answer...</span>
            </div>
          )}
          {!isRecording && !isProcessing && !isPlayingAudio && (
            <p className="text-brown text-sm">Tap the green button to record your answer</p>
          )}
        </div>
      </div>

      {/* Call Progress Bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-charcoal">Call Progress</span>
          <span className="text-sm text-brown">{currentQuestionIndex + 1}/{questions.length}</span>
        </div>
        <div className="w-full bg-beige rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-gold to-gold-light h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          >
            {((currentQuestionIndex + 1) / questions.length) > 0.1 && (
              <div className="w-2 h-2 bg-white rounded-full"></div>
            )}
          </div>
        </div>
      </div>

      {/* Call Instructions */}
      <div className="mt-6 bg-gold/10 rounded-lg p-4 border border-gold/20">
        <p className="text-sm text-brown">
          📞 <strong>Call Instructions:</strong> Listen to each question, then tap the green button to record your answer. 
          The assistant will automatically move to the next question after processing your response.
        </p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-charcoal" />
      </div>
      
      <h3 className="text-2xl font-bold text-charcoal mb-4 font-serif">
        Profile Complete!
      </h3>
      
      <p className="text-brown mb-6">
        Thank you for sharing your story. Your artisan profile has been created successfully.
      </p>

      {/* Profile Summary */}
      <div className="bg-cream rounded-lg p-6 mb-6 text-left">
        <h4 className="font-semibold text-charcoal mb-4">Your Profile:</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Name:</strong> {profileData.name}</div>
          <div><strong>Craft Type:</strong> {profileData.craftType}</div>
          <div><strong>Experience:</strong> {profileData.experienceYears} years</div>
          <div><strong>Language:</strong> {getLanguageConfig(language)?.name}</div>
        </div>
      </div>

      <Button 
        onClick={handleComplete}
        className="bg-gold hover:bg-gold-light text-charcoal"
      >
        Continue to Dashboard
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );

  return (
    <div className="bg-cream rounded-2xl p-8 shadow-sm">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6 text-sm">
          <strong>Debug Info:</strong><br/>
          Language: {language}<br/>
          Current Step: {currentStep}<br/>
          Questions: {questions.length}<br/>
          Current Question Index: {currentQuestionIndex}<br/>
          Profile Data: {Object.keys(profileData).join(', ')}
        </div>
      )}

      {currentStep === 'intro' && renderIntroStep()}
      {currentStep === 'questions' && renderQuestionsStep()}
      {currentStep === 'complete' && renderCompleteStep()}

      {/* Tutorial Overlay */}
      <div className="mt-6 bg-gold/10 border border-gold/20 rounded-lg p-4 text-center">
        <p className="text-sm text-brown">
          💡 <strong>Tip:</strong> Speak clearly and naturally. The AI will understand your responses and ask follow-up questions if needed.
        </p>
      </div>
    </div>
  );
}