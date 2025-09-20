'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Users, Eye, Sparkles, Camera, Heart, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleSelectPage() {
  const [selectedRole, setSelectedRole] = useState<'artisan' | 'explorer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUserRole, user, isGuest } = useAuth();
  const router = useRouter();

  const handleRoleSelect = async (role: 'artisan' | 'explorer') => {
    setSelectedRole(role);
    
    try {
      setIsLoading(true);
      
      if (user && !isGuest) {
        // Save role to Firestore - this will handle the redirect
        await setUserRole(role);
      } else {
        // Store in localStorage for guest users
        localStorage.setItem('craftstory_guest_role', role);
        toast.success(`Guest mode: ${role === 'artisan' ? 'Artisan' : 'Explorer'}`);
        
        // Manual redirect for guest users
        if (role === 'artisan') {
          router.push('/artisan/voice-onboard');
        } else {
          router.push('/explore');
        }
      }
    } catch (error) {
      console.error('Error setting role:', error);
      toast.error('Failed to set role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-warm">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-8 font-serif">
            Choose Your Journey
          </h1>
          <p className="text-xl text-brown max-w-3xl mx-auto leading-relaxed">
            Whether you're an artisan looking to share your craft or someone who loves discovering 
            traditional arts, we have the perfect experience for you.
          </p>
          {isGuest && (
            <div className="mt-8 p-4 bg-orange-100 rounded-xl inline-block border border-orange-200">
              <p className="text-sm text-orange-800">
                <span className="font-semibold">Guest Mode:</span> You can explore but some features are limited
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Artisan Card */}
          <div 
            className={`group p-8 rounded-3xl border-2 transition-all duration-500 cursor-pointer transform hover:scale-105 ${
              selectedRole === 'artisan' 
                ? 'border-gold bg-gradient-to-br from-gold/20 to-gold-light/20 shadow-2xl' 
                : 'border-beige bg-cream hover:border-gold/70 hover:shadow-xl'
            }`}
            onClick={() => !isLoading && handleRoleSelect('artisan')}
          >
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                selectedRole === 'artisan' 
                  ? 'bg-gradient-gold shadow-lg' 
                  : 'bg-gradient-gold group-hover:shadow-lg'
              }`}>
                <Sparkles className="w-12 h-12 text-charcoal" />
              </div>
              
              <h2 className="text-3xl font-bold text-charcoal mb-4 font-serif">
                I&apos;m an Artisan
              </h2>
              
              <p className="text-brown mb-6 text-lg">
                Share your traditional crafts, document your techniques, and connect with 
                a global audience through AI-powered storytelling.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-left">
                  <Camera className="w-5 h-5 text-gold" />
                  <span className="text-brown">Voice & image capture for your crafts</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Sparkles className="w-5 h-5 text-gold" />
                  <span className="text-brown">AI-generated stories and descriptions</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Users className="w-5 h-5 text-gold" />
                  <span className="text-brown">Social media content generation</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Heart className="w-5 h-5 text-gold" />
                  <span className="text-brown">Connect with craft enthusiasts</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className={`w-full transition-all duration-300 ${
                  selectedRole === 'artisan'
                    ? 'bg-gold-light text-charcoal shadow-lg'
                    : 'bg-gold hover:bg-gold-light text-charcoal'
                }`}
                onClick={() => !isLoading && handleRoleSelect('artisan')}
                disabled={isLoading}
              >
                {isLoading && selectedRole === 'artisan' ? (
                  'Setting up...'
                ) : (
                  <>
                    Start My Artisan Journey
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              
              {selectedRole === 'artisan' && (
                <div className="mt-4 flex items-center justify-center text-gold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Explorer Card */}
          <div 
            className={`group p-8 rounded-3xl border-2 transition-all duration-500 cursor-pointer transform hover:scale-105 ${
              selectedRole === 'explorer' 
                ? 'border-gold bg-gradient-to-br from-gold/20 to-gold-light/20 shadow-2xl' 
                : 'border-beige bg-cream hover:border-gold/70 hover:shadow-xl'
            }`}
            onClick={() => !isLoading && handleRoleSelect('explorer')}
          >
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                selectedRole === 'explorer' 
                  ? 'bg-gradient-earth shadow-lg' 
                  : 'bg-gradient-earth group-hover:shadow-lg'
              }`}>
                <Eye className="w-12 h-12 text-cream" />
              </div>
              
              <h2 className="text-3xl font-bold text-charcoal mb-4 font-serif">
                I&apos;m an Explorer
              </h2>
              
              <p className="text-brown mb-6 text-lg">
                Discover amazing traditional crafts from around the world, learn about 
                cultural heritage, and support artisans in their creative journey.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-left">
                  <Eye className="w-5 h-5 text-brown" />
                  <span className="text-brown">Browse curated craft collections</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Heart className="w-5 h-5 text-brown" />
                  <span className="text-brown">Save and share your favorites</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Users className="w-5 h-5 text-brown" />
                  <span className="text-brown">Connect with artisans globally</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Sparkles className="w-5 h-5 text-brown" />
                  <span className="text-brown">Learn about cultural stories</span>
                </div>
              </div>

              <Button 
                size="lg" 
                variant="outline"
                className={`w-full transition-all duration-300 ${
                  selectedRole === 'explorer'
                    ? 'border-gold bg-gold/20 text-charcoal shadow-lg'
                    : 'border-brown text-brown hover:bg-brown hover:text-cream'
                }`}
                onClick={() => !isLoading && handleRoleSelect('explorer')}
                disabled={isLoading}
              >
                {isLoading && selectedRole === 'explorer' ? (
                  'Setting up...'
                ) : (
                  <>
                    Start Exploring
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              
              {selectedRole === 'explorer' && (
                <div className="mt-4 flex items-center justify-center text-gold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 max-w-3xl mx-auto border border-white/30 shadow-lg">
            <p className="text-brown mb-6 text-lg leading-relaxed">
              Not sure which path to choose? You can always switch later!
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-brown">
              <span className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-gold" />
                Free to join
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-gold" />
                No commitment
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-gold" />
                Switch anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}