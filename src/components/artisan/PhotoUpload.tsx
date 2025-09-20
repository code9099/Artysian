'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Check, Image, Mic, MicOff } from 'lucide-react';
import { storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useLanguage } from '@/contexts/LanguageContext';
import { speechService } from '@/lib/speechService';
import { toast } from 'sonner';

interface PhotoUploadProps {
  onFileSelect: (files: File[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  onVoiceCommand?: (command: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  userId?: string;
  enableVoiceCommands?: boolean;
  showVoiceInstructions?: boolean;
}

export function PhotoUpload({
  onFileSelect,
  onUploadComplete,
  onVoiceCommand,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  userId,
  enableVoiceCommands = true,
  showVoiceInstructions = true,
}: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isListeningForCommands, setIsListeningForCommands] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { currentLanguage } = useLanguage();

  // Voice recording for commands
  const voiceRecording = useVoiceRecording({
    maxDuration: 10, // Short recordings for commands
    autoTranscribe: true,
    onRecordingComplete: handleVoiceCommand,
  });

  // Voice command patterns
  const voiceCommands = {
    camera: ['swipe up', 'camera', 'take photo', 'capture', 'shoot'],
    gallery: ['gallery', 'choose files', 'select photos', 'pick images', 'browse'],
    upload: ['upload', 'save', 'submit', 'send'],
    cancel: ['cancel', 'stop', 'nevermind', 'back'],
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported image format`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
    
    // Provide voice feedback
    if (enableVoiceCommands && validFiles.length > 0) {
      speakFeedback(`${validFiles.length} photo${validFiles.length !== 1 ? 's' : ''} selected`);
    }
  }, [selectedFiles, maxFiles, acceptedTypes, onFileSelect, enableVoiceCommands]);

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onFileSelect(newFiles);
  }, [selectedFiles, previews, onFileSelect]);

  const uploadToFirebase = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `crafts/${userId || 'anonymous'}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const url = await uploadToFirebase(file);
        setUploadProgress(((index + 1) / selectedFiles.length) * 100);
        return url;
      });

      const urls = await Promise.all(uploadPromises);

      toast.success(`Successfully uploaded ${urls.length} photo${urls.length !== 1 ? 's' : ''}!`);
      
      if (enableVoiceCommands) {
        speakFeedback('Photos uploaded successfully! Ready for the next step.');
      }

      if (onUploadComplete) {
        onUploadComplete(urls);
      }

      // Reset state
      setSelectedFiles([]);
      setPreviews([]);
      setUploadProgress(0);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos. Please try again.');
      
      if (enableVoiceCommands) {
        speakFeedback('Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const speakFeedback = async (text: string) => {
    try {
      const audioDataUri = await speechService.textToSpeech(text, currentLanguage.ttsCode);
      const audio = new Audio(audioDataUri);
      audio.play();
    } catch (error) {
      console.error('Error speaking feedback:', error);
    }
  };

  const handleVoiceCommand = useCallback(async (
    audioBlob: Blob,
    audioDataUri: string,
    transcript?: string
  ) => {
    if (!transcript) return;

    const command = transcript.toLowerCase();
    onVoiceCommand?.(command);

    // Check for camera commands
    if (voiceCommands.camera.some(cmd => command.includes(cmd))) {
      cameraInputRef.current?.click();
      speakFeedback('Opening camera');
      return;
    }

    // Check for gallery commands
    if (voiceCommands.gallery.some(cmd => command.includes(cmd))) {
      fileInputRef.current?.click();
      speakFeedback('Opening gallery');
      return;
    }

    // Check for upload commands
    if (voiceCommands.upload.some(cmd => command.includes(cmd))) {
      if (selectedFiles.length > 0) {
        handleUpload();
      } else {
        speakFeedback('Please select photos first');
      }
      return;
    }

    // Check for cancel commands
    if (voiceCommands.cancel.some(cmd => command.includes(cmd))) {
      setSelectedFiles([]);
      setPreviews([]);
      speakFeedback('Photos cleared');
      return;
    }

    // If no command matched, provide help
    speakFeedback('Say "swipe up" to take a photo, "gallery" to choose files, or "upload" to save your photos');
  }, [selectedFiles, handleUpload, onVoiceCommand]);

  const toggleVoiceListening = () => {
    if (voiceRecording.isRecording) {
      voiceRecording.stopRecording();
      setIsListeningForCommands(false);
    } else {
      voiceRecording.startRecording();
      setIsListeningForCommands(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-elevated">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-charcoal font-serif">
            Upload Craft Photos
          </h3>
          <p className="text-sm text-brown mt-1">
            Show your beautiful creations from different angles
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {enableVoiceCommands && (
            <Button
              onClick={toggleVoiceListening}
              size="sm"
              variant={voiceRecording.isRecording ? 'destructive' : 'outline'}
              className={voiceRecording.isRecording ? '' : 'border-gold text-gold hover:bg-gold hover:text-charcoal'}
            >
              {voiceRecording.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-brown">
            <Image className="w-4 h-4" />
            <span>{selectedFiles.length}/{maxFiles}</span>
          </div>
        </div>
      </div>

      {/* Voice Instructions */}
      {showVoiceInstructions && enableVoiceCommands && (
        <div className="mb-6 p-4 bg-gold/10 rounded-lg border border-gold/20">
          <div className="flex items-center space-x-2 mb-2">
            <Mic className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-charcoal">Voice Commands</span>
          </div>
          <div className="text-xs text-brown space-y-1">
            <p>• Say <strong>"swipe up"</strong> to take a photo</p>
            <p>• Say <strong>"gallery"</strong> to choose from your photos</p>
            <p>• Say <strong>"upload"</strong> to save your selected photos</p>
          </div>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          variant="outline"
          className="h-24 flex-col space-y-2 border-dashed border-2 border-brown/30 hover:border-brown hover:bg-brown/5 transition-colors"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="w-8 h-8 text-brown" />
          <span className="text-brown text-sm font-medium">Take Photo</span>
          <span className="text-xs text-brown/70">Say "swipe up"</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex-col space-y-2 border-dashed border-2 border-brown/30 hover:border-brown hover:bg-brown/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-8 h-8 text-brown" />
          <span className="text-brown text-sm font-medium">Choose Files</span>
          <span className="text-xs text-brown/70">From gallery</span>
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
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

      {/* Voice Listening Indicator */}
      {voiceRecording.isRecording && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-700">Listening for voice commands...</span>
          </div>
        </div>
      )}

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-charcoal mb-3">Selected Photos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-beige shadow-sm"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {(selectedFiles[index]?.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-brown mb-2">
            <span>Uploading photos...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-beige rounded-full h-2">
            <div
              className="bg-gold h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-brown">
            {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-charcoal mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Upload Photos
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}