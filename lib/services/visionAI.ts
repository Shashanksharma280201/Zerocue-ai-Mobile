/**
 * Cloud Vision AI Service
 * Integrates with GPT-4 Vision, Claude Vision, or Google Cloud Vision
 * for real product image analysis
 */

import axios from 'axios';
import * as FileSystem from 'expo-file-system';

export interface VisionAnalysisResult {
  itemType: string;
  color: string;
  pattern: string;
  category: string;
  brand?: string;
  confidence: number;
  description: string;
  styleNotes: string[];
  detectedFeatures: {
    material?: string;
    fit?: string;
    neckline?: string;
    sleeve?: string;
    length?: string;
  };
}

type VisionProvider = 'openai' | 'anthropic' | 'google';

class VisionAIService {
  private provider: VisionProvider = 'openai'; // Default provider
  private apiKey: string = '';

  /**
   * Configure the vision service
   */
  configure(provider: VisionProvider, apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  /**
   * Analyze image with cloud AI vision
   */
  async analyzeImage(imageUri: string): Promise<VisionAnalysisResult> {
    try {
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);

      switch (this.provider) {
        case 'openai':
          return await this.analyzeWithOpenAI(base64Image);
        case 'anthropic':
          return await this.analyzeWithClaude(base64Image);
        case 'google':
          return await this.analyzeWithGoogle(base64Image);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Vision AI analysis error:', error);
      throw error;
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
   * Analyze with OpenAI GPT-4 Vision
   */
  private async analyzeWithOpenAI(base64Image: string): Promise<VisionAnalysisResult> {
    const prompt = `Analyze this fashion item image and provide detailed information in JSON format:
{
  "itemType": "specific item name (e.g., 'Denim Jacket', 'White Sneakers')",
  "color": "primary color",
  "pattern": "pattern type (Plain, Striped, Floral, etc.)",
  "category": "category (Jacket, Jeans, Shirt, Shoes, etc.)",
  "brand": "brand if visible, otherwise null",
  "confidence": 0.0-1.0,
  "description": "brief description of the item",
  "styleNotes": ["key style observations"],
  "detectedFeatures": {
    "material": "fabric/material type",
    "fit": "fit type (Slim, Regular, Oversized, etc.)",
    "neckline": "neckline type if applicable",
    "sleeve": "sleeve type if applicable",
    "length": "length description if applicable"
  }
}`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse OpenAI response');
    } catch (error: any) {
      console.error('OpenAI Vision error:', error.response?.data || error.message);
      throw new Error('OpenAI analysis failed');
    }
  }

  /**
   * Analyze with Anthropic Claude Vision
   */
  private async analyzeWithClaude(base64Image: string): Promise<VisionAnalysisResult> {
    const prompt = `Analyze this fashion item image and provide detailed information in JSON format:
{
  "itemType": "specific item name",
  "color": "primary color",
  "pattern": "pattern type",
  "category": "category",
  "brand": "brand if visible, otherwise null",
  "confidence": 0.0-1.0,
  "description": "brief description",
  "styleNotes": ["key style observations"],
  "detectedFeatures": {
    "material": "fabric/material type",
    "fit": "fit type",
    "neckline": "neckline type if applicable",
    "sleeve": "sleeve type if applicable",
    "length": "length description if applicable"
  }
}`;

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
        }
      );

      const content = response.data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse Claude response');
    } catch (error: any) {
      console.error('Claude Vision error:', error.response?.data || error.message);
      throw new Error('Claude analysis failed');
    }
  }

  /**
   * Analyze with Google Cloud Vision
   */
  private async analyzeWithGoogle(base64Image: string): Promise<VisionAnalysisResult> {
    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'IMAGE_PROPERTIES' },
                { type: 'OBJECT_LOCALIZATION' },
                { type: 'WEB_DETECTION' },
              ],
            },
          ],
        }
      );

      const result = response.data.responses[0];

      // Extract dominant colors
      const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
      const dominantColor = colors[0]?.color || { red: 128, green: 128, blue: 128 };
      const colorName = this.rgbToColorName(dominantColor.red, dominantColor.green, dominantColor.blue);

      // Extract labels
      const labels = result.labelAnnotations || [];
      const clothingLabels = labels.filter((l: any) =>
        ['clothing', 'fashion', 'apparel', 'wear'].some(keyword =>
          l.description.toLowerCase().includes(keyword)
        )
      );

      // Determine category
      const category = this.determineCategoryFromLabels(labels);
      const itemType = clothingLabels[0]?.description || category;

      return {
        itemType,
        color: colorName,
        pattern: this.detectPattern(labels),
        category,
        confidence: clothingLabels[0]?.score || 0.8,
        description: `${colorName} ${category}`,
        styleNotes: labels.slice(0, 3).map((l: any) => l.description),
        detectedFeatures: {},
      };
    } catch (error: any) {
      console.error('Google Vision error:', error.response?.data || error.message);
      throw new Error('Google Vision analysis failed');
    }
  }

  /**
   * Helper: Convert RGB to color name
   */
  private rgbToColorName(r: number, g: number, b: number): string {
    const colorMap: { [key: string]: { r: number; g: number; b: number } } = {
      Black: { r: 0, g: 0, b: 0 },
      White: { r: 255, g: 255, b: 255 },
      Red: { r: 255, g: 0, b: 0 },
      Blue: { r: 0, g: 0, b: 255 },
      Green: { r: 0, g: 255, b: 0 },
      Yellow: { r: 255, g: 255, b: 0 },
      Orange: { r: 255, g: 165, b: 0 },
      Purple: { r: 128, g: 0, b: 128 },
      Pink: { r: 255, g: 192, b: 203 },
      Brown: { r: 165, g: 42, b: 42 },
      Gray: { r: 128, g: 128, b: 128 },
      Navy: { r: 0, g: 0, b: 128 },
    };

    let minDistance = Infinity;
    let closestColor = 'Unknown';

    for (const [name, rgb] of Object.entries(colorMap)) {
      const distance = Math.sqrt(
        Math.pow(r - rgb.r, 2) + Math.pow(g - rgb.g, 2) + Math.pow(b - rgb.b, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = name;
      }
    }

    return closestColor;
  }

  /**
   * Helper: Determine category from labels
   */
  private determineCategoryFromLabels(labels: any[]): string {
    const categoryKeywords = {
      Jacket: ['jacket', 'coat', 'blazer', 'hoodie'],
      Jeans: ['jeans', 'denim'],
      Shirt: ['shirt', 'blouse', 'top'],
      'T-Shirt': ['t-shirt', 'tee'],
      Shoes: ['shoes', 'sneakers', 'boots', 'footwear'],
      Dress: ['dress', 'gown'],
      Pants: ['pants', 'trousers'],
      Shorts: ['shorts'],
      Skirt: ['skirt'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (labels.some((l: any) =>
        keywords.some(keyword => l.description.toLowerCase().includes(keyword))
      )) {
        return category;
      }
    }

    return 'Clothing';
  }

  /**
   * Helper: Detect pattern from labels
   */
  private detectPattern(labels: any[]): string {
    const patterns = ['striped', 'floral', 'plaid', 'checkered', 'dotted', 'printed'];

    for (const pattern of patterns) {
      if (labels.some((l: any) => l.description.toLowerCase().includes(pattern))) {
        return pattern.charAt(0).toUpperCase() + pattern.slice(1);
      }
    }

    return 'Plain';
  }
}

export const visionAI = new VisionAIService();
