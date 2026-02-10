/**
 * Fashion Store
 * Global state for fashion AI features using Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OutfitAnalysis, SavedOutfit, VirtualTryonJob } from '../types/fashion';

interface FashionStats {
  outfitsAnalyzed: number;
  savedOutfits: number;
  virtualTryons: number;
  lastAnalysisDate?: string;
}

interface FashionState {
  // Current analysis state
  currentAnalysis: OutfitAnalysis | null;
  currentTryonJob: VirtualTryonJob | null;

  // Recent analyses cache
  recentAnalyses: OutfitAnalysis[];

  // Wardrobe
  savedOutfits: SavedOutfit[];

  // Upload state
  isUploading: boolean;
  uploadProgress: number;

  // User stats
  stats: FashionStats;

  // Actions
  setCurrentAnalysis: (analysis: OutfitAnalysis | null) => void;
  setCurrentTryonJob: (job: VirtualTryonJob | null) => void;
  addRecentAnalysis: (analysis: OutfitAnalysis) => Promise<void>;
  clearRecentAnalyses: () => Promise<void>;
  setSavedOutfits: (outfits: SavedOutfit[]) => Promise<void>;
  addSavedOutfit: (outfit: SavedOutfit) => Promise<void>;
  removeSavedOutfit: (outfitId: string) => Promise<void>;
  setUploadState: (isUploading: boolean, progress?: number) => void;
  incrementStat: (stat: keyof FashionStats) => Promise<void>;
  loadStats: () => Promise<void>;
  resetStore: () => Promise<void>;
}

const DEFAULT_STATS: FashionStats = {
  outfitsAnalyzed: 0,
  savedOutfits: 0,
  virtualTryons: 0,
};

export const useFashionStore = create<FashionState>((set, get) => ({
  // Initial state
  currentAnalysis: null,
  currentTryonJob: null,
  recentAnalyses: [],
  savedOutfits: [],
  isUploading: false,
  uploadProgress: 0,
  stats: DEFAULT_STATS,

  // Set current analysis
  setCurrentAnalysis: (analysis) => {
    set({ currentAnalysis: analysis });
  },

  // Set current tryon job
  setCurrentTryonJob: (job) => {
    set({ currentTryonJob: job });
  },

  // Add to recent analyses (keep last 10)
  addRecentAnalysis: async (analysis) => {
    const recent = get().recentAnalyses;
    const updated = [analysis, ...recent.filter(a => a.analysis_id !== analysis.analysis_id)].slice(0, 10);

    try {
      await AsyncStorage.setItem('fashion_recent_analyses', JSON.stringify(updated));
      set({ recentAnalyses: updated });
    } catch (error) {
      console.error('Failed to save recent analysis:', error);
    }
  },

  // Clear recent analyses
  clearRecentAnalyses: async () => {
    try {
      await AsyncStorage.removeItem('fashion_recent_analyses');
      set({ recentAnalyses: [] });
    } catch (error) {
      console.error('Failed to clear recent analyses:', error);
    }
  },

  // Set saved outfits
  setSavedOutfits: async (outfits) => {
    try {
      await AsyncStorage.setItem('fashion_saved_outfits', JSON.stringify(outfits));
      set({ savedOutfits: outfits });
    } catch (error) {
      console.error('Failed to save outfits:', error);
    }
  },

  // Add saved outfit
  addSavedOutfit: async (outfit) => {
    const saved = get().savedOutfits;
    const updated = [outfit, ...saved];

    try {
      await AsyncStorage.setItem('fashion_saved_outfits', JSON.stringify(updated));
      set({ savedOutfits: updated });
    } catch (error) {
      console.error('Failed to add saved outfit:', error);
    }
  },

  // Remove saved outfit
  removeSavedOutfit: async (outfitId) => {
    const saved = get().savedOutfits;
    const updated = saved.filter(o => o.outfit_id !== outfitId);

    try {
      await AsyncStorage.setItem('fashion_saved_outfits', JSON.stringify(updated));
      set({ savedOutfits: updated });
    } catch (error) {
      console.error('Failed to remove saved outfit:', error);
    }
  },

  // Set upload state
  setUploadState: (isUploading, progress = 0) => {
    set({ isUploading, uploadProgress: progress });
  },

  // Increment a specific stat
  incrementStat: async (stat) => {
    const currentStats = get().stats;
    const currentValue = currentStats[stat];
    const updated = {
      ...currentStats,
      [stat]: typeof currentValue === 'number' ? currentValue + 1 : 1,
      ...(stat === 'outfitsAnalyzed' && { lastAnalysisDate: new Date().toISOString() }),
    };

    try {
      await AsyncStorage.setItem('fashion_stats', JSON.stringify(updated));
      set({ stats: updated });
    } catch (error) {
      console.error('Failed to increment stat:', error);
    }
  },

  // Load stats from storage
  loadStats: async () => {
    try {
      const [statsJson, recentJson, savedJson] = await AsyncStorage.multiGet([
        'fashion_stats',
        'fashion_recent_analyses',
        'fashion_saved_outfits',
      ]);

      const stats = statsJson[1] ? JSON.parse(statsJson[1]) : DEFAULT_STATS;
      const recentAnalyses = recentJson[1] ? JSON.parse(recentJson[1]) : [];
      const savedOutfits = savedJson[1] ? JSON.parse(savedJson[1]) : [];

      set({
        stats,
        recentAnalyses,
        savedOutfits,
      });
    } catch (error) {
      console.error('Failed to load fashion stats:', error);
    }
  },

  // Reset store
  resetStore: async () => {
    try {
      await AsyncStorage.multiRemove([
        'fashion_stats',
        'fashion_recent_analyses',
        'fashion_saved_outfits',
      ]);

      set({
        currentAnalysis: null,
        currentTryonJob: null,
        recentAnalyses: [],
        savedOutfits: [],
        isUploading: false,
        uploadProgress: 0,
        stats: DEFAULT_STATS,
      });
    } catch (error) {
      console.error('Failed to reset fashion store:', error);
    }
  },
}));
