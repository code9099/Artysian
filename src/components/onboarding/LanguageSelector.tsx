'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { INDIAN_LANGUAGES } from '@/lib/languages';
import { Globe, CheckCircle } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageSelect: (languageCode: string) => void;
  onContinue: () => void;
  loading?: boolean;
}

export function LanguageSelector({ 
  selectedLanguage, 
  onLanguageSelect, 
  onContinue, 
  loading = false 
}: LanguageSelectorProps) {
  const [hoveredLanguage, setHoveredLanguage] = useState<string | null>(null);

  const popularLanguages = INDIAN_LANGUAGES.slice(0, 8);
  const otherLanguages = INDIAN_LANGUAGES.slice(8);

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-elevated p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <Globe className="w-16 h-16 text-gold mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-charcoal mb-2 font-serif">Choose Your Language</h2>
          <p className="text-brown">Select your preferred language for the best experience</p>
        </div>

        {/* Popular Languages */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-charcoal mb-4 text-center">Popular Languages</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularLanguages.map((lang) => (
              <LanguageCard
                key={lang.code}
                language={lang}
                isSelected={selectedLanguage === lang.code}
                isHovered={hoveredLanguage === lang.code}
                onClick={() => onLanguageSelect(lang.code)}
                onHover={() => setHoveredLanguage(lang.code)}
                onLeave={() => setHoveredLanguage(null)}
              />
            ))}
          </div>
        </div>

        {/* All Languages */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-charcoal mb-4 text-center">All Languages</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
            {otherLanguages.map((lang) => (
              <LanguageCard
                key={lang.code}
                language={lang}
                isSelected={selectedLanguage === lang.code}
                isHovered={hoveredLanguage === lang.code}
                onClick={() => onLanguageSelect(lang.code)}
                onHover={() => setHoveredLanguage(lang.code)}
                onLeave={() => setHoveredLanguage(null)}
                compact
              />
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={onContinue}
            disabled={!selectedLanguage || loading}
            className="bg-gold hover:bg-gold-light text-charcoal px-8 py-3 text-lg"
            size="lg"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-charcoal mr-2" />
            ) : null}
            Continue
          </Button>
          
          {selectedLanguage && (
            <p className="text-sm text-brown mt-2">
              Selected: {INDIAN_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface LanguageCardProps {
  language: typeof INDIAN_LANGUAGES[0];
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
  compact?: boolean;
}

function LanguageCard({ 
  language, 
  isSelected, 
  isHovered, 
  onClick, 
  onHover, 
  onLeave, 
  compact = false 
}: LanguageCardProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`p-${compact ? '3' : '4'} rounded-xl border-2 transition-all duration-300 text-center group hover:scale-105 ${
        isSelected
          ? 'border-gold bg-gold/10 shadow-lg'
          : 'border-beige bg-cream hover:border-gold hover:shadow-md'
      }`}
    >
      <div className={`text-${compact ? 'xl' : '2xl'} mb-2`}>{language.flag}</div>
      <div className={`font-semibold text-charcoal text-${compact ? 'xs' : 'sm'}`}>
        {language.name}
      </div>
      <div className={`text-${compact ? '2xs' : 'xs'} text-brown`}>
        {language.nativeName}
      </div>
      {!compact && (
        <div className="text-xs text-gray-500 mt-1">
          {language.region}
        </div>
      )}
      {isSelected && (
        <CheckCircle className={`w-${compact ? '3' : '4'} h-${compact ? '3' : '4'} text-gold mx-auto mt-2`} />
      )}
    </button>
  );
}