'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Mic, MicOff, Upload, MapPin, Check, X, Edit3 } from 'lucide-react';
import { speechService } from '@/lib/speechService';
import { geminiWrapper } from '@/lib/geminiWrapper';
import { firestoreService } from '@/lib/firestoreService';
import { storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getLanguageConfig } from '@/lib/languages';
import { toast } from 'sonner';

interface VoiceAssistantWorkflowProps {
  userId: string;
  onProductCreated: (product: any) => void;
  onCancel: () => void;
}

export function VoiceAssistantWorkflow({
  userId,
  onProductCreated,
  onCancel
}: VoiceAssistantWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'voice' | 'summary' | 'location'>('upload');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [productInfo, setProductInfo] = useState<any>({});
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [productSummary, setProductSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const language = localStorage.getItem('craftstory_user_language') || 'en';
  const languageConfig = getLanguageConfig(language);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsAssistantSpeaking(false);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Voice command handler for "swipe up"
  useEffect(() => {
    const handleVoiceCommand = (command: string) => {
      const lowerCommand = command.toLowerCase();
      if (lowerCommand.includes('swipe up') || lowerCommand.includes('camera') || lowerCommand.includes('photo')) {
        if (currentStep === 'upload') {
          cameraInputRef.current?.click();
        }
      }
    };

    // Expose to global scope for voice commands
    (window as any).handleCameraVoiceCommand = handleVoiceCommand;
  }, [currentStep]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(files);
    
    // Upload files to Firebase Storage
    try {
      const uploadPromises = files.map(async (file) => {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `crafts/${userId}/${fileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages(urls);
      
      toast.success(`Uploaded ${files.length} photo${files.length !== 1 ? 's' : ''}!`);
      
      // Auto-advance to voice step
      setTimeout(() => {
        setCurrentStep('voice');
        startVoiceAssistant();
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos. Please try again.');
    }
  };

  const startVoiceAssistant = async () => {
    const greeting = language === 'hi' 
      ? 'नमस्ते! मैं आपका AI सहायक हूँ। आइए आपके शिल्प के बारे में बात करते हैं। कृपया अपने उत्पाद के बारे में बताएं।'
      : 'Hello! I\'m your AI assistant. Let\'s talk about your craft. Please tell me about your product.';
    
    await speakText(greeting);
    setConversationHistory(['Assistant: ' + greeting]);
  };

  const speakText = async (text: string) => {
    try {
      setIsAssistantSpeaking(true);
      const audioData = await speechService.textToSpeech(text, languageConfig?.ttsCode || 'en-US');
      
      if (audioRef.current && audioData) {
        audioRef.current.src = audioData;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsAssistantSpeaking(false);
    }
  };

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
        await processAudio(audioBlob);
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

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const audioData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      // Speech to text
      const transcript = await speechService.speechToText(audioData, languageConfig?.speechCode || 'en-US');
      
      if (!transcript.trim()) {
        throw new Error('No speech detected. Please try again.');
      }

      setCurrentTranscript(transcript);
      console.log('User said:', transcript);

      // Add to conversation
      const newHistory = [...conversationHistory, `User: ${transcript}`];
      setConversationHistory(newHistory);

      // Generate AI response
      const response = await geminiWrapper.generateConversationalResponse(
        transcript,
        'product_description',
        newHistory.join('\n'),
        language
      );

      console.log('Assistant responds:', response);
      
      // Add assistant response
      const updatedHistory = [...newHistory, `Assistant: ${response}`];
      setConversationHistory(updatedHistory);

      // Extract product information
      await extractProductInfo(transcript);

      // Speak response
      await speakText(response);

      // Check if we have enough information
      if (updatedHistory.length > 10) {
        setTimeout(() => {
          generateProductSummary();
        }, 2000);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractProductInfo = async (transcript: string) => {
    try {
      const enhanced = await geminiWrapper.extractProductInfo(transcript, {
        question: 'Tell me about your product'
      });

      // Simple extraction logic
      const info = { ...productInfo };
      
      if (!info.name && (transcript.toLowerCase().includes('this is') || transcript.toLowerCase().includes('called'))) {
        const nameMatch = transcript.match(/(?:this is|called|named)\s+([^.]+)/i);
        if (nameMatch) info.name = nameMatch[1].trim();
      }

      if (transcript.toLowerCase().includes('material')) {
        info.materials = enhanced;
      } else if (transcript.toLowerCase().includes('technique') || transcript.toLowerCase().includes('method')) {
        info.techniques = enhanced;
      } else if (transcript.toLowerCase().includes('story') || transcript.toLowerCase().includes('tradition')) {
        info.story = enhanced;
      } else if (!info.description) {
        info.description = enhanced;
      }

      setProductInfo(info);
    } catch (error) {
      console.error('Error extracting product info:', error);
    }
  };

  const generateProductSummary = async () => {
    try {
      const summary = await geminiWrapper.generateProductSummary({
        ...productInfo,
        images: uploadedImages,
        conversation: conversationHistory
      });
      
      setProductSummary(summary);
      setCurrentStep('summary');
      
      await speakText('Perfect! I\'ve created a summary of your product. Please review it and make any changes you\'d like.');
    } catch (error) {
      console.error('Error generating summary:', error);
      setProductSummary('Beautiful handcrafted item showcasing traditional techniques and cultural heritage.');
      setCurrentStep('summary');
    }
  };

  const handleSummaryComplete = () => {
    setCurrentStep('location');
    getCurrentLocation();
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          toast.success('Location captured for shipping details');
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Could not get location. You can add it manually later.');
        }
      );
    }
  };

  const handleProductComplete = async () => {
    try {
      const productData = {
        artisanId: userId,
        title: productInfo.name || 'Handcrafted Item',
        description: productSummary,
        images: uploadedImages,
        materials: productInfo.materials || '',
        techniques: productInfo.techniques || '',
        story: productInfo.story || '',
        location: location,
        conversationData: conversationHistory,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const productId = await firestoreService.saveCraft(productData);
      
      const finalProduct = { ...productData, id: productId };
      onProductCreated(finalProduct);
      
      toast.success('Product created and listed successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    }
  };

  if (currentStep === 'upload') {
    return (
      <div className="bg-cream rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Camera className="w-16 h-16 text-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-charcoal mb-2 font-serif">Upload Product Photos</h3>
          <p className="text-brown">
            Take photos of your craft or choose from gallery. Say "swipe up" to open camera!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Button
            onClick={() => cameraInputRef.current?.click()}
            className="h-32 flex-col space-y-3 bg-green-500 hover:bg-green-600 text-white"
            size="lg"
          >
            <Camera className="w-8 h-8" />
            <span>Take Photo</span>
            <span className="text-xs opacity-80">Say "swipe up"</span>
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="h-32 flex-col space-y-3 border-gold text-gold hover:bg-gold hover:text-charcoal"
            size="lg"
          >
            <Upload className="w-8 h-8" />
            <span>Choose from Gallery</span>
            <span className="text-xs opacity-80">Select multiple</span>
          </Button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-charcoal mb-3">Selected Photos:</h4>
            <div className="grid grid-cols-3 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'voice') {
    return (
      <div className="bg-cream rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Mic className="w-16 h-16 text-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-charcoal mb-2 font-serif">Tell Your Story</h3>
          <p className="text-brown">
            Our AI assistant will help you describe your craft through natural conversation
          </p>
        </div>

        {/* Voice Interface */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isRecording ? 'bg-red-500' : isAssistantSpeaking ? 'bg-blue-500' : 'bg-gold'
            }`}>
              {isRecording ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : isAssistantSpeaking ? (
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              ) : (
                <Mic className="w-10 h-10 text-charcoal" />
              )}
            </div>

            <div className="space-y-2">
              {isAssistantSpeaking && (
                <p className="text-blue-600 font-medium">Assistant is speaking...</p>
              )}
              {isRecording && (
                <p className="text-red-600 font-medium">Recording your response...</p>
              )}
              {isProcessing && (
                <p className="text-gold font-medium">Processing your answer...</p>
              )}
              {!isRecording && !isProcessing && !isAssistantSpeaking && (
                <p className="text-brown">Tap to record your response</p>
              )}
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isAssistantSpeaking}
              className={`px-8 py-3 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gold hover:bg-gold-light text-charcoal'
              }`}
              size="lg"
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </div>
        </div>

        {/* Current transcript */}
        {currentTranscript && (
          <div className="bg-gold/10 rounded-lg p-4 mb-4 border border-gold/20">
            <p className="text-sm text-charcoal">
              <strong>You said:</strong> "{currentTranscript}"
            </p>
          </div>
        )}

        {/* Conversation progress */}
        <div className="bg-beige rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-charcoal mb-2">Information Collected:</h4>
          <div className="space-y-1 text-sm">
            {productInfo.name && <div><strong>Product:</strong> {productInfo.name}</div>}
            {productInfo.materials && <div><strong>Materials:</strong> {productInfo.materials}</div>}
            {productInfo.techniques && <div><strong>Techniques:</strong> {productInfo.techniques}</div>}
            {productInfo.story && <div><strong>Story:</strong> {productInfo.story.substring(0, 100)}...</div>}
          </div>
          <div className="mt-2 text-xs text-brown">
            Conversation turns: {Math.floor(conversationHistory.length / 2)}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('upload')}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            Back to Photos
          </Button>
          
          <Button
            onClick={generateProductSummary}
            disabled={conversationHistory.length < 6}
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            Generate Summary
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'summary') {
    return (
      <div className="bg-cream rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Edit3 className="w-16 h-16 text-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-charcoal mb-2 font-serif">Product Summary</h3>
          <p className="text-brown">
            Review and edit your product description. This will be shown to customers.
          </p>
        </div>

        {/* Product Images */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-4">
            {uploadedImages.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Editable Summary */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-charcoal mb-2">
            Product Description:
          </label>
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={productSummary}
                onChange={(e) => setProductSummary(e.target.value)}
                className="w-full h-32 p-4 border border-beige rounded-lg resize-none focus:border-gold focus:outline-none"
                placeholder="Describe your product..."
              />
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  className="bg-gold hover:bg-gold-light text-charcoal"
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-beige">
              <p className="text-charcoal mb-4">{productSummary}</p>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="border-gold text-gold hover:bg-gold hover:text-charcoal"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit Description
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('voice')}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            Back to Voice
          </Button>
          
          <Button
            onClick={handleSummaryComplete}
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            Continue to Location
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'location') {
    return (
      <div className="bg-cream rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <MapPin className="w-16 h-16 text-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-charcoal mb-2 font-serif">Shipping Location</h3>
          <p className="text-brown">
            We'll capture your location for shipping and billing details
          </p>
        </div>

        {location ? (
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Location Captured</span>
            </div>
            <p className="text-sm text-green-700">
              Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Accuracy: ±{Math.round(location.accuracy)}m
            </p>
          </div>
        ) : (
          <div className="bg-gold/10 rounded-lg p-4 mb-6 border border-gold/20">
            <p className="text-brown text-center">
              Getting your location for shipping details...
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-charcoal mb-4">Product Ready to List:</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Title:</strong> {productInfo.name || 'Handcrafted Item'}</div>
            <div><strong>Images:</strong> {uploadedImages.length} photo{uploadedImages.length !== 1 ? 's' : ''}</div>
            <div><strong>Description:</strong> {productSummary.substring(0, 100)}...</div>
            <div><strong>Location:</strong> {location ? 'Captured' : 'Pending...'}</div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('summary')}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            Back to Summary
          </Button>
          
          <Button
            onClick={handleProductComplete}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Check className="w-5 h-5 mr-2" />
            List Product
          </Button>
        </div>
      </div>
    );
  }

  return null;
}