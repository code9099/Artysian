import { db } from './firebaseClient';
import { collection, doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, limit, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { ArtisanProfile } from './types';

class FirestoreService {
  /**
   * Create or update artisan profile
   */
  async saveArtisanProfile(uid: string, profileData: Partial<ArtisanProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'artisans', uid);
      
      const profile: Partial<ArtisanProfile> = {
        ...profileData,
        id: uid,
        userId: uid,
        updatedAt: new Date(),
        createdAt: profileData.createdAt || new Date(),
      };

      await setDoc(profileRef, profile, { merge: true });
    } catch (error) {
      console.error('Error saving artisan profile:', error);
      throw new Error('Failed to save profile. Please try again.');
    }
  }

  /**
   * Get artisan profile
   */
  async getArtisanProfile(uid: string): Promise<ArtisanProfile | null> {
    try {
      const profileRef = doc(db, 'artisans', uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        return profileSnap.data() as ArtisanProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting artisan profile:', error);
      throw new Error('Failed to load profile. Please try again.');
    }
  }

  /**
   * Update specific fields in artisan profile
   */
  async updateArtisanProfile(uid: string, updates: Partial<ArtisanProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'artisans', uid);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating artisan profile:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  /**
   * Mark artisan as onboarded
   */
  async completeOnboarding(uid: string): Promise<void> {
    try {
      const profileRef = doc(db, 'artisans', uid);
      await updateDoc(profileRef, {
        isOnboarded: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw new Error('Failed to complete onboarding. Please try again.');
    }
  }

  /**
   * Save voice data
   */
  async saveVoiceData(uid: string, voiceData: string): Promise<void> {
    try {
      const profileRef = doc(db, 'artisans', uid);
      await updateDoc(profileRef, {
        voiceData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving voice data:', error);
      throw new Error('Failed to save voice data. Please try again.');
    }
  }

  /**
   * Save craft to Firestore
   */
  async saveCraft(craftData: any): Promise<string> {
    try {
      const craftRef = doc(collection(db, 'crafts'));
      const craft = {
        ...craftData,
        id: craftRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(craftRef, craft);
      return craftRef.id;
    } catch (error) {
      console.error('Error saving craft:', error);
      throw new Error('Failed to save craft. Please try again.');
    }
  }

  /**
   * Get crafts by artisan ID
   */
  async getCraftsByArtisan(artisanId: string): Promise<any[]> {
    try {
      const craftsRef = collection(db, 'crafts');
      const q = query(craftsRef, where('artisanId', '==', artisanId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting crafts:', error);
      throw new Error('Failed to load crafts. Please try again.');
    }
  }

  /**
   * Update craft
   */
  async updateCraft(craftId: string, updates: any): Promise<void> {
    try {
      const craftRef = doc(db, 'crafts', craftId);
      await updateDoc(craftRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating craft:', error);
      throw new Error('Failed to update craft. Please try again.');
    }
  }

  /**
   * Delete craft
   */
  async deleteCraft(craftId: string): Promise<void> {
    try {
      const craftRef = doc(db, 'crafts', craftId);
      await deleteDoc(craftRef);
    } catch (error) {
      console.error('Error deleting craft:', error);
      throw new Error('Failed to delete craft. Please try again.');
    }
  }

  /**
   * Get all crafts for exploration
   */
  async getAllCrafts(limitCount: number = 20): Promise<any[]> {
    try {
      const craftsRef = collection(db, 'crafts');
      const q = query(craftsRef, where('isPublished', '==', true), orderBy('createdAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all crafts:', error);
      throw new Error('Failed to load crafts. Please try again.');
    }
  }

  /**
   * Add craft to favorites
   */
  async addToFavorites(userId: string, craftId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayUnion(craftId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites. Please try again.');
    }
  }

  /**
   * Remove craft from favorites
   */
  async removeFromFavorites(userId: string, craftId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayRemove(craftId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites. Please try again.');
    }
  }
}

export const firestoreService = new FirestoreService();
