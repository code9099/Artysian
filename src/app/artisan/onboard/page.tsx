'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceOnboard } from '@/components/VoiceOnboard';
import { ProductVoiceOnboard } from '@/components/ProductVoiceOnboard';
import { UploadCamera } from '@/components/UploadCamera';
import { ArtisanTutorial } from '@/components/ArtisanTutorial';
import { MultilingualVoiceAssistant } from '@/components/MultilingualVoiceAssistant';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Camera, Mic, Globe } from 'lucide-react';
import { ArtisanProfile } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export default function ArtisanOnboardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const steps = [
    { id: 1, title: 'Language Selection', icon: Globe, description: 'Choose your preferred language' },
    { id: 2, title: 'Voice Introduction', icon: Mic, description: 'Tell us about your craft' },
    { id: 3, title: 'Product Details', icon: Mic, description: 'Describe your specific craft' },
    { id: 4, title: 'Upload Images', icon: Camera, description: 'Share photos of your work' },
    { id: 5, title: 'Complete Profile', icon: CheckCircle, description: 'Review and finish setup' }
  ];

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleVoiceComplete = (profile: ArtisanProfile) => {
    // Store profile data and move to next step
    localStorage.setItem('craftstory_artisan_profile', JSON.stringify(profile));
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    // Simulate final processing
    setTimeout(() => {
      // Store onboarding completion
      localStorage.setItem('craftstory_onboarded', 'true');
      localStorage.setItem('craftstory_artisan_data', JSON.stringify({
        uploadedFiles: uploadedFiles.map(f => f.name),
        completedAt: new Date().toISOString()
      }));
      
      router.push('/artisan/dashboard');
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Language selection is always complete
      case 2:
        return false; // VoiceOnboard handles its own completion
      case 3:
        return false; // ProductVoiceOnboard handles its own completion
      case 4:
        return uploadedFiles.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['artisan']} redirectTo="/role-select" guestAllowed={false}>
      {showTutorial && (
        <ArtisanTutorial
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}
      <div className="min-h-screen py-20 px-4">
        <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-charcoal mb-4 font-serif">
            Welcome to CraftStory
          </h1>
          <p className="text-xl text-brown max-w-2xl mx-auto">
            Let's set up your artisan profile and get you started with sharing your amazing crafts
          </p>
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg text-sm text-left max-w-md mx-auto">
              <strong>Onboard Debug:</strong><br/>
              User Role: {user?.role || 'Not set'}<br/>
              Language: {user?.languageCode || 'Not set'}<br/>
              Current Step: {currentStep}
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted 
                        ? 'bg-gold text-charcoal' 
                        : isActive 
                        ? 'bg-gold text-charcoal' 
                        : 'bg-beige text-brown'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${
                        isActive || isCompleted ? 'text-charcoal' : 'text-brown'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-brown/80">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-gold' : 'bg-beige'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

            {/* Step Content */}
            <div className="mb-8">
              {currentStep === 1 && (
                <div className="bg-cream p-8 rounded-xl shadow-lg text-center">
                  <Globe className="w-16 h-16 text-gold mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-charcoal mb-4 font-serif">
                    Choose Your Language
                  </h2>
                  <p className="text-lg text-brown mb-8">
                    Select your preferred language for voice interactions and AI assistance.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {[
                      { code: 'en', name: 'English', flag: '🇺🇸' },
                      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
                      { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
                      { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
                      { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
                      { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
                      { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
                      { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          // Store language selection
                          localStorage.setItem('craftstory_selected_language', lang.code);
                          setCurrentStep(2);
                        }}
                        className="p-4 rounded-xl border-2 border-beige bg-cream hover:border-gold hover:shadow-md transition-all duration-300 text-center group hover:scale-105"
                      >
                        <div className="text-3xl mb-2">{lang.flag}</div>
                        <div className="font-semibold text-charcoal text-sm">{lang.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-charcoal mb-2 font-serif">
                      Tell Us About Your Craft
                    </h3>
                    <p className="text-brown">
                      Our AI assistant will ask you questions about your craft and experience
                    </p>
                  </div>
                  
                  <VoiceOnboard
                    onComplete={(profile) => {
                      localStorage.setItem('craftstory_artisan_profile', JSON.stringify(profile));
                      setCurrentStep(3);
                    }}
                    userId={user?.uid || 'demo-user'}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <ProductVoiceOnboard
                  onComplete={(productInfo) => {
                    localStorage.setItem('craftstory_product_info', JSON.stringify(productInfo));
                    setCurrentStep(4);
                  }}
                  onSkip={() => setCurrentStep(4)}
                />
              )}

          {currentStep === 4 && (
            <UploadCamera
              onFileSelect={handleFileSelect}
              maxFiles={5}
            />
          )}

          {currentStep === 5 && (
            <div className="bg-cream rounded-2xl p-8 shadow-sm">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-charcoal mb-2 font-serif">
                  Review Your Profile
                </h3>
                <p className="text-brown">
                  Let's review what we've learned about you and your craft
                </p>
              </div>

              <div className="space-y-6">
              {/* Voice Transcript - This will be handled by VoiceOnboard component */}
              <div className="bg-beige rounded-lg p-4">
                <h4 className="font-semibold text-charcoal mb-2">Voice Introduction:</h4>
                <p className="text-brown italic">Completed via voice interaction</p>
              </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="bg-beige rounded-lg p-4">
                    <h4 className="font-semibold text-charcoal mb-2">Uploaded Images:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="text-center">
                          <div className="w-16 h-16 bg-gold/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Camera className="w-8 h-8 text-gold" />
                          </div>
                          <p className="text-xs text-brown truncate">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Language */}
                <div className="bg-beige rounded-lg p-4">
                  <h4 className="font-semibold text-charcoal mb-2">Preferred Language:</h4>
                  <p className="text-brown">Selected during voice interaction</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="border-brown text-brown hover:bg-brown hover:text-cream"
          >
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isProcessing}
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            {isProcessing ? (
              'Processing...'
            ) : currentStep === 3 ? (
              'Complete Setup'
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Tutorial Overlay */}
        <div className="mt-8 bg-gold/10 border border-gold/20 rounded-lg p-4 text-center">
          <p className="text-sm text-brown">
            💡 <strong>Tip:</strong> Take your time with each step. The more detailed your information, 
            the better our AI can help you create compelling stories about your crafts.
          </p>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
