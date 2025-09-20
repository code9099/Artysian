'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Globe, Menu, X, User, LogOut, Settings, Heart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isGuest, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-cream/95 backdrop-blur-sm border-b border-beige sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center">
              <span className="text-charcoal font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-charcoal font-serif">CraftStory</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/explore" className="text-charcoal hover:text-gold transition-colors">
              Explore Crafts
            </Link>
            <Link href="/voice-demo" className="text-charcoal hover:text-gold transition-colors flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>Voice Demo</span>
            </Link>
            <Link href="/about" className="text-charcoal hover:text-gold transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-charcoal hover:text-gold transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-brown" />
              <select className="bg-transparent text-brown border-none outline-none text-sm">
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>

            {/* Authentication Section */}
            {loading ? (
              <div className="w-8 h-8 bg-beige rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                {/* User Role Indicator */}
                {user.languageCode && (
                  <span className="text-sm text-brown bg-beige px-2 py-1 rounded-full">
                    {user.languageCode.toUpperCase()}
                  </span>
                )}
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-charcoal" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-cream border-beige" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-charcoal">{user.displayName || 'User'}</p>
                        <p className="text-xs text-brown">{user.email}</p>
                        {user.role && (
                          <p className="text-xs text-gold capitalize">{user.role}</p>
                        )}
                        {isGuest && (
                          <p className="text-xs text-orange-600">Guest Mode</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {user.role === 'artisan' && (
                      <DropdownMenuItem asChild>
                        <Link href="/artisan/dashboard" className="flex items-center">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link href="/explore" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <GoogleSignInButton variant="outline" size="sm" />
                <Button size="sm" className="bg-gold hover:bg-gold-light text-charcoal" asChild>
                  <Link href="/explore">Explore</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-charcoal" />
            ) : (
              <Menu className="w-6 h-6 text-charcoal" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-beige pt-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/explore" 
                className="text-charcoal hover:text-gold transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Explore Crafts
              </Link>
              <Link 
                href="/about" 
                className="text-charcoal hover:text-gold transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-charcoal hover:text-gold transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              {/* Mobile Language Selector */}
              <div className="flex items-center space-x-2 py-2">
                <Globe className="w-4 h-4 text-brown" />
                <select className="bg-transparent text-brown border-none outline-none text-sm">
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="ta">தமிழ்</option>
                  <option value="bn">বাংলা</option>
                </select>
              </div>

              {/* Mobile Authentication */}
              {user ? (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center space-x-2 p-2 bg-beige rounded-lg">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-gold rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-charcoal" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-charcoal">{user.displayName || 'User'}</p>
                      <p className="text-xs text-brown">{user.role || 'Guest'}</p>
                    </div>
                  </div>
                  
                  {user.role === 'artisan' && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/artisan/dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/explore" onClick={() => setIsMenuOpen(false)}>
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <GoogleSignInButton variant="outline" size="sm" className="w-full" />
                  <Button size="sm" className="bg-gold hover:bg-gold-light text-charcoal w-full" asChild>
                    <Link href="/explore" onClick={() => setIsMenuOpen(false)}>
                      Explore Crafts
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}