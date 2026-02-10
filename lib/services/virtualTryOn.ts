/**
 * Virtual Try-On Service
 * Integrates with virtual try-on APIs to generate try-on images
 * Supports multiple providers: Fashn AI, Replicate, Custom backend
 */

import axios from 'axios';
import * as FileSystem from 'expo-file-system';

export interface TryOnRequest {
  personImageUri: string; // User's photo
  garmentImageUri: string; // Product/clothing image
  category?: string; // e.g., 'top', 'bottom', 'dress', 'full-body'
}

export interface TryOnResult {
  tryOnImageUrl: string; // URL of the generated try-on image
  confidence: number; // 0.0 - 1.0
  processingTime: number; // milliseconds
  metadata?: {
    provider: string;
    modelVersion?: string;
  };
}

type TryOnProvider = 'replicate' | 'fashn' | 'custom';

class VirtualTryOnService {
  private provider: TryOnProvider = 'replicate';
  private apiKey: string = '';
  private baseUrl: string = '';

  /**
   * Configure the virtual try-on service
   */
  configure(provider: TryOnProvider, apiKey: string, baseUrl?: string) {
    this.provider = provider;
    this.apiKey = apiKey;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Generate virtual try-on image
   */
  async generateTryOn(request: TryOnRequest): Promise<TryOnResult> {
    const startTime = Date.now();

    try {
      console.log(`Generating try-on with provider: ${this.provider}`);

      switch (this.provider) {
        case 'replicate':
          return await this.generateWithReplicate(request, startTime);
        case 'fashn':
          return await this.generateWithFashn(request, startTime);
        case 'custom':
          return await this.generateWithCustomBackend(request, startTime);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Virtual try-on error:', error);
      throw error;
    }
  }

  /**
   * Generate with Replicate (IDM-VTON or similar model)
   */
  private async generateWithReplicate(
    request: TryOnRequest,
    startTime: number
  ): Promise<TryOnResult> {
    try {
      // Convert images to base64
      const personBase64 = await this.convertImageToBase64(request.personImageUri);
      const garmentBase64 = await this.convertImageToBase64(request.garmentImageUri);

      // Create prediction
      const predictionResponse = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: 'idm-vton-model-version', // Replace with actual model version
          input: {
            human_img: `data:image/jpeg;base64,${personBase64}`,
            garm_img: `data:image/jpeg;base64,${garmentBase64}`,
            category: request.category || 'upper_body',
          },
        },
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const predictionId = predictionResponse.data.id;

      // Poll for completion
      let prediction = predictionResponse.data;
      while (prediction.status === 'starting' || prediction.status === 'processing') {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              Authorization: `Token ${this.apiKey}`,
            },
          }
        );

        prediction = statusResponse.data;
      }

      if (prediction.status === 'succeeded') {
        return {
          tryOnImageUrl: prediction.output,
          confidence: 0.9,
          processingTime: Date.now() - startTime,
          metadata: {
            provider: 'replicate',
            modelVersion: 'idm-vton',
          },
        };
      } else {
        throw new Error(`Prediction failed: ${prediction.error}`);
      }
    } catch (error: any) {
      console.error('Replicate try-on error:', error.response?.data || error.message);
      throw new Error('Replicate virtual try-on failed');
    }
  }

  /**
   * Generate with Fashn AI
   */
  private async generateWithFashn(
    request: TryOnRequest,
    startTime: number
  ): Promise<TryOnResult> {
    try {
      // Convert images to base64
      const personBase64 = await this.convertImageToBase64(request.personImageUri);
      const garmentBase64 = await this.convertImageToBase64(request.garmentImageUri);

      const response = await axios.post(
        'https://api.fashn.ai/v1/tryon',
        {
          model_image: personBase64,
          garment_image: garmentBase64,
          category: request.category || 'tops',
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        tryOnImageUrl: response.data.result_url,
        confidence: response.data.confidence || 0.85,
        processingTime: Date.now() - startTime,
        metadata: {
          provider: 'fashn',
        },
      };
    } catch (error: any) {
      console.error('Fashn AI try-on error:', error.response?.data || error.message);
      throw new Error('Fashn AI virtual try-on failed');
    }
  }

  /**
   * Generate with custom backend
   */
  private async generateWithCustomBackend(
    request: TryOnRequest,
    startTime: number
  ): Promise<TryOnResult> {
    try {
      const formData = new FormData();
      formData.append('person_image', {
        uri: request.personImageUri,
        type: 'image/jpeg',
        name: 'person.jpg',
      } as any);
      formData.append('garment_image', {
        uri: request.garmentImageUri,
        type: 'image/jpeg',
        name: 'garment.jpg',
      } as any);
      if (request.category) {
        formData.append('category', request.category);
      }

      const response = await axios.post(`${this.baseUrl}/api/v1/virtual-tryon`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 60000, // 60 second timeout
      });

      return {
        tryOnImageUrl: response.data.tryon_image_url,
        confidence: response.data.confidence || 0.8,
        processingTime: Date.now() - startTime,
        metadata: {
          provider: 'custom',
        },
      };
    } catch (error: any) {
      console.error('Custom backend try-on error:', error.response?.data || error.message);
      throw new Error('Custom backend virtual try-on failed');
    }
  }

  /**
   * Convert image URI to base64
   */
  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Image conversion error:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== '' && this.apiKey.trim() !== '';
  }

  /**
   * Get supported categories for current provider
   */
  getSupportedCategories(): string[] {
    switch (this.provider) {
      case 'replicate':
        return ['upper_body', 'lower_body', 'dresses'];
      case 'fashn':
        return ['tops', 'bottoms', 'dresses', 'outerwear'];
      case 'custom':
        return ['jacket', 'shirt', 't-shirt', 'jeans', 'pants', 'dress', 'shoes'];
      default:
        return [];
    }
  }

  /**
   * Map product category to try-on category
   */
  mapCategoryToTryOn(productCategory: string): string {
    const categoryMap: { [key: string]: string } = {
      'Jacket': 'upper_body',
      'T-Shirt': 'upper_body',
      'Shirt': 'upper_body',
      'Jeans': 'lower_body',
      'Pants': 'lower_body',
      'Dress': 'dresses',
      'Shoes': 'shoes',
    };

    return categoryMap[productCategory] || 'upper_body';
  }
}

export const virtualTryOn = new VirtualTryOnService();
