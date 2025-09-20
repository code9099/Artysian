/**
 * Custom hook for managing craft operations
 */

import { useState, useEffect, useCallback } from 'react';
import { craftService, CraftData } from '@/lib/craftService';
import { useAuth } from '@/contexts/AuthContext';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

export interface UseCraftsOptions {
  artisanId?: string;
  publishedOnly?: boolean;
  category?: string;
  tags?: string[];
  limit?: number;
  autoLoad?: boolean;
}

export interface CraftsState {
  crafts: CraftData[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot;
}

export function useCrafts(options: UseCraftsOptions = {}) {
  const {
    artisanId,
    publishedOnly = false,
    category,
    tags,
    limit = 20,
    autoLoad = true,
  } = options;

  const { user } = useAuth();
  
  const [state, setState] = useState<CraftsState>({
    crafts: [],
    loading: false,
    error: null,
    hasMore: true,
  });

  // Load crafts
  const loadCrafts = useCallback(async (reset = false) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      ...(reset && { crafts: [], lastDoc: undefined, hasMore: true })
    }));

    try {
      let result;
      
      if (artisanId) {
        // Load crafts by specific artisan
        result = await craftService.getCraftsByArtisan(artisanId, {
          limit,
          lastDoc: reset ? undefined : state.lastDoc,
          publishedOnly,
        });
      } else {
        // Load published crafts for discovery
        result = await craftService.getPublishedCrafts({
          limit,
          lastDoc: reset ? undefined : state.lastDoc,
          category,
          tags,
        });
      }

      setState(prev => ({
        ...prev,
        crafts: reset ? result.crafts : [...prev.crafts, ...result.crafts],
        lastDoc: result.lastDoc,
        hasMore: result.crafts.length === limit,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading crafts:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load crafts',
        loading: false,
      }));
    }
  }, [artisanId, publishedOnly, category, tags, limit, state.lastDoc]);

  // Load more crafts (pagination)
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadCrafts(false);
    }
  }, [loadCrafts, state.loading, state.hasMore]);

  // Refresh crafts
  const refresh = useCallback(() => {
    loadCrafts(true);
  }, [loadCrafts]);

  // Auto-load on mount and dependency changes
  useEffect(() => {
    if (autoLoad) {
      loadCrafts(true);
    }
  }, [artisanId, publishedOnly, category, tags, autoLoad]);

  return {
    ...state,
    loadCrafts,
    loadMore,
    refresh,
  };
}

// Hook for managing a single craft
export function useCraft(craftId?: string) {
  const [craft, setCraft] = useState<CraftData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCraft = useCallback(async () => {
    if (!craftId) return;

    setLoading(true);
    setError(null);

    try {
      const craftData = await craftService.getCraft(craftId);
      setCraft(craftData);
    } catch (error) {
      console.error('Error loading craft:', error);
      setError(error instanceof Error ? error.message : 'Failed to load craft');
    } finally {
      setLoading(false);
    }
  }, [craftId]);

  const updateCraft = useCallback(async (updates: Partial<CraftData>) => {
    if (!craftId) return;

    try {
      await craftService.updateCraft(craftId, updates);
      setCraft(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Craft updated successfully');
    } catch (error) {
      console.error('Error updating craft:', error);
      toast.error('Failed to update craft');
      throw error;
    }
  }, [craftId]);

  const deleteCraft = useCallback(async () => {
    if (!craftId || !craft) return;

    try {
      await craftService.deleteCraft(craftId, craft.artisanId);
      setCraft(null);
      toast.success('Craft deleted successfully');
    } catch (error) {
      console.error('Error deleting craft:', error);
      toast.error('Failed to delete craft');
      throw error;
    }
  }, [craftId, craft]);

  const togglePublish = useCallback(async () => {
    if (!craftId || !craft) return;

    try {
      const newStatus = !craft.isPublished;
      await craftService.togglePublishStatus(craftId, newStatus);
      setCraft(prev => prev ? { ...prev, isPublished: newStatus } : null);
      toast.success(newStatus ? 'Craft published' : 'Craft unpublished');
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
      throw error;
    }
  }, [craftId, craft]);

  const incrementStat = useCallback(async (stat: 'views' | 'likes' | 'saves' | 'shares') => {
    if (!craftId) return;

    try {
      await craftService.incrementCraftStat(craftId, stat);
      setCraft(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: (prev.stats?.[stat] || 0) + 1,
        }
      } : null);
    } catch (error) {
      console.error(`Error incrementing ${stat}:`, error);
      // Don't show error toast for stats as it's not critical
    }
  }, [craftId]);

  useEffect(() => {
    if (craftId) {
      loadCraft();
    }
  }, [craftId, loadCraft]);

  return {
    craft,
    loading,
    error,
    loadCraft,
    updateCraft,
    deleteCraft,
    togglePublish,
    incrementStat,
  };
}

// Hook for creating crafts
export function useCreateCraft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createCraft = useCallback(async (craftData: Omit<CraftData, 'id' | 'artisanId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || user.isGuest) {
      throw new Error('Authentication required to create crafts');
    }

    setLoading(true);
    setError(null);

    try {
      const craftId = await craftService.createCraft({
        ...craftData,
        artisanId: user.uid,
      });

      toast.success('Craft created successfully!');
      return craftId;
    } catch (error) {
      console.error('Error creating craft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create craft';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    createCraft,
    loading,
    error,
  };
}

// Hook for searching crafts
export function useSearchCrafts() {
  const [results, setResults] = useState<CraftData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchTerm: string, options: { category?: string } = {}) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await craftService.searchCrafts(searchTerm, options);
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching crafts:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}

// Hook for trending crafts
export function useTrendingCrafts(limit: number = 10) {
  const [crafts, setCrafts] = useState<CraftData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrending = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const trendingCrafts = await craftService.getTrendingCrafts(limit);
      setCrafts(trendingCrafts);
    } catch (error) {
      console.error('Error loading trending crafts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load trending crafts');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  return {
    crafts,
    loading,
    error,
    refresh: loadTrending,
  };
}