export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
  ttsCode: string;
  geminiCode: string;
  region: string;
}

export const INDIAN_LANGUAGES: LanguageConfig[] = [
  // Major Languages
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', speechCode: 'en-US', ttsCode: 'en-US', geminiCode: 'en', region: 'India' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN', ttsCode: 'hi-IN', geminiCode: 'hi', region: 'North India' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', speechCode: 'bn-IN', ttsCode: 'bn-IN', geminiCode: 'bn', region: 'West Bengal' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', speechCode: 'te-IN', ttsCode: 'te-IN', geminiCode: 'te', region: 'Telangana' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', speechCode: 'mr-IN', ttsCode: 'mr-IN', geminiCode: 'mr', region: 'Maharashtra' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechCode: 'ta-IN', ttsCode: 'ta-IN', geminiCode: 'ta', region: 'Tamil Nadu' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳', speechCode: 'ur-IN', ttsCode: 'ur-IN', geminiCode: 'ur', region: 'North India' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', speechCode: 'gu-IN', ttsCode: 'gu-IN', geminiCode: 'gu', region: 'Gujarat' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', speechCode: 'kn-IN', ttsCode: 'kn-IN', geminiCode: 'kn', region: 'Karnataka' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', speechCode: 'or-IN', ttsCode: 'or-IN', geminiCode: 'or', region: 'Odisha' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', speechCode: 'ml-IN', ttsCode: 'ml-IN', geminiCode: 'ml', region: 'Kerala' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', speechCode: 'pa-IN', ttsCode: 'pa-IN', geminiCode: 'pa', region: 'Punjab' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', speechCode: 'as-IN', ttsCode: 'as-IN', geminiCode: 'as', region: 'Assam' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', speechCode: 'ne-IN', ttsCode: 'ne-IN', geminiCode: 'ne', region: 'Sikkim' },
  { code: 'bo', name: 'Bodo', nativeName: 'बड़ो', flag: '🇮🇳', speechCode: 'bo-IN', ttsCode: 'bo-IN', geminiCode: 'bo', region: 'Assam' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', flag: '🇮🇳', speechCode: 'sd-IN', ttsCode: 'sd-IN', geminiCode: 'sd', region: 'Gujarat' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', flag: '🇮🇳', speechCode: 'ks-IN', ttsCode: 'ks-IN', geminiCode: 'ks', region: 'Jammu & Kashmir' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳', speechCode: 'sa-IN', ttsCode: 'sa-IN', geminiCode: 'sa', region: 'India' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', flag: '🇮🇳', speechCode: 'kok-IN', ttsCode: 'kok-IN', geminiCode: 'kok', region: 'Goa' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', flag: '🇮🇳', speechCode: 'mni-IN', ttsCode: 'mni-IN', geminiCode: 'mni', region: 'Manipur' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳', speechCode: 'sat-IN', ttsCode: 'sat-IN', geminiCode: 'sat', region: 'Jharkhand' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', flag: '🇮🇳', speechCode: 'mai-IN', ttsCode: 'mai-IN', geminiCode: 'mai', region: 'Bihar' }
];

export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return INDIAN_LANGUAGES.find(lang => lang.code === code);
}

export function getLanguageByRegion(region: string): LanguageConfig[] {
  return INDIAN_LANGUAGES.filter(lang => lang.region === region);
}

export function getPopularLanguages(): LanguageConfig[] {
  // Return the most commonly spoken languages in India
  return INDIAN_LANGUAGES.slice(0, 8);
}

// Legacy support for existing code
export const SUPPORTED_LANGUAGES = INDIAN_LANGUAGES.slice(0, 3); // Keep first 3 for backward compatibility