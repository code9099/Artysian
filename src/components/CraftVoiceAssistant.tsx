'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Square, Play, Pause, Camera, Upload, StopCircle, SkipForward, Edit3 } from 'lucide-react';
import { speechService } from '@/lib/speechService';
import { firestoreService } from '@/lib/firestoreService';
import { getLanguageConfig } from '@/lib/languages';
import { toast } from 'sonner';
import { UploadCamera } from '@/components/UploadCamera';

interface ConversationStep {
  id: string;
  type: 'greeting' | 'tutorial' | 'photo' | 'material' | 'story' | 'pricing' | 'shipping' | 'hashtags' | 'complete';
  question: {
    en: string;
    hi: string;
    ta: string;
    bn: string;
  };
  required: boolean;
  skipable: boolean;
}

interface SessionData {
  sessionId: string;
  artisanId: string;
  language: string;
  currentStep: string;
  responses: Array<{
    step: string;
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  productImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CraftVoiceAssistantProps {
  language: string;
  artisanId: string;
  onComplete: (sessionData: SessionData) => void;
  onStop?: () => void;
}

const CONVERSATION_STEPS: ConversationStep[] = [
  {
    id: 'greeting',
    type: 'greeting',
    question: {
      en: 'Hello! I am your friend, I will help you list your product. Shall we start?',
      hi: 'नमस्ते! मैं आपकी दोस्त हूँ, आपकी मदद करूंगी अपना प्रोडक्ट लिस्ट करने में। क्या हम शुरू करें?',
      ta: 'வணக்கம்! நான் உங்களுடைய நண்பர், உங்களின் பொருளை பட்டியலிட உதவுவேன். ஆரம்பிக்கலாமா?',
      bn: 'নমস্কার! আমি আপনার বন্ধু, আপনার পণ্য তালিকাভুক্ত করতে সাহায্য করব। আমরা কি শুরু করব?'
    },
    required: false,
    skipable: true
  },
  {
    id: 'tutorial',
    type: 'tutorial',
    question: {
      en: 'Let me quickly explain how this works. I will ask you questions about your craft, and you can answer by speaking. Say "skip" anytime to move forward. Ready?',
      hi: 'मैं जल्दी से समझाती हूँ कि यह कैसे काम करता है। मैं आपसे आपकी कला के बारे में सवाल पूछूंगी, और आप बोलकर जवाब दे सकते हैं। आगे बढ़ने के लिए कभी भी "स्किप" कहें। तैयार हैं?',
      ta: 'இது எப்படி வேலை செய்கிறது என்பதை விரைவாக விளக்குகிறேன். உங்கள் கைவினை பற்றி கேள்விகள் கேட்பேன், நீங்கள் பேசி பதில் சொல்லலாம். முன்னேற "ஸ்கிப்" என்று எப்போது வேண்டுமானாலும் சொல்லுங்கள். தயாரா?',
      bn: 'এটি কীভাবে কাজ করে তা দ্রুত ব্যাখ্যা করি। আমি আপনার কারুশিল্প সম্পর্কে প্রশ্ন জিজ্ঞাসা করব, এবং আপনি কথা বলে উত্তর দিতে পারেন। এগিয়ে যেতে যেকোনো সময় "স্কিপ" বলুন। প্রস্তুত?'
    },
    required: false,
    skipable: true
  },
  {
    id: 'photo',
    type: 'photo',
    question: {
      en: 'Great! Now let\'s take a photo of your craft. You can either take a new photo or upload from your gallery. What would you prefer?',
      hi: 'बहुत बढ़िया! अब आइए अपनी कला की फोटो लेते हैं। आप या तो नई फोटो ले सकते हैं या अपनी गैलरी से अपलोड कर सकते हैं। आप क्या पसंद करेंगे?',
      ta: 'அருமை! இப்போது உங்கள் கைவினையின் புகைப்படம் எடுப்போம். நீங்கள் புதிய புகைப்படம் எடுக்கலாம் அல்லது உங்கள் கேலரியிலிருந்து பதிவேற்றலாம். எதை விரும்புவீர்கள்?',
      bn: 'দুর্দান্ত! এখন আপনার কারুশিল্পের ছবি তুলি। আপনি হয় নতুন ছবি তুলতে পারেন বা আপনার গ্যালারি থেকে আপলোড করতে পারেন। আপনি কী পছন্দ করবেন?'
    },
    required: true,
    skipable: false
  },
  {
    id: 'material',
    type: 'material',
    question: {
      en: 'Beautiful craft! What material is this made of? Please tell me about the materials you used.',
      hi: 'सुंदर कला! यह किस मैटेरियल से बना है? कृपया बताएं कि आपने कौन से मैटेरियल का उपयोग किया है।',
      ta: 'அழகான கைவினை! இது எந்த பொருளால் செய்யப்பட்டது? நீங்கள் பயன்படுத்திய பொருட்களைப் பற்றி சொல்லுங்கள்.',
      bn: 'সুন্দর কারুশিল্প! এটি কোন উপাদান দিয়ে তৈরি? আপনি যে উপাদানগুলি ব্যবহার করেছেন সে সম্পর্কে বলুন।'
    },
    required: true,
    skipable: false
  },
  {
    id: 'story',
    type: 'story',
    question: {
      en: 'Tell me the story of this craft. How did you make it? What inspired you?',
      hi: 'इसकी कहानी बताइए, आपने इसे कैसे बनाया? आपको क्या प्रेरणा मिली?',
      ta: 'இந்த கைவினையின் கதையைச் சொல்லுங்கள். இதை எப்படி செய்தீர்கள்? உங்களுக்கு என்ன உத்வேகம் கிடைத்தது?',
      bn: 'এই কারুশিল্পের গল্প বলুন। আপনি এটি কীভাবে তৈরি করেছেন? আপনাকে কী অনুপ্রাণিত করেছে?'
    },
    required: true,
    skipable: false
  },
  {
    id: 'pricing',
    type: 'pricing',
    question: {
      en: 'How much time did it take to make this piece? What price would you like to set for it?',
      hi: 'इस पीस को बनाने में कितना समय लगा? आप इसकी क्या कीमत रखना चाहते हैं?',
      ta: 'இந்த துண்டை உருவாக்க எவ்வளவு நேரம் ஆனது? இதற்கு என்ன விலை வைக்க விரும்புகிறீர்கள்?',
      bn: 'এই টুকরোটি তৈরি করতে কত সময় লেগেছে? আপনি এর জন্য কী দাম রাখতে চান?'
    },
    required: true,
    skipable: false
  },
  {
    id: 'shipping',
    type: 'shipping',
    question: {
      en: 'For shipping, I need to confirm your location. Can you tell me your city and state?',
      hi: 'शिपिंग के लिए, मुझे आपकी लोकेशन कन्फर्म करनी होगी। क्या आप अपना शहर और राज्य बता सकते हैं?',
      ta: 'கப்பல் போக்குவரத்துக்காக, உங்கள் இருப்பிடத்தை உறுதிப்படுத்த வேண்டும். உங்கள் நகரம் மற்றும் மாநிலத்தைச் சொல்ல முடியுமா?',
      bn: 'শিপিংয়ের জন্য, আমার আপনার অবস্থান নিশ্চিত করতে হবে। আপনি কি আপনার শহর এবং রাজ্য বলতে পারেন?'
    },
    required: true,
    skipable: false
  },
  {
    id: 'hashtags',
    type: 'hashtags',
    question: {
      en: 'Finally, let me suggest some hashtags for your product. Based on what you told me, I think these tags would work well for social media.',
      hi: 'अंत में, मैं आपके प्रोडक्ट के लिए कुछ हैशटैग सुझाती हूँ। आपने जो बताया उसके आधार पर, मुझे लगता है ये टैग सोशल मीडिया के लिए अच्छे होंगे।',
      ta: 'இறுதியாக, உங்கள் தயாரிப்புக்கு சில ஹேஷ்டேக்குகளை பரிந்துரைக்கிறேன். நீங்கள் சொன்னதின் அடிப்படையில், இந்த டேக்குகள் சமூக ஊடகங்களுக்கு நன்றாக இருக்கும் என்று நினைக்கிறேன்.',
      bn: 'অবশেষে, আমি আপনার পণ্যের জন্য কিছু হ্যাশট্যাগ সুপারিশ করি। আপনি যা বলেছেন তার ভিত্তিতে, আমি মনে করি এই ট্যাগগুলি সোশ্যাল মিডিয়ার জন্য ভাল কাজ করবে।'
    },
    required: false,
    skipable: true
  }
];

export function CraftVoiceAssistant({
  language,
  artisanId,
  onComplete,
  onStop
}: CraftVoiceAssistantProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionData, setSessionData] = useState<SessionData>({
    sessionId: `session_${Date.now()}`,
    artisanId,
    language,
    currentStep: CONVERSATION_STEPS[0].id,
    responses: [],
    productImages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStep = CONVERSATION_STEPS[currentStepIndex];
  const languageConfig = getLanguageConfig(language);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setIsPlayingAudio(false);
      // Auto-start recording after assistant finishes speaking (except for photo step)
      if (isActive && currentStep.type !== 'photo' && currentStep.type !== 'complete') {
        setTimeout(() => {
          startRecording();
        }, 1000);
      }
    };
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isActive, currentStep]);

