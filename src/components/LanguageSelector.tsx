'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { INDIAN_LANGUAGES, LanguageConfig } from '@/lib/languages';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Globe, Languages } from 'lucide-react';
import { toast } from 'sonner';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'grid' | 'modal';
  size?: 'sm' | 'md' | 'lg';
  showPopular?: boolean;
  onLanguageChange?: (languageCode: string) => void;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  size = 'md',
  showPopular = true,
  onLanguageChange,
  className = '',
}: LanguageSelectorProps) {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setIsLoading(true);
      await setLanguage(languageCode);
      onLanguageChange?.(languageCode);
      toast.success(`Language changed to ${INDIAN_LANGUAGES.find(l => l.code === languageCode)?.name}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Failed to change language');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'dropdown') {
    return (
      <Select
        value={currentLanguage.code}
        onValueChange={handleLanguageChange}
        disabled={isLoading}
      >
        <SelectTrigger className={`w-auto min-w-[120px] ${className}`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {(showPopular ? INDIAN_LANGUAGES.slice(0, 8) : INDIAN_LANGUAGES).map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                <span className="text-sm text-muted-foreground">({language.nativeName})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <Globe className="w-4 h-4 mr-2" />
            {currentLanguage.name}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Languages className="w-5 h-5 mr-2" />
              Select Language
            </DialogTitle>
          </DialogHeader>
          <LanguageGrid
            currentLanguage={currentLanguage.code}
            onLanguageSelect={handleLanguageChange}
            isLoading={isLoading}
            showPopular={showPopular}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Grid variant
  return (
    <div className={className}>
      <LanguageGrid
        currentLanguage={currentLanguage.code}
        onLanguageSelect={handleLanguageChange}
        isLoading={isLoading}
        showPopular={showPopular}
      />
    </div>
  );
}

interface LanguageGridProps {
  currentLanguage: string;
  onLanguageSelect: (languageCode: string) => void;
  isLoading: boolean;
  showPopular: boolean;
}

function LanguageGrid({ currentLanguage, onLanguageSelect, isLoading, showPopular }: LanguageGridProps) {
  const popularLanguages = INDIAN_LANGUAGES.slice(0, 8);
  const otherLanguages = INDIAN_LANGUAGES.slice(8);

  return (
    <div className="space-y-8">
      {showPopular && (
        <div>
          <h3 className="text-lg font-semibold text-charcoal mb-4">Popular Languages</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularLanguages.map((language) => (
              <LanguageCard
                key={language.code}
                language={language}
                isSelected={currentLanguage === language.code}
                onClick={() => onLanguageSelect(language.code)}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-4">All Languages</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(showPopular ? otherLanguages : INDIAN_LANGUAGES).map((language) => (
            <LanguageCard
              key={language.code}
              language={language}
              isSelected={currentLanguage === language.code}
              onClick={() => onLanguageSelect(language.code)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface LanguageCardProps {
  language: LanguageConfig;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function LanguageCard({ language, isSelected, onClick, disabled }: LanguageCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-lg border-2 transition-all duration-300 text-center group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
        isSelected
          ? 'border-gold bg-gold-light shadow-lg'
          : 'border-beige bg-cream hover:border-gold hover:shadow-md'
      }`}
    >
      <div className="text-2xl mb-1">{language.flag}</div>
      <div className="font-semibold text-charcoal text-sm mb-1">
        {language.name}
      </div>
      <div className="text-xs text-brown">
        {language.nativeName}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {language.region}
      </div>
      {isSelected && (
        <CheckCircle className="w-4 h-4 text-gold mx-auto mt-2" />
      )}
    </button>
  );
}

// Compact language selector for headers/navigation
export function CompactLanguageSelector({ className = '' }: { className?: string }) {
  const { currentLanguage } = useLanguage();

  return (
    <LanguageSelector
      variant="dropdown"
      size="sm"
      showPopular={true}
      className={`${className}`}
    />
  );
}

// Language selector with flag only
export function FlagLanguageSelector({ className = '' }: { className?: string }) {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={`p-2 ${className}`}>
          <span className="text-xl">{currentLanguage.flag}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Language</DialogTitle>
        </DialogHeader>
        <LanguageSelector
          variant="grid"
          showPopular={true}
          onLanguageChange={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}