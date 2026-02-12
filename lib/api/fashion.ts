/**
 * Fashion AI API Client
 * Mobile-optimized with caching and offline support
 * Based on AI-Zerocue backend integration
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OutfitAnalysis,
  VirtualTryonJob,
  FeedbackSubmission,
  SavedOutfit,
  ApiError,
} from '../types/fashion';

// API Configuration
const FASHION_API_BASE_URL = process.env.EXPO_PUBLIC_FASHION_API_URL || 'http://localhost:8000/v1';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const USE_MOCK_DATA = false; // Backend is in mock mode now, so mobile app will get mock data from server

// Mock Data for Testing
const MOCK_ANALYSIS: OutfitAnalysis = {
  analysis_id: 'mock_' + Date.now(),
  image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
  thumbnail_url: null,
  outfit_analysis: {
    items: [
      { type: 'T-Shirt', color: ['White'], pattern: null, fit: 'Regular', confidence: 0.95 },
      { type: 'Jeans', color: ['Blue'], pattern: null, fit: 'Slim', confidence: 0.92 },
      { type: 'Sneakers', color: ['Black'], pattern: null, fit: null, confidence: 0.88 },
    ],
    overall_feedback: 'Great casual look! The outfit shows good color coordination and fits well for everyday wear.',
    occasion_suitability: {
      'Casual': 0.95,
      'Work': 0.65,
      'Party': 0.45,
    },
    formality_score: 0.4,
    color_palette: ['White', 'Blue', 'Black'],
    strengths: ['Good color coordination', 'Comfortable fit', 'Versatile pieces'],
    improvements: ['Consider adding a watch or bracelet for extra style', 'Layer with a jacket for more depth'],
  },
  recommendations: [
    {
      id: 'rec_1',
      category: 'Jacket',
      suggestion_text: 'Add a denim jacket for layering',
      reasoning: 'A light jacket would complete the casual look and add versatility',
      product_image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
      compatibility_score: 0.9,
      rank_order: 1,
    },
    {
      id: 'rec_2',
      category: 'Accessories',
      suggestion_text: 'Silver watch or leather bracelet',
      reasoning: 'Accessories would add personality without overwhelming the simple aesthetic',
      product_image_url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
      compatibility_score: 0.85,
      rank_order: 2,
    },
    {
      id: 'rec_3',
      category: 'Shoes',
      suggestion_text: 'Try white sneakers for a cleaner look',
      reasoning: 'White sneakers would brighten the outfit and match the t-shirt',
      product_image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
      compatibility_score: 0.88,
      rank_order: 3,
    },
  ],
  created_at: new Date().toISOString(),
};

class FashionAPIClient {
  private client: AxiosInstance;

  constructor() {
    console.log('Fashion API Client initialized with URL:', FASHION_API_BASE_URL);

    this.client = axios.create({
      baseURL: FASHION_API_BASE_URL,
      timeout: 60000, // 60 seconds for VTO operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor (for auth tokens)
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const apiError: ApiError = {
          error: error.response?.data?.error || error.message || 'An error occurred',
          detail: error.response?.data?.detail,
          status_code: error.response?.status || 500,
        };
        return Promise.reject(apiError);
      }
    );
  }

  // ============================================================================
  // CACHING UTILITIES
  // ============================================================================

  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`fashion_cache_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(`fashion_cache_${key}`);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Fashion cache get error:', error);
      return null;
    }
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `fashion_cache_${key}`,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Fashion cache set error:', error);
    }
  }

  // ============================================================================
  // OUTFIT UPLOAD & ANALYSIS
  // ============================================================================

  async uploadAndAnalyzeOutfit(
    imageUri: string,
    occasion?: string
  ): Promise<OutfitAnalysis> {
    // Mock mode for testing without backend
    if (USE_MOCK_DATA) {
      console.log('🎭 Fashion AI: Using mock data mode');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalysis = {
        ...MOCK_ANALYSIS,
        analysis_id: 'mock_' + Date.now(),
        image_url: imageUri, // Use the uploaded image
        created_at: new Date().toISOString(),
      };

      // Cache the mock analysis
      await this.setCache(`analysis_${mockAnalysis.analysis_id}`, mockAnalysis);

      return mockAnalysis;
    }

    const formData = new FormData();

    // Convert image URI to blob/file
    const filename = imageUri.split('/').pop() || 'outfit.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    if (occasion) {
      formData.append('occasion', occasion);
    }

    const response = await this.client.post<OutfitAnalysis>(
      '/outfits/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Cache the analysis
    await this.setCache(`analysis_${response.data.analysis_id}`, response.data);

    return response.data;
  }

  async getAnalysis(analysisId: string): Promise<OutfitAnalysis> {
    // Try cache first
    const cached = await this.getCached<OutfitAnalysis>(`analysis_${analysisId}`);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await this.client.get<OutfitAnalysis>(
      `/outfits/analysis/${analysisId}`
    );

    // Cache the result
    await this.setCache(`analysis_${analysisId}`, response.data);

    return response.data;
  }

  // ============================================================================
  // VIRTUAL TRY-ON
  // ============================================================================

  async requestVirtualTryon(
    analysisId: string,
    recommendationId: string
  ): Promise<VirtualTryonJob> {
    // Mock mode for testing
    if (USE_MOCK_DATA) {
      console.log('🎭 Fashion AI: Mock virtual try-on requested');
      return {
        job_id: 'mock_tryon_' + Date.now(),
        status: 'processing',
        created_at: new Date().toISOString(),
      };
    }

    const response = await this.client.post<VirtualTryonJob>(
      `/outfits/${analysisId}/try-on`,
      { recommendation_id: recommendationId }
    );
    return response.data;
  }

  async getVirtualTryonStatus(jobId: string): Promise<VirtualTryonJob> {
    // Mock mode for testing
    if (USE_MOCK_DATA) {
      console.log('🎭 Fashion AI: Mock virtual try-on status check');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        job_id: jobId,
        status: 'completed',
        result: {
          tryon_image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
          confidence_score: 0.87,
          processing_time: 5.2,
        },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
    }

    const response = await this.client.get<VirtualTryonJob>(`/jobs/${jobId}`);
    return response.data;
  }

  async pollVirtualTryon(jobId: string, maxAttempts = 30): Promise<VirtualTryonJob> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVirtualTryonStatus(jobId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait 2 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Virtual try-on timed out');
  }

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  async submitFeedback(feedback: FeedbackSubmission): Promise<{ feedback_id: string }> {
    const response = await this.client.post<{ feedback_id: string }>(
      '/feedback',
      feedback
    );
    return response.data;
  }

  // ============================================================================
  // SAVED OUTFITS (WARDROBE)
  // ============================================================================

  async saveOutfit(data: {
    analysis_id: string;
    name: string;
    description?: string;
    tryon_id?: string;
    tags?: string[];
  }): Promise<{ outfit_id: string }> {
    // Mock mode for testing
    if (USE_MOCK_DATA) {
      console.log('🎭 Fashion AI: Mock save outfit');
      const outfitId = 'mock_outfit_' + Date.now();

      // Save to local storage for wardrobe
      const savedOutfits = await this.getSavedOutfits();
      const newOutfit: SavedOutfit = {
        outfit_id: outfitId,
        name: data.name,
        description: data.description,
        image_url: MOCK_ANALYSIS.image_url,
        analysis_id: data.analysis_id,
        tags: data.tags || [],
        created_at: new Date().toISOString(),
      };

      savedOutfits.push(newOutfit);
      await this.setCache('saved_outfits', savedOutfits);

      return { outfit_id: outfitId };
    }

    const response = await this.client.post<{ outfit_id: string }>('/outfits/save', data);

    // Invalidate saved outfits cache
    await AsyncStorage.removeItem('fashion_cache_saved_outfits');

    return response.data;
  }

  async getSavedOutfits(): Promise<SavedOutfit[]> {
    // Mock mode for testing
    if (USE_MOCK_DATA) {
      console.log('🎭 Fashion AI: Mock get saved outfits');
      // Try cache first
      const cached = await this.getCached<SavedOutfit[]>('saved_outfits');
      if (cached) {
        return cached;
      }

      // Return empty array initially
      return [];
    }

    // Try cache first
    const cached = await this.getCached<SavedOutfit[]>('saved_outfits');
    if (cached) {
      return cached;
    }

    try {
      // Fetch from API
      const response = await this.client.get<SavedOutfit[]>('/outfits/saved');

      // Cache the result
      await this.setCache('saved_outfits', response.data);

      return response.data;
    } catch (error: any) {
      console.warn('Failed to load saved outfits from API, using empty array:', error.error || error.message);
      // Return empty array if backend is not ready
      // This prevents the app from crashing while backend is being developed
      return [];
    }
  }

  async getSavedOutfit(outfitId: string): Promise<SavedOutfit> {
    const response = await this.client.get<SavedOutfit>(`/outfits/saved/${outfitId}`);
    return response.data;
  }

  async deleteSavedOutfit(outfitId: string): Promise<void> {
    // Mock mode for testing
    if (USE_MOCK_DATA) {
      console.log('🎭 Fashion AI: Mock delete saved outfit');
      const savedOutfits = await this.getSavedOutfits();
      const filtered = savedOutfits.filter(outfit => outfit.outfit_id !== outfitId);
      await this.setCache('saved_outfits', filtered);
      return;
    }

    await this.client.delete(`/outfits/saved/${outfitId}`);

    // Invalidate saved outfits cache
    await AsyncStorage.removeItem('fashion_cache_saved_outfits');
  }

  // ============================================================================
  // VOICE ASSISTANT / FASHION QUESTIONS
  // ============================================================================

  async askFashionQuestion(question: string): Promise<{
    answer: string;
    related_items?: string[];
    confidence: number;
  }> {
    try {
      const response = await this.client.post<{
        answer: string;
        related_items?: string[];
        confidence: number;
      }>('/fashion/ask', { question });

      return response.data;
    } catch (error) {
      console.error('Fashion question API error:', error);
      throw error;
    }
  }

  // ============================================================================
  // OFFLINE QUEUE
  // ============================================================================

  async queueUpload(imageUri: string, occasion?: string): Promise<void> {
    try {
      const queue = await this.getUploadQueue();
      queue.push({
        id: `upload_${Date.now()}`,
        imageUri,
        occasion,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem('fashion_upload_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Fashion queue upload error:', error);
    }
  }

  async getUploadQueue(): Promise<any[]> {
    try {
      const queue = await AsyncStorage.getItem('fashion_upload_queue');
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Fashion get queue error:', error);
      return [];
    }
  }

  async processUploadQueue(): Promise<void> {
    const queue = await this.getUploadQueue();

    for (const item of queue) {
      try {
        await this.uploadAndAnalyzeOutfit(item.imageUri, item.occasion);
        // Remove from queue after successful upload
        const updatedQueue = queue.filter((q) => q.id !== item.id);
        await AsyncStorage.setItem('fashion_upload_queue', JSON.stringify(updatedQueue));
      } catch (error) {
        console.error('Fashion process queue item error:', error);
        // Keep in queue for next attempt
      }
    }
  }
}

// Export singleton instance
export const fashionApi = new FashionAPIClient();

// Export class for testing
export default FashionAPIClient;
