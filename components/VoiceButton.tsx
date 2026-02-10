/**
 * Voice Button Component
 * Floating microphone button for voice fashion queries
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voiceAssistant } from '../lib/services/voiceAssistant';
import { Colors, Spacing, Typography } from '../constants/Colors';

// Import speech recognition hook with fallback
let useSpeechRecognitionEvent: any = () => () => {};
try {
  const serviceModule = require('../lib/services/voiceAssistant');
  useSpeechRecognitionEvent = serviceModule.useSpeechRecognitionEvent || (() => () => {});
} catch (error) {
  console.warn('Speech recognition hook not available');
}

interface VoiceButtonProps {
  onResult?: (transcript: string, answer: string) => void;
}

export default function VoiceButton({ onResult }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const pulseAnim = useState(new Animated.Value(1))[0];

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Listen for speech recognition events
  useSpeechRecognitionEvent('start', () => {
    console.log('🎤 Speech recognition started');
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('🛑 Speech recognition ended');
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', async (event) => {
    const results = event.results;
    if (results && results.length > 0) {
      const transcriptText = results[0]?.transcript || '';
      console.log('📝 Transcript:', transcriptText);

      if (transcriptText.trim()) {
        setTranscript(transcriptText);
        setIsProcessing(true);
        setShowModal(true);

        try {
          // Process the query with fashion AI
          const response = await voiceAssistant.processFashionQuery(transcriptText);
          setAnswer(response.answer);

          // Speak the answer
          await voiceAssistant.speak(response.answer);

          // Notify parent
          onResult?.(transcriptText, response.answer);
        } catch (error) {
          console.error('Error processing query:', error);
          setError('Sorry, I couldn\'t process that. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    setError('Sorry, I couldn\'t hear that clearly. Please try again.');
    setIsListening(false);
    setShowModal(false);
  });

  const handlePress = async () => {
    try {
      setError('');
      setTranscript('');
      setAnswer('');

      if (!voiceAssistant.isAvailable()) {
        setError('Voice recognition requires a development build. It\'s not available in Expo Go. Please use the camera scanner instead.');
        setShowModal(true);
        return;
      }

      if (isListening) {
        // Stop listening
        await voiceAssistant.stopListening();
      } else {
        // Start listening
        setShowModal(true);
        await voiceAssistant.startListening();
      }
    } catch (error: any) {
      console.error('Voice button error:', error);
      setError(error.message || 'Failed to start voice recognition');
      setShowModal(true);
    }
  };

  const closeModal = async () => {
    await voiceAssistant.stopListening();
    await voiceAssistant.stopSpeaking();
    setShowModal(false);
    setIsListening(false);
  };

  return (
    <>
      {/* Floating Voice Button */}
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.button,
            isListening && styles.buttonListening,
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={28}
            color={Colors.white}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Voice Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* Listening State */}
            {isListening && (
              <View style={styles.listeningContainer}>
                <View style={styles.micIcon}>
                  <Ionicons name="mic" size={48} color={Colors.fashion.ocean} />
                </View>
                <Text style={styles.listeningText}>Listening...</Text>
                <Text style={styles.hintText}>Ask me anything about fashion!</Text>
              </View>
            )}

            {/* Processing State */}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={Colors.fashion.ocean} />
                <Text style={styles.processingText}>Thinking...</Text>
                {transcript && (
                  <Text style={styles.transcriptText}>"{transcript}"</Text>
                )}
              </View>
            )}

            {/* Answer Display */}
            {!isListening && !isProcessing && answer && (
              <View style={styles.answerContainer}>
                <Ionicons name="chatbubbles" size={40} color={Colors.fashion.ocean} />
                <Text style={styles.questionText}>You asked:</Text>
                <Text style={styles.transcriptText}>"{transcript}"</Text>

                <View style={styles.answerBox}>
                  <Text style={styles.answerText}>{answer}</Text>
                </View>

                <TouchableOpacity
                  style={styles.askAgainButton}
                  onPress={async () => {
                    setTranscript('');
                    setAnswer('');
                    await voiceAssistant.startListening();
                  }}
                >
                  <Ionicons name="mic" size={20} color={Colors.white} />
                  <Text style={styles.askAgainText}>Ask Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={40} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={closeModal}>
                  <Text style={styles.retryText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.xl * 2,
    right: Spacing.lg,
    zIndex: 1000,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.fashion.ocean,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonListening: {
    backgroundColor: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },
  listeningContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  micIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.fashion.skyBlue + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  listeningText: {
    ...Typography.h2,
    color: Colors.text,
  },
  hintText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  processingText: {
    ...Typography.h3,
    color: Colors.text,
  },
  transcriptText: {
    ...Typography.body,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  answerContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  questionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  answerBox: {
    backgroundColor: Colors.fashion.softGray,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
    marginTop: Spacing.md,
  },
  answerText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  askAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.fashion.ocean,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    marginTop: Spacing.md,
  },
  askAgainText: {
    ...Typography.button,
    color: Colors.white,
  },
  errorContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    marginTop: Spacing.md,
  },
  retryText: {
    ...Typography.button,
    color: Colors.white,
  },
});
