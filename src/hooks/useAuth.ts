/**
 * Enhanced authentication hook with additional utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/authService';
import { toast } from 'sonner';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  canUploadCrafts: boolean;
  canSaveFavorites: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  setUserRole: (role: 'artisan' | 'explorer') => Promise<void>;
  setUserLanguage: (languageCode: string) => Promise<void>;
  addToFavorites: (craftId: string) => Promise<void>;
  removeFromFavorites: (craftId: string) => Promise<void>;
  requireAuth: (message?: string) => boolean;
  requireRole: (roles: ('artisan' | 'explorer')[], message?: string) => boolean;
  setGuestMode: (isGuest: boolean) => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.initializeAuth();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
        toast.error('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      authService.cleanup();
    };
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authService.signInWithGoogle();
      setUser(user);
      toast.success('Successfully signed in!');
      
      // Redirect based on user state
      if (!user.role) {
        router.push('/role-select');
      } else if (!user.languageCode) {
        router.push('/language-select');
      } else if (user.role === 'artisan') {
        router.push('/artisan/dashboard');
      } else {
        router.push('/explore');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Sign in as guest
  const signInAsGuest = useCallback(async () => {
    try {
      setLoading(true);
      const guestUser = await authService.signInAsGuest();
      setUser(guestUser);
      toast.success('Signed in as guest');
      router.push('/explore');
    } catch (error) {
      console.error('Guest sign in error:', error);
      toast.error('Failed to sign in as guest');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      toast.success('Successfully signed out');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Set user role
  const setUserRole = useCallback(async (role: 'artisan' | 'explorer') => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      await authService.setUserRole(user.uid, role);
      setUser(prev => prev ? { ...prev, role } : null);
      toast.success(`Role set to ${role}`);
      
      // Redirect to appropriate page
      if (!user.languageCode) {
        router.push('/language-select');
      } else if (role === 'artisan') {
        router.push('/artisan/voice-onboard');
      } else {
        router.push('/explore');
      }
    } catch (error) {
      console.error('Set role error:', error);
      toast.error('Failed to set role');
    }
  }, [user, router]);

  // Set user language
  const setUserLanguage = useCallback(async (languageCode: string) => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      await authService.setUserLanguage(user.uid, languageCode);
      setUser(prev => prev ? { ...prev, languageCode } : null);
      toast.success('Language updated');
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        // Redirect based on role
        if (user.role === 'artisan') {
          router.push('/artisan/voice-onboard');
        } else if (user.role === 'explorer') {
          router.push('/explore');
        } else {
          router.push('/role-select');
        }
      }, 500);
    } catch (error) {
      console.error('Set language error:', error);
      toast.error('Failed to set language');
    }
  }, [user, router]);

  // Add to favorites
  const addToFavorites = useCallback(async (craftId: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    if (user.isGuest) {
      toast.error('Please create an account to save favorites');
      router.push('/');
      return;
    }

    try {
      await authService.addToFavorites(user.uid, craftId);
      setUser(prev => prev ? {
        ...prev,
        favorites: [...prev.favorites, craftId]
      } : null);
      toast.success('Added to favorites');
    } catch (error) {
      console.error('Add to favorites error:', error);
      toast.error('Failed to add to favorites');
    }
  }, [user, router]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (craftId: string) => {
    if (!user) return;

    try {
      await authService.removeFromFavorites(user.uid, craftId);
      setUser(prev => prev ? {
        ...prev,
        favorites: prev.favorites.filter(id => id !== craftId)
      } : null);
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Remove from favorites error:', error);
      toast.error('Failed to remove from favorites');
    }
  }, [user]);

  // Require authentication
  const requireAuth = useCallback((message = 'Please sign in to continue') => {
    if (!user || user.isGuest) {
      toast.error(message);
      router.push('/');
      return false;
    }
    return true;
  }, [user, router]);

  // Require specific role
  const requireRole = useCallback((
    roles: ('artisan' | 'explorer')[], 
    message = 'You do not have permission to access this feature'
  ) => {
    if (!user || user.isGuest || !user.role || !roles.includes(user.role)) {
      toast.error(message);
      router.push('/');
      return false;
    }
    return true;
  }, [user, router]);

  // Set guest mode (for UI state)
  const setGuestMode = useCallback((isGuest: boolean) => {
    if (isGuest) {
      signInAsGuest();
    }
  }, [signInAsGuest]);

  // Computed properties
  const isGuest = user?.isGuest || false;
  const isAuthenticated = user !== null && !isGuest;
  const canUploadCrafts = authService.canUploadCrafts(user);
  const canSaveFavorites = authService.canSaveFavorites(user);

  return {
    user,
    loading,
    isGuest,
    isAuthenticated,
    canUploadCrafts,
    canSaveFavorites,
    signInWithGoogle,
    signInAsGuest,
    signOut,
    setUserRole,
    setUserLanguage,
    addToFavorites,
    removeFromFavorites,
    requireAuth,
    requireRole,
    setGuestMode,
  };
}