import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Badge } from '../components/ui/Badge';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/Colors';
import { fashionApi } from '../lib/api/fashion';
import { useFashionStore } from '../lib/stores/fashionStore';
import type { OutfitAnalysis, RecommendationResponse, VirtualTryonJob } from '../lib/types/fashion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - Spacing.md * 2;

export default function FashionTryonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<OutfitAnalysis | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryonResult, setTryonResult] = useState<VirtualTryonJob | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const { incrementStat } = useFashionStore();

  // Animated values for swipe comparison
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(1);

  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
    try {
      const data = await fashionApi.getAnalysis(analysisId);
      setAnalysis(data);
    } catch (error: any) {
      console.error('Load analysis error:', error);
      Alert.alert('Error', error.error || 'Failed to load analysis');
    }
  };

  const handleTryOnRecommendation = async (recommendation: RecommendationResponse) => {
    setSelectedRecommendation(recommendation);
    setIsProcessing(true);
    setTryonResult(null);

    try {
      // Request virtual try-on
      const job = await fashionApi.requestVirtualTryon(analysisId, recommendation.id);

      // Poll for completion
      const result = await fashionApi.pollVirtualTryon(job.job_id);

      if (result.status === 'completed') {
        setTryonResult(result);
        setShowComparison(true);
        await incrementStat('virtualTryons');
        Alert.alert('Success', 'Virtual try-on complete! Swipe to compare.');
      } else if (result.status === 'failed') {
        Alert.alert('Error', result.error_message || 'Virtual try-on failed');
        setSelectedRecommendation(null);
      }
    } catch (error: any) {
      console.error('Virtual try-on error:', error);
      Alert.alert('Error', error?.error || 'Failed to process virtual try-on');
      setSelectedRecommendation(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const { translationX: tx } = nativeEvent;

      // If swiped more than 30% of image width, toggle
      if (Math.abs(tx) > IMAGE_WIDTH * 0.3) {
        const newOpacity = opacityValue.current === 1 ? 0 : 1;
        opacityValue.current = newOpacity;
        Animated.timing(opacity, {
          toValue: newOpacity,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }

      // Reset position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSaveTryon = async () => {
    if (!tryonResult || !analysis) return;

    try {
      await fashionApi.saveOutfit({
        analysis_id: analysis.analysis_id,
        name: `Virtual Try-On ${new Date().toLocaleDateString()}`,
        description: `Tried on: ${selectedRecommendation?.suggestion_text}`,
        tryon_id: tryonResult.job_id,
      });

      Alert.alert('Success', 'Virtual try-on saved to your wardrobe!');
    } catch (error: any) {
      console.error('Save try-on error:', error);
      Alert.alert('Error', error.error || 'Failed to save virtual try-on');
    }
  };

  const handleReset = () => {
    setSelectedRecommendation(null);
    setTryonResult(null);
    setShowComparison(false);
    translateX.setValue(0);
    opacity.setValue(1);
    opacityValue.current = 1;
  };

  if (!analysis) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Virtual Try-On</Text>
          <Text style={styles.instructionText}>
            {!selectedRecommendation
              ? 'Select a recommendation below to see how it looks on you'
              : showComparison
              ? 'Swipe left or right to compare original vs try-on'
              : 'Processing your virtual try-on...'}
          </Text>
        </Card>

        {/* Image Comparison View */}
        {showComparison && tryonResult?.result ? (
          <Card style={styles.comparisonCard} padding={0}>
            <View style={styles.imageContainer}>
              {/* Try-on Result (on top) */}
              <Animated.View style={[styles.imageWrapper, { opacity }]}>
                <Image
                  source={{ uri: tryonResult.result.tryon_image_url }}
                  style={styles.comparisonImage}
                  resizeMode="cover"
                />
                <View style={styles.imageLabel}>
                  <Text style={styles.imageLabelText}>With Recommendation</Text>
                </View>
              </Animated.View>

              {/* Original Image (underneath) */}
              <View style={[styles.imageWrapper, styles.originalImageWrapper]}>
                <Image
                  source={{ uri: analysis.image_url }}
                  style={styles.comparisonImage}
                  resizeMode="cover"
                />
                <View style={[styles.imageLabel, styles.originalLabel]}>
                  <Text style={styles.imageLabelText}>Original</Text>
                </View>
              </View>

              {/* Swipe Overlay */}
              <PanGestureHandler
                onGestureEvent={handleGestureEvent}
                onHandlerStateChange={handleStateChange}
              >
                <Animated.View
                  style={[
                    styles.swipeOverlay,
                    {
                      transform: [{ translateX }],
                    },
                  ]}
                >
                  <View style={styles.swipeIndicator}>
                    <Text style={styles.swipeText}>← Swipe to Compare →</Text>
                  </View>
                </Animated.View>
              </PanGestureHandler>
            </View>

            {/* Confidence Score */}
            {tryonResult.result.confidence_score && (
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confidence Score</Text>
                <Text style={styles.confidenceValue}>
                  {Math.round(tryonResult.result.confidence_score * 100)}%
                </Text>
              </View>
            )}
          </Card>
        ) : isProcessing ? (
          <Card style={styles.processingCard}>
            <LoadingSpinner message="Creating your virtual try-on..." />
            <Text style={styles.processingText}>
              This may take up to 60 seconds
            </Text>
          </Card>
        ) : (
          <Card style={styles.imageCard} padding={0}>
            <Image
              source={{ uri: analysis.image_url }}
              style={styles.originalImage}
              resizeMode="cover"
            />
          </Card>
        )}

        {/* Selected Recommendation Info */}
        {selectedRecommendation && (
          <Card style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <Badge label={selectedRecommendation.category} variant="secondary" />
              {selectedRecommendation.product_image_url && (
                <Image
                  source={{ uri: selectedRecommendation.product_image_url }}
                  style={styles.productThumb}
                />
              )}
            </View>
            <Text style={styles.selectedTitle}>{selectedRecommendation.suggestion_text}</Text>
            <Text style={styles.selectedReason}>{selectedRecommendation.reasoning || ''}</Text>
          </Card>
        )}

        {/* Action Buttons */}
        {showComparison && (
          <View style={styles.actionButtons}>
            <Button
              title="Save Try-On"
              onPress={handleSaveTryon}
            />
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={handleReset}
            >
              <Text style={styles.outlineButtonText}>Try Another</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recommendations List */}
        {!selectedRecommendation && analysis.recommendations && analysis.recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Select a Recommendation</Text>
            {analysis.recommendations.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={styles.recommendationCard}
                onPress={() => handleTryOnRecommendation(rec)}
              >
                <View style={styles.recommendationHeader}>
                  <Badge label={rec.category} variant="success" />
                  {rec.product_image_url && (
                    <Image
                      source={{ uri: rec.product_image_url }}
                      style={styles.productImage}
                    />
                  )}
                </View>
                <Text style={styles.recommendationTitle}>{rec.suggestion_text}</Text>
                <Text style={styles.recommendationReason}>{rec.reasoning || ''}</Text>
                <View style={styles.tryonButton}>
                  <Text style={styles.tryonButtonText}>Try This On →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </GestureHandlerRootView>
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
  instructionCard: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  instructionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  instructionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  comparisonCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
  },
  imageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  originalImageWrapper: {
    zIndex: 1,
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
  imageLabel: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  originalLabel: {
    backgroundColor: Colors.secondary,
  },
  imageLabelText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.md,
  },
  swipeIndicator: {
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
  },
  swipeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confidenceLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  confidenceValue: {
    ...Typography.h3,
    color: Colors.secondary,
    fontWeight: '700',
  },
  processingCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  processingText: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  imageCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  originalImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
  },
  selectedCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.cream[100],
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  selectedTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  selectedReason: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  actionButtons: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  outlineButton: {
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  outlineButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  recommendationsSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  recommendationCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  recommendationTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  recommendationReason: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  tryonButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  tryonButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
