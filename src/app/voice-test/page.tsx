'use client';

import { useState } from 'react';
import { VoiceOnboard } from '@/components/VoiceOnboard';
import { ProductVoiceOnboard } from '@/components/ProductVoiceOnboard';
import { RealTimeVoiceAssistant } from '@/components/RealTimeVoiceAssistant';
import { Button } from '@/components/ui/button';
import { ArtisanProfile } from '@/lib/types';

export default function VoiceTestPage() {
  const [currentTest, setCurrentTest] = useState<'none' | 'voice-onboard' | 'product-voice' | 'realtime-voice'>('none');
  const [testResults, setTestResults] = useState<any>(null);

  const handleVoiceOnboardComplete = (profile: ArtisanProfile) => {
    console.log('Voice onboard completed:', profile);
    setTestResults({ type: 'voice-onboard', data: profile });
    setCurrentTest('none');
  };

  const handleProductVoiceComplete = (productInfo: any) => {
    console.log('Product voice completed:', productInfo);
    setTestResults({ type: 'product-voice', data: productInfo });
    setCurrentTest('none');
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-4 font-serif">
            Voice Components Test
          </h1>
          <p className="text-brown">
            Test the voice onboarding and product voice components
          </p>
        </div>

        {currentTest === 'none' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-cream rounded-2xl p-6 text-center">
                <h3 className="text-xl font-semibold text-charcoal mb-4">
                  Voice Onboard Test
                </h3>
                <p className="text-brown mb-6">
                  Test the traditional Q&A voice onboarding flow
                </p>
                <Button
                  onClick={() => setCurrentTest('voice-onboard')}
                  className="bg-gold hover:bg-gold-light text-charcoal"
                >
                  Start Voice Onboard Test
                </Button>
              </div>

              <div className="bg-cream rounded-2xl p-6 text-center">
                <h3 className="text-xl font-semibold text-charcoal mb-4">
                  Real-Time Voice Test
                </h3>
                <p className="text-brown mb-6">
                  Test the real-time voice assistant with continuous microphone
                </p>
                <Button
                  onClick={() => setCurrentTest('realtime-voice')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Start Real-Time Voice Test
                </Button>
              </div>

              <div className="bg-cream rounded-2xl p-6 text-center">
                <h3 className="text-xl font-semibold text-charcoal mb-4">
                  Product Voice Test
                </h3>
                <p className="text-brown mb-6">
                  Test the product information collection via voice
                </p>
                <Button
                  onClick={() => setCurrentTest('product-voice')}
                  className="bg-gold hover:bg-gold-light text-charcoal"
                >
                  Start Product Voice Test
                </Button>
              </div>
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="bg-beige rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-charcoal mb-4">
                  Last Test Results ({testResults.type})
                </h3>
                <pre className="bg-white rounded-lg p-4 text-sm overflow-auto">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              </div>
            )}

            {/* API Status Check */}
            <div className="bg-gold/10 rounded-2xl p-6 border border-gold/20">
              <h3 className="text-lg font-semibold text-charcoal mb-4">
                API Status Check
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/speech/transcribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          audioData: 'data:audio/webm;base64,test',
                          languageCode: 'en-US'
                        })
                      });
                      const data = await response.json();
                      alert(`Speech API: ${response.ok ? 'Working' : 'Error'}\n${JSON.stringify(data, null, 2)}`);
                    } catch (error) {
                      alert(`Speech API Error: ${error}`);
                    }
                  }}
                  className="border-brown text-brown hover:bg-brown hover:text-cream"
                >
                  Test Speech API
                </Button>

                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/speech/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: 'Hello, this is a test',
                          languageCode: 'en-US'
                        })
                      });
                      const data = await response.json();
                      alert(`TTS API: ${response.ok ? 'Working' : 'Error'}\n${JSON.stringify(data, null, 2)}`);
                    } catch (error) {
                      alert(`TTS API Error: ${error}`);
                    }
                  }}
                  className="border-brown text-brown hover:bg-brown hover:text-cream"
                >
                  Test TTS API
                </Button>

                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/gemini/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'test'
                        })
                      });
                      const data = await response.json();
                      alert(`Gemini Wrapper: ${response.ok ? 'Working' : 'Error'}\n${JSON.stringify(data, null, 2)}`);
                    } catch (error) {
                      alert(`Gemini Wrapper Error: ${error}`);
                    }
                  }}
                  className="border-brown text-brown hover:bg-brown hover:text-cream"
                >
                  Test Gemini Wrapper
                </Button>

                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/gemini/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          transcript: 'I am a pottery artisan from Jaipur with 10 years experience',
                          languageCode: 'en',
                          action: 'generateQuestions'
                        })
                      });
                      const data = await response.json();
                      alert(`Gemini Questions: ${response.ok ? 'Working' : 'Error'}\n${JSON.stringify(data, null, 2)}`);
                    } catch (error) {
                      alert(`Gemini Questions Error: ${error}`);
                    }
                  }}
                  className="border-gold text-gold hover:bg-gold hover:text-charcoal"
                >
                  Test Gemini Questions
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentTest === 'voice-onboard' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-charcoal">Voice Onboard Test</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentTest('none')}
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                Back to Tests
              </Button>
            </div>
            <VoiceOnboard
              onComplete={handleVoiceOnboardComplete}
              userId="test-user-123"
            />
          </div>
        )}

        {currentTest === 'realtime-voice' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-charcoal">Real-Time Voice Test</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentTest('none')}
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                Back to Tests
              </Button>
            </div>
            <RealTimeVoiceAssistant
              onComplete={handleVoiceOnboardComplete}
              userId="test-user-realtime"
              context="artisan_onboarding"
            />
          </div>
        )}

        {currentTest === 'product-voice' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-charcoal">Product Voice Test</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentTest('none')}
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                Back to Tests
              </Button>
            </div>
            <ProductVoiceOnboard
              onComplete={handleProductVoiceComplete}
              onSkip={() => setCurrentTest('none')}
            />
          </div>
        )}
      </div>
    </div>
  );
}