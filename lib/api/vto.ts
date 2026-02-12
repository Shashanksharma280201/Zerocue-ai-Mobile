/**
 * Virtual Try-On API Client
 * Direct integration with backend FASHN VTO service
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const BACKEND_URL = process.env.EXPO_PUBLIC_FASHION_API_URL || 'http://143.110.255.182/v1';

interface VTOResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  confidence?: number;
  error?: string;
}

class VTOAPIClient {
  private client: AxiosInstance;

  constructor() {
    console.log('VTO API Client initialized with URL:', BACKEND_URL);

    this.client = axios.create({
      baseURL: BACKEND_URL,
      timeout: 120000, // 2 minutes for VTO operations
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Upload avatar and product images to generate VTO
   */
  async generateVTO(
    avatarUri: string,
    productUri: string
  ): Promise<VTOResponse> {
    try {
      console.log('VTO: Starting generation', { avatarUri, productUri });

      const formData = new FormData();

      // Add avatar image
      const avatarFilename = avatarUri.split('/').pop() || 'avatar.jpg';
      const avatarType = this.getMimeType(avatarFilename);
      formData.append('avatar_image', {
        uri: avatarUri,
        name: avatarFilename,
        type: avatarType,
      } as any);

      // Add product image
      const productFilename = productUri.split('/').pop() || 'product.jpg';
      const productType = this.getMimeType(productFilename);
      formData.append('product_image', {
        uri: productUri,
        name: productFilename,
        type: productType,
      } as any);

      console.log('VTO: Sending request to backend...');

      const response = await this.client.post<VTOResponse>(
        '/vto/generate',
        formData
      );

      console.log('VTO: Response received', response.data);

      return response.data;
    } catch (error: any) {
      console.error('VTO: Generation error', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to generate virtual try-on'
      );
    }
  }

  /**
   * Check VTO job status
   */
  async checkStatus(jobId: string): Promise<VTOResponse> {
    try {
      const response = await this.client.get<VTOResponse>(`/vto/status/${jobId}`);
      return response.data;
    } catch (error: any) {
      console.error('VTO: Status check error', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to check VTO status'
      );
    }
  }

  /**
   * Poll VTO job until completion
   */
  async pollUntilComplete(
    jobId: string,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<VTOResponse> {
    console.log('VTO: Polling job', { jobId, maxAttempts });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.checkStatus(jobId);

        console.log(`VTO: Poll attempt ${attempt}/${maxAttempts}`, status.status);

        if (status.status === 'completed') {
          console.log('VTO: Job completed successfully');
          return status;
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'VTO generation failed');
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error: any) {
        if (attempt === maxAttempts) {
          throw error;
        }
        // Continue polling on non-fatal errors
        console.warn(`VTO: Poll attempt ${attempt} error, retrying...`, error.message);
      }
    }

    throw new Error('VTO generation timed out after 2 minutes');
  }

  /**
   * Helper: Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const match = /\.(\w+)$/.exec(filename);
    if (!match) return 'image/jpeg';

    const ext = match[1].toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return mimeMap[ext] || 'image/jpeg';
  }
}

// Export singleton instance
export const vtoApi = new VTOAPIClient();

// Export class for testing
export default VTOAPIClient;
