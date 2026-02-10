/**
 * Image Processor Service
 * Handles image compression, optimization, and manipulation
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg',
};

class ImageProcessorService {
  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request media library permission
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request media library write permission
   */
  async requestMediaLibraryWritePermission(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Launch camera to take a photo
   */
  async takePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Take photo error:', error);
      throw error;
    }
  }

  /**
   * Pick an image from gallery
   */
  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        throw new Error('Media library permission denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Pick image error:', error);
      throw error;
    }
  }

  /**
   * Compress and optimize image for upload
   */
  async processImage(
    imageUri: string,
    options: ImageProcessingOptions = {}
  ): Promise<string> {
    try {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      // Manipulate image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: opts.maxWidth,
              height: opts.maxHeight,
            },
          },
        ],
        {
          compress: opts.quality,
          format: opts.format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Process image error:', error);
      throw error;
    }
  }

  /**
   * Create thumbnail from image
   */
  async createThumbnail(imageUri: string): Promise<string> {
    try {
      const thumbnail = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: 300,
              height: 400,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return thumbnail.uri;
    } catch (error) {
      console.error('Create thumbnail error:', error);
      throw error;
    }
  }

  /**
   * Save image to device
   */
  async saveImageToDevice(imageUri: string): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryWritePermission();
      if (!hasPermission) {
        throw new Error('Media library write permission denied');
      }

      const asset = await MediaLibrary.createAssetAsync(imageUri);
      return asset.uri;
    } catch (error) {
      console.error('Save image error:', error);
      throw error;
    }
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {});
      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Get image dimensions error:', error);
      throw error;
    }
  }

  /**
   * Validate image for fashion analysis
   * Ensures image meets minimum requirements
   */
  async validateImage(imageUri: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const dimensions = await this.getImageDimensions(imageUri);

      if (dimensions.width < 300 || dimensions.height < 300) {
        return {
          valid: false,
          error: 'Image is too small. Please use an image at least 300x300 pixels.',
        };
      }

      if (dimensions.width > 4096 || dimensions.height > 4096) {
        return {
          valid: false,
          error: 'Image is too large. Please use an image smaller than 4096x4096 pixels.',
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Validate image error:', error);
      return {
        valid: false,
        error: 'Failed to validate image. Please try another image.',
      };
    }
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessorService();

// Export class for testing
export default ImageProcessorService;
