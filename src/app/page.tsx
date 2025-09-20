'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Globe, User, Users } from 'lucide-react';
import { authService } from '@/lib/authService';
import { INDIAN_LANGUAGES } from '@/lib/languages';
import { toast } from 'sonner';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [step, setStep] = useState<'auth' | 'language' | 'role'>('auth');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated and has completed setup
    const checkUserStatus = async () => {
      try {
        const currentUser = await authService.initializeAuth();
        if (currentUser) {
          setUser(currentUser);
          
          // Check if user has already selected role
          const hasRole = localStorage.getItem('craftstory_user_role');
          const hasLanguage = localStorage.getItem('craftstory_user_language');
          
          if (hasRole && hasLanguage) {
            // User has completed setup, redirect to appropriate page
            if (hasRole === 'artisan') {
              router.push('/artisan');
            } else {
              router.push('/explore');
            }
            return;
          }
          
          // User is authenticated but needs to complete setup
          if (!hasLanguage) {
            setStep('language');
          } else {
            setStep('role');
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      setUser(user);
      setStep('language');
      toast.success('Welcome to CraftStory!');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await authService.signInAsGuest();
      setUser(user);
      setStep('language');
      toast.success('Welcome to CraftStory!');
    } catch (error) {
      console.error('Guest sign in error:', error);
      toast.error('Failed to continue as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = async () => {
    try {
      if (user) {
        await authService.setUserLanguage(user.uid, selectedLanguage);
      }
      localStorage.setItem('craftstory_user_language', selectedLanguage);
      setStep('role');
      toast.success(`Language set to ${INDIAN_LANGUAGES.find(l => l.code === selectedLanguage)?.name}`);
    } catch (error) {
      console.error('Language selection error:', error);
      toast.error('Failed to set language. Please try again.');
    }
  };

  const handleRoleSelect = async (role: 'artisan' | 'explorer') => {
    try {
      if (user) {
        await authService.setUserRole(user.uid, role);
      }
      localStorage.setItem('craftstory_user_role', role);
      
      // Redirect based on role
      if (role === 'artisan') {
        router.push('/artisan');
      } else {
        router.push('/explore');
      }
      
      toast.success(`Welcome ${role}!`);
    } catch (error) {
      console.error('Role selection error:', error);
      toast.error('Failed to set role. Please try again.');
    }
  };

  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-beige to-gold/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-charcoal">CS</span>
            </div>
            <h1 className="text-3xl font-bold text-charcoal mb-2 font-serif">CraftStory</h1>
            <p className="text-brown">AI-Powered Marketplace for Local Artisans</p>
          </div>

          {/* Mission Statement */}
          <div className="mb-8 p-4 bg-gold/10 rounded-2xl border border-gold/20">
            <p className="text-sm text-charcoal">
              Empowering local artisans to market their craft, tell their stories, 
              and expand their reach to new digital audiences through AI.
            </p>
          </div>

          {/* Authentication Options */}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              size="lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <Button
              onClick={handleGuestSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full border-brown text-brown hover:bg-brown hover:text-cream py-3 text-lg"
              size="lg"
            >
              <User className="w-5 h-5 mr-2" />
              Continue as Guest
            </Button>
          </div>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-brown">
            <div className="text-center">
              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-gold">🎤</span>
              </div>
              <p>Voice Assistant</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-gold">🌍</span>
              </div>
              <p>22 Languages</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'language') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-beige to-gold/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <Globe className="w-16 h-16 text-gold mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-charcoal mb-2 font-serif">Choose Your Language</h2>
            <p className="text-brown">Select your preferred language for the best experience</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {INDIAN_LANGUAGES.slice(0, 16).map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-center group hover:scale-105 ${
                  selectedLanguage === lang.code
                    ? 'border-gold bg-gold/10 shadow-lg'
                    : 'border-beige bg-cream hover:border-gold hover:shadow-md'
                }`}
              >
                <div className="text-2xl mb-2">{lang.flag}</div>
                <div className="font-semibold text-charcoal text-sm">{lang.name}</div>
                <div className="text-xs text-brown">{lang.nativeName}</div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={handleLanguageSelect}
              className="bg-gold hover:bg-gold-light text-charcoal px-8 py-3 text-lg"
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-beige to-gold/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-charcoal mb-2 font-serif">Welcome to CraftStory</h2>
            <p className="text-brown">How would you like to use our platform?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Artisan Option */}
            <button
              onClick={() => handleRoleSelect('artisan')}
              className="group p-8 rounded-2xl border-2 border-beige bg-cream hover:border-gold hover:shadow-xl transition-all duration-300 text-center hover:scale-105"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <User className="w-10 h-10 text-charcoal" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2">I am an Artisan</h3>
              <p className="text-brown text-sm mb-4">
                Showcase your crafts, tell your story, and reach new customers with AI assistance
              </p>
              <div className="flex justify-center space-x-2 text-xs text-brown">
                <span className="bg-gold/20 px-2 py-1 rounded">🎤 Voice Assistant</span>
                <span className="bg-gold/20 px-2 py-1 rounded">📸 Photo Upload</span>
              </div>
            </button>

            {/* Explorer Option */}
            <button
              onClick={() => handleRoleSelect('explorer')}
              className="group p-8 rounded-2xl border-2 border-beige bg-cream hover:border-gold hover:shadow-xl transition-all duration-300 text-center hover:scale-105"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-charcoal" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2">Explore Art</h3>
              <p className="text-brown text-sm mb-4">
                Discover unique crafts, learn their stories, and connect with talented artisans
              </p>
              <div className="flex justify-center space-x-2 text-xs text-brown">
                <span className="bg-gold/20 px-2 py-1 rounded">🔍 Discover</span>
                <span className="bg-gold/20 px-2 py-1 rounded">❤️ Favorites</span>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-brown">
              This selection is permanent and helps us customize your experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}