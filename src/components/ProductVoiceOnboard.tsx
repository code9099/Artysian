'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, CheckCircle, Volume2, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

interface ProductVoiceOnboardProps {
  onComplete: (productInfo: any) => void;
  onSkip: () => void;
}

export function ProductVoiceOnboard({ onComplete, onSkip }: ProductVoiceOnboardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [productInfo, setProductInfo] = useState<any>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const questions = [
    {
      id: 'productName',
      question: 'What is the name of your craft?',
      questionTranslated: 'What is the name of your craft?',
      field: 'name'
    },
    {
      id: 'description',
      question: 'Describe your craft in detail. What makes it special?',
      questionTranslated: 'Describe your craft in detail. What makes it special?',
      field: 'description'
    },
    {
      id: 'materials',
      question: 'What materials did you use to make this craft?',
      questionTranslated: 'What materials did you use to make this craft?',
      field: 'materials'
    },
    {
      id: 'techniques',
      question: 'What techniques did you use?',
      questionTranslated: 'What techniques did you use?',
      field: 'techniques'
    },
    {
      id: 'culturalSignificance',
      question: 'What is the cultural significance of this craft?',
      questionTranslated: 'What is the cultural significance of this craft?',
      field: 'culturalSignificance'
    }
  ];

  const currentQ = questions[currentQuestion];

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info('Recording started...');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please ensure microphone access is granted.');
      toast.error('Failed to start recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Recording stopped. Processing...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const audioData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      // Call speech-to-text API with error handling
      let transcript = '';
      try {
        const response = await fetch('/api/speech/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: audioData,
            languageCode: 'en-US'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to transcribe audio');
        }

        const data = await response.json();
        transcript = data.transcript || '';
        
        if (!transcript.trim()) {
          throw new Error('No speech detected. Please speak clearly and try again.');
        }
      } catch (speechError: any) {
        console.error('Speech-to-text error:', speechError);
        setError(speechError.message || 'Could not understand speech. Please try again.');
        toast.error('Could not understand speech. Please try again.');
        return;
      }

      setTranscript(transcript);
      
      // Process with Gemini for product information extraction with fallback
      let extractedInfo = transcript; // Default fallback
      
      try {
        const geminiResponse = await fetch('/api/gemini/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: transcript,
            question: currentQ,
            action: 'extractProductInfo',
            languageCode: 'en'
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          extractedInfo = geminiData.extractedInfo || transcript;
        } else {
          console.warn('Gemini processing failed, using raw transcript');
        }
      } catch (geminiError) {
        console.error('Gemini processing error:', geminiError);
        // Continue with raw transcript as fallback
      }
      
      // Update product info
      setProductInfo((prev: any) => ({
        ...prev,
        [currentQ.field]: extractedInfo
      }));
      
      toast.success('Audio processed successfully!');
    } catch (err: any) {
      console.error('Error processing audio:', err);
      setError(err.message || 'An error occurred during audio processing.');
      toast.error(err.message || 'Failed to process audio.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playQuestion = async () => {
    setIsPlayingAudio(true);
    try {
      const response = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentQ.questionTranslated,
          languageCode: 'en-US'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const data = await response.json();
      
      if (audioRef.current && data.audioDataUri) {
        audioRef.current.src = data.audioDataUri;
        await audioRef.current.play();
      } else {
        throw new Error('No audio data received');
      }
    } catch (err: any) {
      console.error('Error playing question:', err);
      // Don't show error to user for TTS failures - they can still read the question
      toast.info('Audio playback not available, but you can read the question above.');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTranscript('');
    } else {
      onComplete(productInfo);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleSwipeUp = (e: React.TouchEvent) => {
    e.preventDefault();
    onSkip();
  };

  return (
    <div 
      className="bg-cream p-8 rounded-xl shadow-lg text-center"
      onTouchStart={(e) => {
        const touch = e.touches[0];
        const startY = touch.clientY;
        
        const handleTouchMove = (moveEvent: TouchEvent) => {
          const currentY = moveEvent.touches[0].clientY;
          const diff = startY - currentY;
          
          if (diff > 50) { // Swipe up detected
            onSkip();
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
          }
        };
        
        const handleTouchEnd = () => {
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        };
        
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
      }}
    >
      <h2 className="text-3xl font-bold text-charcoal mb-4 font-serif">
        Tell Us About Your Craft
      </h2>
      <p className="text-lg text-brown mb-6">
        Our AI assistant will ask you questions about your craft. Answer each question by speaking.
      </p>

      {/* Question */}
      <div className="bg-beige rounded-lg p-6 mb-8 text-left">
        <h3 className="text-xl font-semibold text-charcoal mb-3">
          Question {currentQuestion + 1} of {questions.length}
        </h3>
        <p className="text-brown text-lg mb-4">
          {currentQ.questionTranslated}
        </p>
        
        <Button
          variant="outline"
          size="sm"
          onClick={playQuestion}
          disabled={isPlayingAudio || isProcessing}
          className="border-gold text-gold hover:bg-gold-light hover:text-charcoal"
        >
          {isPlayingAudio ? (
            'Playing...'
          ) : (
            <>
              <Volume2 className="mr-2 h-4 w-4" /> Replay Question
            </>
          )}
        </Button>
      </div>

      {/* Recording Area */}
      <div className="relative w-full max-w-md mx-auto h-32 mb-8 bg-beige rounded-lg flex items-center justify-center">
        {!isRecording && !isProcessing && (
          <p className="text-brown z-10">Press the mic to start recording</p>
        )}
        {isProcessing && (
          <div className="flex items-center text-brown z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mr-2"></div>
            Processing...
          </div>
        )}
        {isRecording && (
          <div className="flex items-center text-red-600 z-10">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
            Recording...
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-beige rounded-lg p-4 mb-6 text-left">
          <h4 className="font-semibold text-charcoal mb-2">Your Answer:</h4>
          <p className="text-brown italic">"{transcript}"</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <Button
          size="lg"
          className={`px-8 py-6 text-lg ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gold hover:bg-gold-light'} text-charcoal`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isPlayingAudio}
        >
          {isRecording ? (
            <>
              <Square className="mr-2 h-5 w-5" /> Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" /> Start Recording
            </>
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleSkip}
          className="border-brown text-brown hover:bg-brown hover:text-cream"
        >
          Skip
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!transcript || isProcessing}
          className="bg-gold hover:bg-gold-light text-charcoal"
        >
          {currentQuestion === questions.length - 1 ? 'Complete' : 'Next Question'}
        </Button>
      </div>

      {/* Swipe Up Hint */}
      <div className="mt-6 text-sm text-brown">
        <div className="flex items-center justify-center space-x-2">
          <ArrowUp className="w-4 h-4" />
          <span>Swipe up to skip</span>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mt-4 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
}
