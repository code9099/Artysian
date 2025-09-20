'use client';

import { useState } from 'react';
import { MultilingualVoiceAssistant } from '@/components/MultilingualVoiceAssistant';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, Globe, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

export default function VoiceDemoPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [conversationData, setConversationData] = useState<ConversationMessage[]>([]);
  const [selectedContext, setSelectedContext] = useState('artisan_onboarding');
  const router = useRouter();

  const contexts = [
    { id: 'artisan_onboarding', name: 'Artisan Onboarding', description: 'Help artisans create their profile' },
    { id: 'product_description', name: 'Product Description', description: 'Describe craft products in detail' },
    { id: 'general', name: 'General Chat', description: 'Open conversation about crafts' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' }
  ];

  return (
    <div className="min-h-screen bg-gradient-warm py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-start mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-brown text-brown hover:bg-brown hover:text-cream"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <h1 className="text-4xl font-bold text-charcoal font-serif mb-4">
            Multilingual Voice Assistant Demo
          </h1>
          <p className="text-xl text-brown max-w-3xl mx-auto leading-relaxed">
            Experience real-time voice conversation in multiple Indian languages
          </p>
        </div>

        {/* Context Selector */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-charcoal mb-8 font-serif text-center">
            Choose Conversation Context
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contexts.map((context) => (
              <button
                key={context.id}
                onClick={() => setSelectedContext(context.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  selectedContext === context.id
                    ? 'border-gold bg-gold-light shadow-lg'
                    : 'border-beige bg-cream hover:border-gold hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <MessageCircle className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold text-charcoal">{context.name}</h3>
                </div>
                <p className="text-sm text-brown">{context.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Assistant */}
        <div className="mb-12">
          <MultilingualVoiceAssistant
            initialLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            onConversationUpdate={setConversationData}
            context={selectedContext}
            placeholder="Click the microphone and start speaking in your preferred language..."
          />
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-cream rounded-xl p-6 text-center">
            <Mic className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="font-semibold text-charcoal mb-2">Voice Recognition</h3>
            <p className="text-sm text-brown">
              Advanced speech-to-text in multiple Indian languages
            </p>
          </div>
          
          <div className="bg-cream rounded-xl p-6 text-center">
            <Globe className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="font-semibold text-charcoal mb-2">Multilingual</h3>
            <p className="text-sm text-brown">
              Supports Hindi, Tamil, Bengali, and more languages
            </p>
          </div>
          
          <div className="bg-cream rounded-xl p-6 text-center">
            <MessageCircle className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="font-semibold text-charcoal mb-2">Natural Conversation</h3>
            <p className="text-sm text-brown">
              AI-powered responses that understand context
            </p>
          </div>
          
          <div className="bg-cream rounded-xl p-6 text-center">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-charcoal font-bold text-sm">TTS</span>
            </div>
            <h3 className="font-semibold text-charcoal mb-2">Voice Synthesis</h3>
            <p className="text-sm text-brown">
              Text-to-speech responses in your selected language
            </p>
          </div>
        </div>

        {/* Conversation Summary */}
        {conversationData.length > 0 && (
          <div className="bg-cream rounded-xl p-6">
            <h3 className="text-xl font-semibold text-charcoal mb-4 font-serif">
              Conversation Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brown">Total Messages:</span>
                <span className="text-charcoal font-semibold">{conversationData.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown">User Messages:</span>
                <span className="text-charcoal font-semibold">
                  {conversationData.filter(m => m.type === 'user').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown">Assistant Responses:</span>
                <span className="text-charcoal font-semibold">
                  {conversationData.filter(m => m.type === 'assistant').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown">Current Language:</span>
                <span className="text-charcoal font-semibold">
                  {languages.find(l => l.code === selectedLanguage)?.name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gold/10 rounded-xl p-6 border border-gold/20">
          <h3 className="text-lg font-semibold text-charcoal mb-3">How to Use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-brown">
            <li>Select your preferred language from the dropdown</li>
            <li>Choose a conversation context that fits your needs</li>
            <li>Click the microphone button and start speaking</li>
            <li>Wait for the AI to process and respond</li>
            <li>Continue the conversation naturally</li>
            <li>Switch languages anytime during the conversation</li>
          </ol>
        </div>
      </div>
    </div>
  );
}