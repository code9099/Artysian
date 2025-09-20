'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Check, Image } from 'lucide-react';
import { storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

interface UploadCameraProps {
  onFileSelect: (files: File[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  userId?: string;
}

export function UploadCamera({
  onFileSelect,
  onUploadComplete,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  userId
}: UploadCameraProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onFileSelect(newFiles);
  };

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
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('swipe up') || lowerCommand.includes('camera') || lowerCommand.includes('photo')) {
      cameraInputRef.current?.click();
    } else if (lowerCommand.includes('gallery') || lowerCommand.includes('choose') || lowerCommand.includes('select')) {
      fileInputRef.current?.click();
    }
  };

  // Expose voice command handler
  (window as any).handleCameraVoiceCommand = handleVoiceCommand;

  return (
    <div className="bg-cream rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-charcoal font-serif">
          Upload Craft Photos
        </h3>
        <div className="flex items-center space-x-2 text-sm text-brown">
          <Image className="w-4 h-4" />
          <span>{selectedFiles.length}/{maxFiles}</span>
        </div>
      </div>

      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          variant="outline"
          className="h-24 flex-col space-y-2 border-dashed border-2 border-brown/30 hover:border-brown hover:bg-brown/5 transition-colors"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="w-8 h-8 text-brown" />
          <span className="text-brown text-sm">Take Photo</span>
          <span className="text-xs text-brown/70">Say "swipe up"</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex-col space-y-2 border-dashed border-2 border-brown/30 hover:border-brown hover:bg-brown/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-8 h-8 text-brown" />
          <span className="text-brown text-sm">Choose Files</span>
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
        <div className="flex justify-between items-center mb-4">
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

      {/* Guidelines */}
      <div className="p-3 bg-gold/10 rounded-lg border border-gold/20">
        <p className="text-xs text-brown">
          💡 <strong>Voice Commands:</strong> Say "swipe up" to take a photo or "choose files" to select from gallery.<br />
          📸 <strong>Tips:</strong> Upload clear, well-lit photos from different angles. Max {maxFiles} photos, 10MB each.
        </p>
      </div>
    </div>
  );
}