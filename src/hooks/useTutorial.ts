/**
 * Custom hook for managing tutorial state and completion
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/authService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { toast } from 'sonner';

export interface TutorialState {
  isVisible: boolean;
  isCompleted: boolean;
  currentStep: number;
  canSkip: boolean;
}

export interface TutorialOptions {
  autoShow?: boolean;
  persistState?: boolean;
  showOnFirstVisit?: boolean;
}

export function useTutorial(options: TutorialOptions = {}) {
  const {
    autoShow = true,
    persistState = true,
    showOnFirstVisit = true,
  } = options;

  const { user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<TutorialState>({
    isVisible: false,
    isCompleted: false,
    currentStep: 0,
    canSkip: true,
  });

  // Check tutorial completion status on mount
  useEffect(() => {
    const checkTutorialStatus = () => {
      const isCompleted = authService.hasCompletedTutorial(user);
      
      setState(prev => ({
        ...prev,
        isCompleted,
        isVisible: autoShow && showOnFirstVisit && !isCompleted && isAuthenticated,
      }));
    };

    if (user !== null) { // Wait for auth to be determined
      checkTutorialStatus();
    }
  }, [user, isAuthenticated, autoShow, showOnFirstVisit]);

  const showTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: true,
      currentStep: 0,
    }));
  }, []);

  const hideTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const completeTutorial = useCallback(async () => {
    try {
      if (user && !user.isGuest) {
        await authService.markTutorialCompleted(user.uid);
      } else {
        // For guest users, store in localStorage
        localStorage.setItem('craftstory_guest_tutorial_completed', 'true');
      }

      setState(prev => ({
        ...prev,
        isVisible: false,
        isCompleted: true,
      }));

      toast.success('Tutorial completed! You\'re ready to start creating.');
    } catch (error) {
      console.error('Error completing tutorial:', error);
      toast.error('Failed to save tutorial progress');
    }
  }, [user]);

  const skipTutorial = useCallback(async () => {
    try {
      if (user && !user.isGuest) {
        await authService.markTutorialCompleted(user.uid);
      } else {
        localStorage.setItem('craftstory_guest_tutorial_completed', 'true');
      }

      setState(prev => ({
        ...prev,
        isVisible: false,
        isCompleted: true,
      }));

      toast.info('Tutorial skipped. You can access help anytime from settings.');
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      // Still hide the tutorial even if saving fails
      setState(prev => ({
        ...prev,
        isVisible: false,
        isCompleted: true,
      }));
    }
  }, [user]);

  const resetTutorial = useCallback(async () => {
    try {
      if (user && !user.isGuest) {
        // Reset in Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          completedTutorial: false,
          updatedAt: serverTimestamp(),
        });
      } else {
        localStorage.removeItem('craftstory_guest_tutorial_completed');
      }

      setState(prev => ({
        ...prev,
        isVisible: false,
        isCompleted: false,
        currentStep: 0,
      }));

      toast.success('Tutorial reset. You can start it again anytime.');
    } catch (error) {
      console.error('Error resetting tutorial:', error);
      toast.error('Failed to reset tutorial');
    }
  }, [user]);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, step),
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  // Check if tutorial should be shown for first-time artisans
  const shouldShowForArtisan = useCallback(() => {
    return (
      user?.role === 'artisan' && 
      !state.isCompleted && 
      showOnFirstVisit
    );
  }, [user, state.isCompleted, showOnFirstVisit]);

  // Get tutorial progress percentage
  const getProgress = useCallback((totalSteps: number) => {
    return Math.round((state.currentStep / Math.max(1, totalSteps - 1)) * 100);
  }, [state.currentStep]);

  return {
    ...state,
    showTutorial,
    hideTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    goToStep,
    nextStep,
    previousStep,
    shouldShowForArtisan,
    getProgress,
    
    // Utility methods
    isFirstTime: !state.isCompleted,
    canShowTutorial: isAuthenticated,
  };
}