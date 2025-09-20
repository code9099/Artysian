/**
 * Authentication service for CraftStory app
 * Handles user authentication, role management, and session persistence
 */

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './firebaseClient';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: 'artisan' | 'explorer';
  languageCode?: string;
  isGuest: boolean;
  favorites: string[];
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authStateListeners: ((user: User | null) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize authentication state listener
   */
  initializeAuth(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const user = await this.getUserData(firebaseUser);
          this.notifyAuthStateChange(user);
          resolve(user);
        } else {
          this.notifyAuthStateChange(null);
          resolve(null);
        }
      });

      // Store unsubscribe function for cleanup
      (this as any).unsubscribeAuth = unsubscribe;
    });
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Create or update user document
      const userData = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        isGuest: false,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        // New user - set creation timestamp and defaults
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          favorites: [],
          createdAt: serverTimestamp(),
        });
      } else {
        // Existing user - update login timestamp
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return await this.getUserData(firebaseUser);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  }

  /**
   * Sign in as guest
   */
  async signInAsGuest(): Promise<User> {
    try {
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;
      
      // Create guest user document
      const guestData = {
        uid: firebaseUser.uid,
        displayName: 'Guest User',
        email: null,
        photoURL: null,
        isGuest: true,
        favorites: [],
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), guestData);
      
      return {
        uid: firebaseUser.uid,
        displayName: 'Guest User',
        email: null,
        photoURL: null,
        isGuest: true,
        favorites: [],
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    } catch (error) {
      console.error('Error signing in as guest:', error);
      throw new Error('Failed to sign in as guest. Please try again.');
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  /**
   * Set user role
   */
  async setUserRole(uid: string, role: 'artisan' | 'explorer'): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting user role:', error);
      throw new Error('Failed to set user role. Please try again.');
    }
  }

  /**
   * Set user language
   */
  async setUserLanguage(uid: string, languageCode: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        languageCode,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting user language:', error);
      throw new Error('Failed to set user language. Please try again.');
    }
  }

  /**
   * Add craft to user favorites
   */
  async addToFavorites(uid: string, craftId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const favorites = userData.favorites || [];
        
        if (!favorites.includes(craftId)) {
          favorites.push(craftId);
          await updateDoc(userRef, {
            favorites,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites. Please try again.');
    }
  }

  /**
   * Remove craft from user favorites
   */
  async removeFromFavorites(uid: string, craftId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const favorites = userData.favorites || [];
        const updatedFavorites = favorites.filter((id: string) => id !== craftId);
        
        await updateDoc(userRef, {
          favorites: updatedFavorites,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites. Please try again.');
    }
  }

  /**
   * Get user data from Firestore
   */
  private async getUserData(firebaseUser: FirebaseUser): Promise<User> {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();
      
      return {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        role: userData?.role,
        languageCode: userData?.languageCode,
        isGuest: userData?.isGuest || false,
        favorites: userData?.favorites || [],
        createdAt: userData?.createdAt?.toDate() || new Date(),
        lastLoginAt: userData?.lastLoginAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      // Return basic user data if Firestore fails
      return {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        isGuest: false,
        favorites: [],
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    }
  }

  /**
   * Check if user can upload crafts (not guest)
   */
  canUploadCrafts(user: User | null): boolean {
    return user !== null && !user.isGuest;
  }

  /**
   * Check if user can save favorites
   */
  canSaveFavorites(user: User | null): boolean {
    return user !== null && !user.isGuest;
  }

  /**
   * Get user statistics
   */
  async getUserStats(uid: string): Promise<{
    totalCrafts: number;
    totalFavorites: number;
    joinDate: Date;
  }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();
      
      // Count user's crafts
      const craftsQuery = query(
        collection(db, 'crafts'),
        where('artisanId', '==', uid)
      );
      const craftsSnapshot = await getDocs(craftsQuery);
      
      return {
        totalCrafts: craftsSnapshot.size,
        totalFavorites: userData?.favorites?.length || 0,
        joinDate: userData?.createdAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalCrafts: 0,
        totalFavorites: 0,
        joinDate: new Date(),
      };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthStateChange(user: User | null): void {
    this.authStateListeners.forEach(callback => callback(user));
  }

  /**
   * Check if user can upload crafts (not guest)
   */
  canUploadCrafts(user: User | null): boolean {
    return user !== null && !user.isGuest;
  }

  /**
   * Check if user can save favorites (not guest)
   */
  canSaveFavorites(user: User | null): boolean {
    return user !== null && !user.isGuest;
  }

  /**
   * Check if user has completed onboarding
   */
  hasCompletedOnboarding(user: User | null): boolean {
    return user !== null && !!user.role && !!user.languageCode;
  }

  /**
   * Mark tutorial as completed for user
   */
  async markTutorialCompleted(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        completedTutorial: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking tutorial complete:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed tutorial
   */
  hasCompletedTutorial(user: User | null): boolean {
    if (!user || user.isGuest) {
      return localStorage.getItem('craftstory_guest_tutorial_completed') === 'true';
    }
    return (user as any).completedTutorial || false;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(user: User | null) {
    return {
      canUploadCrafts: this.canUploadCrafts(user),
      canSaveFavorites: this.canSaveFavorites(user),
      canAccessArtisanFeatures: user?.role === 'artisan' && !user.isGuest,
      canAccessExplorerFeatures: user?.role === 'explorer' || user?.isGuest,
      hasCompletedOnboarding: this.hasCompletedOnboarding(user),
      hasCompletedTutorial: this.hasCompletedTutorial(user),
    };
  }

  /**
   * Cleanup auth listener
   */
  cleanup(): void {
    if ((this as any).unsubscribeAuth) {
      (this as any).unsubscribeAuth();
    }
    this.authStateListeners = [];
  }
}

export const authService = AuthService.getInstance();