'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { CompactLanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Sparkles, Users, Globe, Camera, Heart, User, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isGuest, setGuestMode } = useAuth();
  const router = useRouter();

  const handleGuestMode = () => {
    setGuestMode(true);
    router.push('/explore');
  };

  const handleSignInSuccess = () => {
    router.push('/role-select');
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal mb-8 font-serif leading-tight">
              Preserve Cultural Heritage
              <span className="block text-gold mt-3">Through AI Storytelling</span>
            </h1>
            <p className="text-lg md:text-xl text-brown mb-12 max-w-4xl mx-auto leading-relaxed">
              Connect artisans with cutting-edge AI technology to preserve, document, and share 
              traditional crafts with the world. Every story matters, every craft has a tale.
            </p>
            
            {/* Authentication Section */}
            {!user && !isGuest ? (
              <div className="mb-20">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 max-w-lg mx-auto border border-white/30 shadow-2xl">
                  <h3 className="text-2xl font-semibold text-charcoal mb-4 font-serif text-center">
                    Get Started
                  </h3>
                  <p className="text-brown mb-8 text-center leading-relaxed">
                    Sign in to access all features or explore as a guest
                  </p>
                  
                  <div className="space-y-5">
                    <GoogleSignInButton
                      variant="glassmorphism"
                      size="lg"
                      className="w-full"
                      onSuccess={handleSignInSuccess}
                    />
                    
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-beige" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-6 bg-white text-brown font-medium">or</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-brown text-brown hover:bg-brown hover:text-cream py-3"
                      onClick={handleGuestMode}
                    >
                      <User className="mr-2 w-5 h-5" />
                      Continue as Guest
                    </Button>
                  </div>
                  
                  <p className="text-xs text-brown/70 mt-6 text-center">
                    Guest mode allows you to explore but limits some features
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 mb-20">
                {/* CTA Buttons for authenticated users */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  {user?.role === 'artisan' ? (
                    <Button size="lg" className="bg-gold hover:bg-gold-light text-charcoal text-lg px-12 py-4 font-semibold shadow-lg" asChild>
                      <Link href="/artisan/dashboard">
                        Go to Dashboard
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                  ) : user?.role === 'explorer' ? (
                    <Button size="lg" className="bg-gold hover:bg-gold-light text-charcoal text-lg px-12 py-4 font-semibold shadow-lg" asChild>
                      <Link href="/explore">
                        Explore Crafts
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" className="bg-gold hover:bg-gold-light text-charcoal text-lg px-12 py-4 font-semibold shadow-lg" asChild>
                        <Link href="/role-select">
                          I&apos;m an Artisan
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline" className="border-brown text-brown hover:bg-brown hover:text-cream text-lg px-12 py-4 font-semibold shadow-lg" asChild>
                        <Link href="/explore">
                          Explore Crafts
                        </Link>
                      </Button>
                    </>
                  )}
                </div>

                {/* Voice Demo Link */}
                <div className="text-center">
                  <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-charcoal text-lg px-10 py-3 shadow-lg" asChild>
                    <Link href="/voice-demo">
                      <MessageCircle className="mr-2 w-5 h-5" />
                      Try Voice Assistant Demo
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center justify-center space-x-3 text-brown">
              <Globe className="w-5 h-5" />
              <CompactLanguageSelector className="bg-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-charcoal mb-6 font-serif">
              How CraftStory Works
            </h2>
            <p className="text-xl text-brown max-w-3xl mx-auto leading-relaxed">
              Our AI-powered platform helps artisans document, share, and monetize their traditional crafts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-8">
                <Camera className="w-10 h-10 text-charcoal" />
              </div>
              <h3 className="text-2xl font-semibold text-charcoal mb-6 font-serif">Voice & Image Capture</h3>
              <p className="text-brown leading-relaxed">
                Record your craft story through voice and upload images. Our AI will transcribe, 
                analyze, and enhance your content automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-10 h-10 text-charcoal" />
              </div>
              <h3 className="text-2xl font-semibold text-charcoal mb-6 font-serif">AI Story Generation</h3>
              <p className="text-brown leading-relaxed">
                Generate compelling descriptions, cultural myths, and personal stories 
                that bring your crafts to life and connect with audiences worldwide.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-8">
                <Users className="w-10 h-10 text-charcoal" />
              </div>
              <h3 className="text-2xl font-semibold text-charcoal mb-6 font-serif">Global Community</h3>
              <p className="text-brown leading-relaxed">
                Connect with craft enthusiasts worldwide, share your techniques, 
                and build a community around traditional artisan skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold text-gold mb-3">500+</div>
              <div className="text-brown text-lg">Artisans Connected</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-gold mb-3">2,000+</div>
              <div className="text-brown text-lg">Crafts Documented</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-gold mb-3">50+</div>
              <div className="text-brown text-lg">Countries Represented</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-gold mb-3">10K+</div>
              <div className="text-brown text-lg">Stories Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-earth">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8 font-serif text-cream">
            Ready to Share Your Craft Story?
          </h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto text-cream/90 leading-relaxed">
            Join thousands of artisans preserving cultural heritage through technology. 
            Your story matters, and the world is waiting to hear it.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {!user && !isGuest ? (
              <>
                <GoogleSignInButton
                  variant="glassmorphism"
                  size="lg"
                  onSuccess={handleSignInSuccess}
                />
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-cream text-cream hover:bg-cream hover:text-charcoal text-lg px-10 py-4 font-semibold"
                  onClick={handleGuestMode}
                >
                  <Heart className="mr-2 w-5 h-5" />
                  Discover Crafts
                </Button>
              </>
            ) : (
              <Button size="lg" className="bg-gold hover:bg-gold-light text-charcoal text-lg px-12 py-4 font-semibold shadow-lg" asChild>
                <Link href={user?.role === 'artisan' ? '/artisan/dashboard' : '/explore'}>
                  {user?.role === 'artisan' ? 'Go to Dashboard' : 'Explore Crafts'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}