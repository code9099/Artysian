/**
 * Custom hook for managing user favorites
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { craftService, CraftData } from '@/lib/craftService';
import { toast } from 'sonner';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteCrafts, setFavoriteCrafts] = useState<CraftData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Load user's favorites
  const loadFavorites = useCallback(async () => {
    if (!user || user.isGuest) {
      // For guest users, load from localStorage
      const guestFavorites = JSON.parse(localStorage.getItem('craftstory_guest_favorites') || '[]');
      setFavorites(guestFavorites);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userFavorites = userData.favorites || [];
        setFavorites(userFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load favorite crafts details
  const loadFavoriteCrafts = useCallback(async () => {
    if (favorites.length === 0) {
      setFavoriteCrafts([]);
      return;
    }

    setLoading(true);
    
    try {
      const craftPromises = favorites.map(craftId => craftService.getCraft(craftId));
      const crafts = await Promise.all(craftPromises);
      const validCrafts = crafts.filter((craft): craft is CraftData => craft !== null);
      setFavoriteCrafts(validCrafts);
    } catch (error) {
      console.error('Error loading favorite crafts:', error);
      setError('Failed to load favorite crafts');
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  // Add to favorites
  const addToFavorites = useCallback(async (craftId: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return false;
    }

    if (user.isGuest) {
      // For guest users, save to localStorage
      const guestFavorites = JSON.parse(localStorage.getItem('craftstory_guest_favorites') || '[]');
      if (!guestFavorites.includes(craftId)) {
        const newFavorites = [...guestFavorites, craftId];
        localStorage.setItem('craftstory_guest_favorites', JSON.stringify(newFavorites));
        setFavorites(newFavorites);
        toast.success('Added to favorites! Sign up to sync across devices.');
        return true;
      }
      return false;
    }

    if (favorites.includes(craftId)) {
      return false; // Already in favorites
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: arrayUnion(craftId)
      });

      setFavorites(prev => [...prev, craftId]);
      
      // Increment craft saves count
      await craftService.incrementCraftStat(craftId, 'saves');
      
      toast.success('Added to favorites!');
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Failed to add to favorites');
      return false;
    }
  }, [user, favorites]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (craftId: string) => {
    if (!user) return false;

    if (user.isGuest) {
      // For guest users, remove from localStorage
      const guestFavorites = JSON.parse(localStorage.getItem('craftstory_guest_favorites') || '[]');
      const newFavorites = guestFavorites.filter((id: string) => id !== craftId);
      localStorage.setItem('craftstory_guest_favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      toast.success('Removed from favorites');
      return true;
    }

    if (!favorites.includes(craftId)) {
      return false; // Not in favorites
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: arrayRemove(craftId)
      });

      setFavorites(prev => prev.filter(id => id !== craftId));
      setFavoriteCrafts(prev => prev.filter(craft => craft.id !== craftId));
      
      toast.success('Removed from favorites');
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
      return false;
    }
  }, [user, favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (craftId: string) => {
    if (favorites.includes(craftId)) {
      return await removeFromFavorites(craftId);
    } else {
      return await addToFavorites(craftId);
    }
  }, [favorites, addToFavorites, removeFromFavorites]);

  // Check if craft is favorited
  const isFavorited = useCallback((craftId: string) => {
    return favorites.includes(craftId);
  }, [favorites]);

  // Clear all favorites
  const clearFavorites = useCallback(async () => {
    if (!user) return false;

    if (user.isGuest) {
      localStorage.removeItem('craftstory_guest_favorites');
      setFavorites([]);
      setFavoriteCrafts([]);
      toast.success('Favorites cleared');
      return true;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: []
      });

      setFavorites([]);
      setFavoriteCrafts([]);
      toast.success('All favorites cleared');
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast.error('Failed to clear favorites');
      return false;
    }
  }, [user]);

  // Load favorites on mount and user change
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Load favorite crafts when favorites change
  useEffect(() => {
    loadFavoriteCrafts();
  }, [loadFavoriteCrafts]);

  return {
    favorites,
    favoriteCrafts,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    clearFavorites,
    refresh: loadFavorites,
    favoritesCount: favorites.length,
  };
}