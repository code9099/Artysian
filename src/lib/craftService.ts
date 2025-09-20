/**
 * Service for managing craft data in Firestore
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  increment,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebaseClient';
import { Craft } from './types';

export interface CraftData {
  id?: string;
  artisanId: string;
  title: string;
  description: string;
  shortDescription?: string;
  images: string[];
  category: string;
  materials: string[];
  techniques: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToComplete: string;
  story: string;
  culturalContext: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  tags: string[];
  price?: number;
  isPublished: boolean;
  aiGenerated?: {
    descriptionGenerated: boolean;
    storyGenerated: boolean;
    tagsGenerated: boolean;
    lastGenerated: Date;
  };
  stats?: {
    views: number;
    likes: number;
    saves: number;
    shares: number;
  };
  seoData?: {
    metaDescription: string;
    keywords: string[];
  };
  socialMedia?: {
    caption: string;
    hashtags: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

class CraftService {
  private static instance: CraftService;

  static getInstance(): CraftService {
    if (!CraftService.instance) {
      CraftService.instance = new CraftService();
    }
    return CraftService.instance;
  }

  /**
   * Create a new craft listing
   */
  async createCraft(craftData: Omit<CraftData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const craftRef = doc(collection(db, 'crafts'));
      const craftId = craftRef.id;

      const newCraft: CraftData = {
        ...craftData,
        id: craftId,
        stats: {
          views: 0,
          likes: 0,
          saves: 0,
          shares: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(craftRef, {
        ...newCraft,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update artisan's craft count
      await this.updateArtisanStats(craftData.artisanId, { craftsCount: increment(1) });

      return craftId;
    } catch (error) {
      console.error('Error creating craft:', error);
      throw new Error('Failed to create craft listing');
    }
  }

  /**
   * Get a craft by ID
   */
  async getCraft(craftId: string): Promise<CraftData | null> {
    try {
      const craftRef = doc(db, 'crafts', craftId);
      const craftSnap = await getDoc(craftRef);

      if (!craftSnap.exists()) {
        return null;
      }

      const data = craftSnap.data();
      return {
        ...data,
        id: craftSnap.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        aiGenerated: data.aiGenerated ? {
          ...data.aiGenerated,
          lastGenerated: data.aiGenerated.lastGenerated?.toDate(),
        } : undefined,
      } as CraftData;
    } catch (error) {
      console.error('Error getting craft:', error);
      throw new Error('Failed to retrieve craft');
    }
  }

  /**
   * Update a craft
   */
  async updateCraft(craftId: string, updates: Partial<CraftData>): Promise<void> {
    try {
      const craftRef = doc(db, 'crafts', craftId);
      
      await updateDoc(craftRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating craft:', error);
      throw new Error('Failed to update craft');
    }
  }

  /**
   * Delete a craft
   */
  async deleteCraft(craftId: string, artisanId: string): Promise<void> {
    try {
      const craftRef = doc(db, 'crafts', craftId);
      await deleteDoc(craftRef);

      // Update artisan's craft count
      await this.updateArtisanStats(artisanId, { craftsCount: increment(-1) });
    } catch (error) {
      console.error('Error deleting craft:', error);
      throw new Error('Failed to delete craft');
    }
  }

  /**
   * Get crafts by artisan
   */
  async getCraftsByArtisan(
    artisanId: string, 
    options: {
      limit?: number;
      lastDoc?: QueryDocumentSnapshot;
      publishedOnly?: boolean;
    } = {}
  ): Promise<{ crafts: CraftData[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      const { limit: queryLimit = 20, lastDoc, publishedOnly = false } = options;
      
      let craftQuery = query(
        collection(db, 'crafts'),
        where('artisanId', '==', artisanId),
        orderBy('createdAt', 'desc'),
        limit(queryLimit)
      );

      if (publishedOnly) {
        craftQuery = query(
          collection(db, 'crafts'),
          where('artisanId', '==', artisanId),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc'),
          limit(queryLimit)
        );
      }

      if (lastDoc) {
        craftQuery = query(craftQuery, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(craftQuery);
      const crafts: CraftData[] = [];
      let newLastDoc: QueryDocumentSnapshot | undefined;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        crafts.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          aiGenerated: data.aiGenerated ? {
            ...data.aiGenerated,
            lastGenerated: data.aiGenerated.lastGenerated?.toDate(),
          } : undefined,
        } as CraftData);
        newLastDoc = doc;
      });

      return { crafts, lastDoc: newLastDoc };
    } catch (error) {
      console.error('Error getting crafts by artisan:', error);
      throw new Error('Failed to retrieve artisan crafts');
    }
  }

  /**
   * Get published crafts for discovery
   */
  async getPublishedCrafts(
    options: {
      limit?: number;
      lastDoc?: QueryDocumentSnapshot;
      category?: string;
      tags?: string[];
    } = {}
  ): Promise<{ crafts: CraftData[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      const { limit: queryLimit = 20, lastDoc, category, tags } = options;
      
      let craftQuery = query(
        collection(db, 'crafts'),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
        limit(queryLimit)
      );

      if (category) {
        craftQuery = query(
          collection(db, 'crafts'),
          where('isPublished', '==', true),
          where('category', '==', category),
          orderBy('createdAt', 'desc'),
          limit(queryLimit)
        );
      }

      if (tags && tags.length > 0) {
        craftQuery = query(
          collection(db, 'crafts'),
          where('isPublished', '==', true),
          where('tags', 'array-contains-any', tags),
          orderBy('createdAt', 'desc'),
          limit(queryLimit)
        );
      }

      if (lastDoc) {
        craftQuery = query(craftQuery, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(craftQuery);
      const crafts: CraftData[] = [];
      let newLastDoc: QueryDocumentSnapshot | undefined;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        crafts.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          aiGenerated: data.aiGenerated ? {
            ...data.aiGenerated,
            lastGenerated: data.aiGenerated.lastGenerated?.toDate(),
          } : undefined,
        } as CraftData);
        newLastDoc = doc;
      });

      return { crafts, lastDoc: newLastDoc };
    } catch (error) {
      console.error('Error getting published crafts:', error);
      throw new Error('Failed to retrieve published crafts');
    }
  }

  /**
   * Search crafts
   */
  async searchCrafts(
    searchTerm: string,
    options: {
      limit?: number;
      category?: string;
    } = {}
  ): Promise<CraftData[]> {
    try {
      const { limit: queryLimit = 20, category } = options;
      
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that searches in tags and category
      // For production, consider using Algolia or similar service
      
      let craftQuery = query(
        collection(db, 'crafts'),
        where('isPublished', '==', true),
        limit(queryLimit)
      );

      if (category) {
        craftQuery = query(
          collection(db, 'crafts'),
          where('isPublished', '==', true),
          where('category', '==', category),
          limit(queryLimit)
        );
      }

      const querySnapshot = await getDocs(craftQuery);
      const crafts: CraftData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const craft = {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as CraftData;

        // Client-side filtering for search term
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          craft.title.toLowerCase().includes(searchLower) ||
          craft.description.toLowerCase().includes(searchLower) ||
          craft.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          craft.materials.some(material => material.toLowerCase().includes(searchLower));

        if (matchesSearch) {
          crafts.push(craft);
        }
      });

      return crafts;
    } catch (error) {
      console.error('Error searching crafts:', error);
      throw new Error('Failed to search crafts');
    }
  }

  /**
   * Publish/unpublish a craft
   */
  async togglePublishStatus(craftId: string, isPublished: boolean): Promise<void> {
    try {
      await this.updateCraft(craftId, { isPublished });
    } catch (error) {
      console.error('Error toggling publish status:', error);
      throw new Error('Failed to update publish status');
    }
  }

  /**
   * Increment craft stats
   */
  async incrementCraftStat(
    craftId: string, 
    stat: 'views' | 'likes' | 'saves' | 'shares'
  ): Promise<void> {
    try {
      const craftRef = doc(db, 'crafts', craftId);
      await updateDoc(craftRef, {
        [`stats.${stat}`]: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error incrementing ${stat}:`, error);
      throw new Error(`Failed to update ${stat}`);
    }
  }

  /**
   * Get craft statistics
   */
  async getCraftStats(craftId: string): Promise<CraftData['stats'] | null> {
    try {
      const craft = await this.getCraft(craftId);
      return craft?.stats || null;
    } catch (error) {
      console.error('Error getting craft stats:', error);
      return null;
    }
  }

  /**
   * Update artisan statistics
   */
  private async updateArtisanStats(artisanId: string, updates: Record<string, any>): Promise<void> {
    try {
      const artisanRef = doc(db, 'artisans', artisanId);
      await updateDoc(artisanRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating artisan stats:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get trending crafts
   */
  async getTrendingCrafts(limit: number = 10): Promise<CraftData[]> {
    try {
      // Simple trending algorithm based on recent likes and views
      const craftQuery = query(
        collection(db, 'crafts'),
        where('isPublished', '==', true),
        orderBy('stats.likes', 'desc'),
        limit(limit)
      );

      const querySnapshot = await getDocs(craftQuery);
      const crafts: CraftData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        crafts.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as CraftData);
      });

      return crafts;
    } catch (error) {
      console.error('Error getting trending crafts:', error);
      throw new Error('Failed to retrieve trending crafts');
    }
  }

  /**
   * Get craft categories with counts
   */
  async getCraftCategories(): Promise<{ category: string; count: number }[]> {
    try {
      // Note: This is a simplified implementation
      // For production, consider maintaining a separate categories collection
      const craftQuery = query(
        collection(db, 'crafts'),
        where('isPublished', '==', true)
      );

      const querySnapshot = await getDocs(craftQuery);
      const categoryMap = new Map<string, number>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const category = data.category;
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      return Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      }));
    } catch (error) {
      console.error('Error getting craft categories:', error);
      throw new Error('Failed to retrieve craft categories');
    }
  }
}

export const craftService = CraftService.getInstance();