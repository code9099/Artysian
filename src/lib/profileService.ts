/**
 * Profile service for managing artisan profiles and user initialization
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseClient';
import { User } from './authService';

export interface ArtisanProfile {
  uid: string;
  name: string;
  craftType: string;
  experience: string;
  culturalBackground: string;
  location: {
    latitude?: number;
    longitude?: number;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  completedTutorial: boolean;
  profileImage?: string;
  bio?: string;
  languages: string[];
  specialties: string[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  onboardingProgress: {
    voiceIntroduction: boolean;
    productDetails: boolean;
    imageUpload: boolean;
    profileReview: boolean;
    completed: boolean;
  };
  stats: {
    totalCrafts: number;
    totalViews: number;
    totalLikes: number;
    joinDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ExplorerProfile {
  uid: string;
  preferences: {
    favoriteCategories: string[];
    preferredLanguages: string[];
    interests: string[];
  };
  stats: {
    totalFavorites: number;
    totalViews: number;
    joinDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

class ProfileService {
  /**
   * Initialize artisan profile
   */
  async initializeArtisanProfile(
    user: User,
    initialData?: Partial<ArtisanProfile>
  ): Promise<ArtisanProfile> {
    try {
      const profileData: ArtisanProfile = {
        uid: user.uid,
        name: initialData?.name || user.displayName || '',
        craftType: initialData?.craftType || '',
        experience: initialData?.experience || '',
        culturalBackground: initialData?.culturalBackground || '',
        location: initialData?.location || {
          address: '',
          city: '',
          state: '',
          country: 'India',
        },
        completedTutorial: false,
        bio: initialData?.bio || '',
        languages: initialData?.languages || [user.languageCode || 'en'],
        specialties: initialData?.specialties || [],
        onboardingProgress: {
          voiceIntroduction: false,
          productDetails: false,
          imageUpload: false,
          profileReview: false,
          completed: false,
        },
        stats: {
          totalCrafts: 0,
          totalViews: 0,
          totalLikes: 0,
          joinDate: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'artisans', user.uid), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        'stats.joinDate': serverTimestamp(),
      });

      return profileData;
    } catch (error) {
      console.error('Error initializing artisan profile:', error);
      throw new Error('Failed to initialize artisan profile');
    }
  }

  /**
   * Initialize explorer profile
   */
  async initializeExplorerProfile(user: User): Promise<ExplorerProfile> {
    try {
      const profileData: ExplorerProfile = {
        uid: user.uid,
        preferences: {
          favoriteCategories: [],
          preferredLanguages: [user.languageCode || 'en'],
          interests: [],
        },
        stats: {
          totalFavorites: 0,
          totalViews: 0,
          joinDate: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'explorers', user.uid), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        'stats.joinDate': serverTimestamp(),
      });

      return profileData;
    } catch (error) {
      console.error('Error initializing explorer profile:', error);
      throw new Error('Failed to initialize explorer profile');
    }
  }

  /**
   * Get artisan profile
   */
  async getArtisanProfile(uid: string): Promise<ArtisanProfile | null> {
    try {
      const profileDoc = await getDoc(doc(db, 'artisans', uid));
      
      if (!profileDoc.exists()) {
        return null;
      }

      const data = profileDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        stats: {
          ...data.stats,
          joinDate: data.stats?.joinDate?.toDate() || new Date(),
        },
      } as ArtisanProfile;
    } catch (error) {
      console.error('Error getting artisan profile:', error);
      return null;
    }
  }

  /**
   * Get explorer profile
   */
  async getExplorerProfile(uid: string): Promise<ExplorerProfile | null> {
    try {
      const profileDoc = await getDoc(doc(db, 'explorers', uid));
      
      if (!profileDoc.exists()) {
        return null;
      }

      const data = profileDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        stats: {
          ...data.stats,
          joinDate: data.stats?.joinDate?.toDate() || new Date(),
        },
      } as ExplorerProfile;
    } catch (error) {
      console.error('Error getting explorer profile:', error);
      return null;
    }
  }

  /**
   * Update artisan profile
   */
  async updateArtisanProfile(
    uid: string, 
    updates: Partial<ArtisanProfile>
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(doc(db, 'artisans', uid), updateData);
    } catch (error) {
      console.error('Error updating artisan profile:', error);
      throw new Error('Failed to update artisan profile');
    }
  }

  /**
   * Update explorer profile
   */
  async updateExplorerProfile(
    uid: string, 
    updates: Partial<ExplorerProfile>
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(doc(db, 'explorers', uid), updateData);
    } catch (error) {
      console.error('Error updating explorer profile:', error);
      throw new Error('Failed to update explorer profile');
    }
  }

  /**
   * Update onboarding progress for artisan
   */
  async updateOnboardingProgress(
    uid: string,
    step: keyof ArtisanProfile['onboardingProgress'],
    completed: boolean = true
  ): Promise<void> {
    try {
      const updateData = {
        [`onboardingProgress.${step}`]: completed,
        updatedAt: serverTimestamp(),
      };

      // If all steps are completed, mark onboarding as complete
      if (step === 'profileReview' && completed) {
        updateData['onboardingProgress.completed'] = true;
      }

      await updateDoc(doc(db, 'artisans', uid), updateData);
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      throw new Error('Failed to update onboarding progress');
    }
  }

  /**
   * Check if artisan onboarding is complete
   */
  async isOnboardingComplete(uid: string): Promise<boolean> {
    try {
      const profile = await this.getArtisanProfile(uid);
      return profile?.onboardingProgress.completed || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Get artisan statistics
   */
  async getArtisanStats(uid: string): Promise<ArtisanProfile['stats'] | null> {
    try {
      const profile = await this.getArtisanProfile(uid);
      if (!profile) return null;

      // Get real-time craft count
      const craftsQuery = query(
        collection(db, 'crafts'),
        where('artisanId', '==', uid)
      );
      const craftsSnapshot = await getDocs(craftsQuery);
      
      // Update stats if needed
      if (craftsSnapshot.size !== profile.stats.totalCrafts) {
        await this.updateArtisanProfile(uid, {
          stats: {
            ...profile.stats,
            totalCrafts: craftsSnapshot.size,
          },
        });
      }

      return {
        ...profile.stats,
        totalCrafts: craftsSnapshot.size,
      };
    } catch (error) {
      console.error('Error getting artisan stats:', error);
      return null;
    }
  }

  /**
   * Delete artisan profile
   */
  async deleteArtisanProfile(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'artisans', uid));
    } catch (error) {
      console.error('Error deleting artisan profile:', error);
      throw new Error('Failed to delete artisan profile');
    }
  }

  /**
   * Delete explorer profile
   */
  async deleteExplorerProfile(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'explorers', uid));
    } catch (error) {
      console.error('Error deleting explorer profile:', error);
      throw new Error('Failed to delete explorer profile');
    }
  }

  /**
   * Search artisans by criteria
   */
  async searchArtisans(criteria: {
    craftType?: string;
    location?: string;
    experience?: string;
    limit?: number;
  }): Promise<ArtisanProfile[]> {
    try {
      let artisansQuery: any = collection(db, 'artisans');
      
      // Apply filters
      if (criteria.craftType) {
        artisansQuery = query(artisansQuery, where('craftType', '==', criteria.craftType));
      }

      const snapshot = await getDocs(artisansQuery);
      const artisans: ArtisanProfile[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as any;
        artisans.push({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          stats: {
            ...data.stats,
            joinDate: data.stats?.joinDate?.toDate() || new Date(),
          },
        } as ArtisanProfile);
      });

      // Apply additional filters and limit
      let filteredArtisans = artisans;

      if (criteria.location) {
        filteredArtisans = artisans.filter(artisan => 
          artisan.location.city.toLowerCase().includes(criteria.location!.toLowerCase()) ||
          artisan.location.state.toLowerCase().includes(criteria.location!.toLowerCase())
        );
      }

      if (criteria.experience) {
        filteredArtisans = filteredArtisans.filter(artisan => 
          artisan.experience.toLowerCase().includes(criteria.experience!.toLowerCase())
        );
      }

      if (criteria.limit) {
        filteredArtisans = filteredArtisans.slice(0, criteria.limit);
      }

      return filteredArtisans;
    } catch (error) {
      console.error('Error searching artisans:', error);
      return [];
    }
  }

  /**
   * Get featured artisans
   */
  async getFeaturedArtisans(limit: number = 10): Promise<ArtisanProfile[]> {
    try {
      const snapshot = await getDocs(collection(db, 'artisans'));
      const artisans: ArtisanProfile[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as any;
        artisans.push({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          stats: {
            ...data.stats,
            joinDate: data.stats?.joinDate?.toDate() || new Date(),
          },
        } as ArtisanProfile);
      });

      // Sort by total views and likes, then limit
      return artisans
        .sort((a, b) => (b.stats.totalViews + b.stats.totalLikes) - (a.stats.totalViews + a.stats.totalLikes))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting featured artisans:', error);
      return [];
    }
  }
}

export const profileService = new ProfileService();