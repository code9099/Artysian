'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Eye, Sparkles, Camera, Heart, CheckCircle } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: 'artisan' | 'explorer' | null;
  onRoleSelect: (role: 'artisan' | 'explorer') => void;
  loading?: boolean;
  isGuest?: boolean;
}

export function RoleSelector({ 
  selectedRole, 
  onRoleSelect, 
  loading = false, 
  isGuest = false 
}: RoleSelectorProps) {
  const [hoveredRole, setHoveredRole] = useState<'artisan' | 'explorer' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-charcoal mb-4 font-serif">Choose Your Journey</h2>
          <p className="text-xl text-brown max-w-3xl mx-auto">
            Whether you're an artisan looking to share your craft or someone who loves discovering 
            traditional arts, we have the perfect experience for you.
          </p>
          {isGuest && (
            <div className="mt-6 p-4 bg-orange-100 rounded-xl inline-block border border-orange-200">
              <p className="text-sm text-orange-800">
                <span className="font-semibold">Guest Mode:</span> You can explore but some features are limited
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Artisan Card */}
          <RoleCard
            role="artisan"
            title="I'm an Artisan"
            description="Share your traditional crafts, document your techniques, and connect with a global audience through AI-powered storytelling."
            icon={<Sparkles className="w-12 h-12 text-charcoal" />}
            features={[
              { icon: <Camera className="w-5 h-5 text-gold" />, text: "Voice & image capture for your crafts" },
              { icon: <Sparkles className="w-5 h-5 text-gold" />, text: "AI-generated stories and descriptions" },
              { icon: <Users className="w-5 h-5 text-gold" />, text: "Social media content generation" },
              { icon: <Heart className="w-5 h-5 text-gold" />, text: "Connect with craft enthusiasts" },
            ]}
            buttonText="Start My Artisan Journey"
            buttonVariant="primary"
            isSelected={selectedRole === 'artisan'}
            isHovered={hoveredRole === 'artisan'}
            onSelect={() => onRoleSelect('artisan')}
            onHover={() => setHoveredRole('artisan')}
            onLeave={() => setHoveredRole(null)}
            loading={loading && selectedRole === 'artisan'}
            disabled={loading}
          />

          {/* Explorer Card */}
          <RoleCard
            role="explorer"
            title="I'm an Explorer"
            description="Discover amazing traditional crafts from around the world, learn about cultural heritage, and support artisans in their creative journey."
            icon={<Eye className="w-12 h-12 text-cream" />}
            iconBg="bg-gradient-earth"
            features={[
              { icon: <Eye className="w-5 h-5 text-brown" />, text: "Browse curated craft collections" },
              { icon: <Heart className="w-5 h-5 text-brown" />, text: "Save and share your favorites" },
              { icon: <Users className="w-5 h-5 text-brown" />, text: "Connect with artisans globally" },
              { icon: <Sparkles className="w-5 h-5 text-brown" />, text: "Learn about cultural stories" },
            ]}
            buttonText="Start Exploring"
            buttonVariant="outline"
            isSelected={selectedRole === 'explorer'}
            isHovered={hoveredRole === 'explorer'}
            onSelect={() => onRoleSelect('explorer')}
            onHover={() => setHoveredRole('explorer')}
            onLeave={() => setHoveredRole(null)}
            loading={loading && selectedRole === 'explorer'}
            disabled={loading}
          />
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 max-w-2xl mx-auto border border-white/30 shadow-lg">
            <p className="text-brown mb-4 leading-relaxed">
              Not sure which path to choose? You can always switch later!
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-brown">
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                Free to join
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                No commitment
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                Switch anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RoleCardProps {
  role: 'artisan' | 'explorer';
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg?: string;
  features: { icon: React.ReactNode; text: string }[];
  buttonText: string;
  buttonVariant: 'primary' | 'outline';
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
  loading: boolean;
  disabled: boolean;
}

function RoleCard({
  role,
  title,
  description,
  icon,
  iconBg = "bg-gradient-gold",
  features,
  buttonText,
  buttonVariant,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
  loading,
  disabled
}: RoleCardProps) {
  return (
    <div 
      className={`group p-8 rounded-3xl border-2 transition-all duration-500 cursor-pointer transform hover:scale-105 ${
        isSelected 
          ? 'border-gold bg-gradient-to-br from-gold/20 to-gold-light/20 shadow-2xl' 
          : 'border-beige bg-cream hover:border-gold/70 hover:shadow-xl'
      }`}
      onClick={!disabled ? onSelect : undefined}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
          isSelected 
            ? `${iconBg} shadow-lg` 
            : `${iconBg} group-hover:shadow-lg`
        }`}>
          {icon}
        </div>
        
        <h3 className="text-3xl font-bold text-charcoal mb-4 font-serif">
          {title}
        </h3>
        
        <p className="text-brown mb-6 text-lg">
          {description}
        </p>

        <div className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3 text-left">
              {feature.icon}
              <span className="text-brown">{feature.text}</span>
            </div>
          ))}
        </div>

        <Button 
          size="lg" 
          variant={buttonVariant === 'outline' ? 'outline' : 'default'}
          className={`w-full transition-all duration-300 ${
            buttonVariant === 'primary' 
              ? isSelected
                ? 'bg-gold-light text-charcoal shadow-lg'
                : 'bg-gold hover:bg-gold-light text-charcoal'
              : isSelected
                ? 'border-gold bg-gold/20 text-charcoal shadow-lg'
                : 'border-brown text-brown hover:bg-brown hover:text-cream'
          }`}
          onClick={!disabled ? onSelect : undefined}
          disabled={disabled}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
              Setting up...
            </div>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
        
        {isSelected && (
          <div className="mt-4 flex items-center justify-center text-gold">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Selected</span>
          </div>
        )}
      </div>
    </div>
  );
}