  // Auto-start conversation when component mounts
  useEffect(() => {
    if (isActive && currentStepIndex === 0) {
      setTimeout(() => {
        speakQuestion();
      }, 1000);
    }
  }, []);

  // Save session data to Firestore whenever it updates
  useEffect(() => {
    const saveSession = async () => {
      try {
        await firestoreService.saveCraft({
          ...sessionData,
          id: sessionData.sessionId,
          artisanId: sessionData.artisanId
        });
      } catch (error) {
        console.error('Error saving session:', error);
      }
    };

    if (sessionData.responses.length > 0) {
      saveSession();
    }
  }, [sessionData]);

  const speakQuestion = async () => {
    if (!isActive) return;

    try {
      setIsPlayingAudio(true);
      const questionText = currentStep.question[language as keyof typeof currentStep.question] || currentStep.question.en;
      
      const audioUrl = await speechService.textToSpeech(questionText, languageConfig?.ttsCode || 'en-US');
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error speaking question:', error);
      setIsPlayingAudio(false);
      toast.error('Failed to play audio. Please check your speakers.');
    }
  };

  const startRecording = async () => {
    if (!isActive) return;

    try {
      setError(null);
      setCurrentTranscript('');
      
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
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info('Listening... Speak now!');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const audioData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      // Convert speech to text
      const transcript = await speechService.speechToText(audioData, languageConfig?.speechCode || 'en-US');
      
      if (!transcript.trim()) {
        throw new Error('No speech detected. Please try again.');
      }

      setCurrentTranscript(transcript);

      // Check for skip command
      const skipCommands = ['skip', 'स्किप', 'ஸ்கிப்', 'স্কিপ', 'next', 'अगला', 'அடுத்து', 'পরবর্তী'];
      if (skipCommands.some(cmd => transcript.toLowerCase().includes(cmd.toLowerCase()))) {
        if (currentStep.skipable) {
          handleSkip();
          return;
        }
      }

      // Save response
      const newResponse = {
        step: currentStep.id,
        question: currentStep.question[language as keyof typeof currentStep.question] || currentStep.question.en,
        answer: transcript,
        timestamp: new Date()
      };

      setSessionData(prev => ({
        ...prev,
        responses: [...prev.responses, newResponse],
        updatedAt: new Date()
      }));

      // Move to next step
      setTimeout(() => {
        moveToNextStep();
      }, 1500);

    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to process audio');
      toast.error('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    toast.info('Skipping this step...');
    moveToNextStep();
  };

  const moveToNextStep = () => {
    if (currentStepIndex < CONVERSATION_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setCurrentTranscript('');
      
      const nextStep = CONVERSATION_STEPS[nextIndex];
      setSessionData(prev => ({
        ...prev,
        currentStep: nextStep.id,
        updatedAt: new Date()
      }));

      // Handle special steps
      if (nextStep.type === 'photo') {
        setShowPhotoUpload(true);
      } else if (nextStep.type === 'complete') {
        handleComplete();
      } else {
        // Speak next question
        setTimeout(() => {
          speakQuestion();
        }, 1000);
      }
    } else {
      handleComplete();
    }
  };

  const handlePhotoUpload = (files: File[]) => {
    // In a real implementation, you would upload to Firebase Storage
    const mockUrls = files.map((file, index) => `uploaded_image_${index}_${file.name}`);
    
    setSessionData(prev => ({
      ...prev,
      productImages: mockUrls,
      updatedAt: new Date()
    }));

    setShowPhotoUpload(false);
    toast.success('Photos uploaded successfully!');
    
    // Move to next step after photo upload
    setTimeout(() => {
      moveToNextStep();
    }, 1000);
  };

  const handleComplete = () => {
    setIsActive(false);
    toast.success('Product listing completed!');
    onComplete(sessionData);
  };

  const handleStop = () => {
    setIsActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    toast.info('Voice assistant stopped');
    if (onStop) {
      onStop();
    }
  };

  const replayQuestion = () => {
    speakQuestion();
  };

  if (!isActive) {
    return (
      <div className="bg-cream rounded-2xl p-8 text-center">
        <h3 className="text-xl font-semibold text-charcoal mb-4">Voice Assistant Stopped</h3>
        <p className="text-brown mb-4">You can continue manually or restart the voice assistant.</p>
        <Button
          onClick={() => setIsActive(true)}
          className="bg-gold hover:bg-gold-light text-charcoal"
        >
          Restart Voice Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-cream rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-charcoal font-serif">
            CraftVoice Assistant
          </h3>
          <p className="text-sm text-brown">
            Step {currentStepIndex + 1} of {CONVERSATION_STEPS.length}: {currentStep.type}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleStop}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <StopCircle className="w-4 h-4 mr-2" />
          Stop Assistant
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-beige rounded-full h-2">
          <div 
            className="bg-gold h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / CONVERSATION_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="mb-6 p-4 bg-beige/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-charcoal">Assistant is saying:</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={replayQuestion}
            disabled={isPlayingAudio}
            className="text-gold hover:text-gold-light"
          >
            {isPlayingAudio ? (
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-charcoal">
          {currentStep.question[language as keyof typeof currentStep.question] || currentStep.question.en}
        </p>
      </div>

      {/* Photo Upload Section */}
      {showPhotoUpload && (
        <div className="mb-6">
          <UploadCamera
            onFileSelect={handlePhotoUpload}
            userId={artisanId}
            maxFiles={5}
          />
        </div>
      )}

      {/* Current Transcript */}
      {currentTranscript && (
        <div className="mb-6 p-4 bg-gold/10 rounded-lg border border-gold/20">
          <h4 className="font-semibold text-charcoal mb-2">You said:</h4>
          <p className="text-charcoal italic">"{currentTranscript}"</p>
        </div>
      )}

      {/* Recording Status */}
      <div className="mb-6 text-center">
        {isRecording ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-charcoal">Listening...</span>
            <Button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        ) : isProcessing ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
            <span className="text-charcoal">Processing your response...</span>
          </div>
        ) : isPlayingAudio ? (
          <div className="flex items-center justify-center space-x-3">
            <Volume2 className="w-5 h-5 text-gold animate-pulse" />
            <span className="text-charcoal">Assistant is speaking...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3">
            <Mic className="w-5 h-5 text-gold" />
            <span className="text-brown">Waiting for your response...</span>
            <Button
              onClick={startRecording}
              className="bg-gold hover:bg-gold-light text-charcoal"
            >
              <Mic className="w-4 h-4 mr-2" />
              Speak
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {currentStep.skipable && (
          <Button
            variant="outline"
            onClick={handleSkip}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Session Summary */}
      <div className="bg-beige/30 rounded-lg p-4">
        <h4 className="font-semibold text-charcoal mb-2">Session Progress:</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-brown">Responses collected:</span>
            <span className="text-charcoal font-medium">{sessionData.responses.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brown">Photos uploaded:</span>
            <span className="text-charcoal font-medium">{sessionData.productImages.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brown">Language:</span>
            <span className="text-charcoal font-medium">{languageConfig?.name}</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-gold/10 rounded-lg border border-gold/20">
        <p className="text-xs text-brown text-center">
          💡 <strong>Tip:</strong> Speak clearly when the microphone is active. 
          Say "skip" to move to the next question if it's optional.
        </p>
      </div>
    </div>
  );
}