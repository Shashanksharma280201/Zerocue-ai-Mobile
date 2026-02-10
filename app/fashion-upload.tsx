import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/Colors';
import { imageProcessor } from '../lib/services/imageProcessor';
import { fashionApi } from '../lib/api/fashion';
import { useFashionStore } from '../lib/stores/fashionStore';

const OCCASIONS = [
  { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
  { id: 'work', label: 'Work', icon: 'briefcase-outline' },
  { id: 'formal', label: 'Formal', icon: 'shirt-outline' },
  { id: 'party', label: 'Party', icon: 'sparkles-outline' },
  { id: 'date', label: 'Date', icon: 'heart-outline' },
  { id: 'workout', label: 'Workout', icon: 'barbell-outline' },
];

export default function FashionUploadScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const { setUploadState, incrementStat } = useFashionStore();

  // Animation values
  const imageScaleAnim = useRef(new Animated.Value(0)).current;
  const occasionFadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger animations when image is selected
  useEffect(() => {
    if (imageUri) {
      // Image scale-in animation
      imageScaleAnim.setValue(0);
      Animated.spring(imageScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Occasion selector fade-in
      occasionFadeAnim.setValue(0);
      Animated.timing(occasionFadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }).start();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      occasionFadeAnim.setValue(0);
    }
  }, [imageUri]);

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await imageProcessor.takePhoto();
      if (uri) {
        setImageUri(uri);
      }
    } catch (error: any) {
      console.error('Take photo error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await imageProcessor.pickImage();
      if (uri) {
        setImageUri(uri);
      }
    } catch (error: any) {
      console.error('Pick image error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);
    setUploadState(true, 0);

    try {
      // Validate image
      const validation = await imageProcessor.validateImage(imageUri);
      if (!validation.valid) {
        Alert.alert('Invalid Image', validation.error || 'Please select a valid image');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setUploadState(true, 20);

      // Process image (compress and optimize)
      const processedUri = await imageProcessor.processImage(imageUri);

      setUploadState(true, 40);

      // Upload and analyze
      const analysis = await fashionApi.uploadAndAnalyzeOutfit(
        processedUri,
        selectedOccasion
      );

      setUploadState(true, 100);
      await incrementStat('outfitsAnalyzed');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to analysis screen
      router.push({
        pathname: '/fashion-analysis',
        params: { analysisId: analysis.analysis_id },
      });
    } catch (error: any) {
      console.error('Analyze error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.error || 'Failed to analyze outfit');
    } finally {
      setIsProcessing(false);
      setUploadState(false, 0);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Outfit Analysis</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <Ionicons name="information-circle-outline" size={32} color={Colors.primary} />
          <Text style={styles.instructionTitle}>How it works</Text>
          <Text style={styles.instructionText}>
            1. Take a photo or select from gallery{'\n'}
            2. Choose the occasion (optional){'\n'}
            3. Let our AI analyze your outfit{'\n'}
            4. Get personalized style feedback
          </Text>
        </Card>

        {/* Image Preview */}
        {imageUri ? (
          <Animated.View
            style={{
              transform: [{ scale: imageScaleAnim }],
            }}
          >
            <Card style={styles.imagePreviewCard} padding={0}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setImageUri(null);
                  setSelectedOccasion(undefined);
                }}
              >
                <Ionicons name="close-circle" size={32} color={Colors.error} />
              </TouchableOpacity>
            </Card>
          </Animated.View>
        ) : (
          <Card style={styles.uploadCard}>
            <Ionicons name="cloud-upload-outline" size={64} color={Colors.textLight} />
            <Text style={styles.uploadText}>No image selected</Text>
            <Text style={styles.uploadHint}>
              Take a photo or select from gallery
            </Text>
          </Card>
        )}

        {/* Upload Buttons */}
        {!imageUri && (
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera-outline" size={32} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickImage}
            >
              <Ionicons name="images-outline" size={32} color={Colors.secondary} />
              <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Occasion Selector */}
        {imageUri && (
          <Animated.View
            style={{
              opacity: occasionFadeAnim,
            }}
          >
            <Card style={styles.occasionCard}>
              <Text style={styles.occasionTitle}>Select Occasion (Optional)</Text>
              <View style={styles.occasionGrid}>
                {OCCASIONS.map((occasion) => (
                  <TouchableOpacity
                    key={occasion.id}
                    style={[
                      styles.occasionButton,
                      selectedOccasion === occasion.id && styles.occasionButtonSelected,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedOccasion(occasion.id);
                    }}
                  >
                    <Ionicons
                      name={occasion.icon as any}
                      size={24}
                      color={
                        selectedOccasion === occasion.id
                          ? Colors.white
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.occasionLabel,
                        selectedOccasion === occasion.id && styles.occasionLabelSelected,
                      ]}
                    >
                      {occasion.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Analyze Button */}
        {imageUri && (
          <Button
            title={isProcessing ? 'Analyzing...' : 'Analyze Outfit'}
            onPress={handleAnalyze}
            disabled={isProcessing}
            style={styles.analyzeButton}
          />
        )}

        {isProcessing && (
          <Card style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>
              Analyzing your outfit...{'\n'}
              This may take a few moments
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  instructionCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  instructionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  instructionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  imagePreviewCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
  },
  uploadCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  uploadText: {
    ...Typography.h3,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
  uploadHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  uploadButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  uploadButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  occasionCard: {
    marginBottom: Spacing.lg,
  },
  occasionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  occasionButton: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream[100],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  occasionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  occasionLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  occasionLabelSelected: {
    color: Colors.white,
  },
  analyzeButton: {
    marginBottom: Spacing.md,
  },
  processingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  processingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
