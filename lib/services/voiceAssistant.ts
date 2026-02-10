/**
 * Voice Assistant Service
 * Handles speech recognition and text-to-speech for fashion queries
 */

import * as Speech from 'expo-speech';
import { fashionApi } from '../api/fashion';

// Graceful fallback for Expo Go - speech recognition requires development build
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

try {
  const speechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
  console.log('✅ Speech recognition module loaded');
} catch (error) {
  console.warn('⚠️ Speech recognition not available in Expo Go - requires development build');
  // Provide dummy hook that does nothing
  useSpeechRecognitionEvent = () => () => {};
}

export interface VoiceQuery {
  transcript: string;
  confidence: number;
  timestamp: number;
}

export interface VoiceResponse {
  answer: string;
  relatedItems?: string[];
  confidence: number;
}

class VoiceAssistantService {
  private isListening: boolean = false;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  private async checkSupport() {
    if (!ExpoSpeechRecognitionModule) {
      this.isSupported = false;
      console.warn('⚠️ Voice recognition module not loaded');
      return;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.getStateAsync();
      this.isSupported = result.state !== 'unavailable';
      console.log('✅ Voice recognition support:', this.isSupported);
    } catch (error) {
      console.warn('Voice recognition not available:', error);
      this.isSupported = false;
    }
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!ExpoSpeechRecognitionModule) {
      return false;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      const granted = result.granted;

      if (!granted) {
        console.warn('Microphone permission denied');
      }

      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Voice recognition not supported on this device');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Microphone permission required');
    }

    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
      });

      this.isListening = true;
      console.log('🎤 Started listening...');
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    if (!this.isListening || !ExpoSpeechRecognitionModule) {
      return;
    }

    try {
      await ExpoSpeechRecognitionModule.stop();
      this.isListening = false;
      console.log('🛑 Stopped listening');
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  /**
   * Cancel ongoing recognition
   */
  async cancel(): Promise<void> {
    if (!ExpoSpeechRecognitionModule) {
      return;
    }

    try {
      await ExpoSpeechRecognitionModule.abort();
      this.isListening = false;
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  }

  /**
   * Process voice query with fashion AI
   */
  async processFashionQuery(transcript: string): Promise<VoiceResponse> {
    try {
      console.log('🤖 Processing fashion query:', transcript);

      // Call backend API with voice query
      const response = await fashionApi.askFashionQuestion(transcript);

      return {
        answer: response.answer,
        relatedItems: response.related_items,
        confidence: response.confidence || 0.9,
      };
    } catch (error) {
      console.error('Failed to process query:', error);

      // Fallback response
      return {
        answer: this.getGenericFashionResponse(transcript),
        confidence: 0.5,
      };
    }
  }

  /**
   * Speak text response
   */
  async speak(text: string, options?: { rate?: number; pitch?: number }): Promise<void> {
    try {
      // Stop any ongoing speech
      await Speech.stop();

      const speechOptions = {
        language: 'en-US',
        rate: options?.rate || 0.9,
        pitch: options?.pitch || 1.0,
      };

      console.log('🔊 Speaking:', text.substring(0, 50) + '...');
      Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  /**
   * Check if speech is currently playing
   */
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }

  /**
   * Get generic fashion response for common queries
   */
  private getGenericFashionResponse(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('color') || queryLower.includes('colour')) {
      return 'For color coordination, try complementary colors like blue with orange, or analogous colors like blue with green. Neutrals like black, white, and gray work with almost everything!';
    }

    if (queryLower.includes('style') || queryLower.includes('wear')) {
      return 'Great question! The key to good style is wearing clothes that fit well and make you feel confident. Start with basics like well-fitted jeans, a white shirt, and comfortable shoes, then build from there.';
    }

    if (queryLower.includes('occasion') || queryLower.includes('event')) {
      return 'For casual events, go with comfortable yet put-together pieces. For formal occasions, opt for classic, well-tailored items. When in doubt, slightly overdressed is better than underdressed!';
    }

    if (queryLower.includes('match') || queryLower.includes('go with')) {
      return 'To match clothes well, consider the color wheel, patterns, and formality level. Neutral colors are versatile. For patterns, mix different scales - like a small print with a larger one.';
    }

    return "I'm here to help with your fashion questions! Try scanning an item with the camera, or ask me about colors, styling tips, or what to wear for different occasions.";
  }

  /**
   * Check if voice recognition is available
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Get current listening state
   */
  getIsListening(): boolean {
    return this.isListening;
  }
}

// Export singleton instance
export const voiceAssistant = new VoiceAssistantService();

// Export hook for React components
export { useSpeechRecognitionEvent };
