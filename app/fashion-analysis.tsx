import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/Colors';
import { fashionApi } from '../lib/api/fashion';
import { useFashionStore } from '../lib/stores/fashionStore';
import { useProducts } from '../lib/hooks';
import type { OutfitAnalysis } from '../lib/types/fashion';

export default function FashionAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<OutfitAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<Record<string, any>>({});

  const { incrementStat, addRecentAnalysis } = useFashionStore();
  const { data: products } = useProducts();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const ratingAnim = useRef(new Animated.Value(0)).current;
  const [displayRating, setDisplayRating] = useState(0);

  const loadAnalysis = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fashionApi.getAnalysis(analysisId);
      setAnalysis(data);
      await addRecentAnalysis(data);

      // Trigger haptic feedback on successful load
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Load analysis error:', error);
      Alert.alert('Error', error.error || 'Failed to load analysis');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      loadAnalysis();
    }
  }, [analysisId]);

  // Trigger entrance animations when analysis loads
  useEffect(() => {
    if (analysis) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      ratingAnim.setValue(0);
      setDisplayRating(0);

      // Parallel animations for smooth entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Rating counter animation - using formality score (0-1) converted to 0-10
      const ratingValue = analysis.outfit_analysis.formality_score
        ? analysis.outfit_analysis.formality_score * 10
        : 7.5; // Default value if no score
      Animated.timing(ratingAnim, {
        toValue: ratingValue,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Listen to rating animation and update display
      const listenerId = ratingAnim.addListener(({ value }) => {
        setDisplayRating(value);
      });

      return () => {
        ratingAnim.removeListener(listenerId);
      };
    }
  }, [analysis]);

  // Match Fashion AI recommendations with catalog products
  useEffect(() => {
    if (!analysis?.recommendations || !products) return;

    const matches: Record<string, any> = {};

    analysis.recommendations.forEach((rec) => {
      // Try to find matching products based on category
      const category = rec.category.toLowerCase();
      const matchingProduct = products.find((product) => {
        const productName = product.name.toLowerCase();
        const productCategory = product.category?.toLowerCase() || '';

        // Match if recommendation category appears in product name or category
        return productName.includes(category) ||
               productCategory.includes(category) ||
               category.includes(productName) ||
               category.includes(productCategory);
      });

      if (matchingProduct) {
        matches[rec.id] = matchingProduct;
      }
    });

    setMatchedProducts(matches);
  }, [analysis, products]);

  const handleSaveOutfit = async () => {
    if (!analysis) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await fashionApi.saveOutfit({
        analysis_id: analysis.analysis_id,
        name: `Outfit ${new Date().toLocaleDateString()}`,
        description: analysis.outfit_analysis.overall_feedback,
      });

      await incrementStat('savedOutfits');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Outfit saved to your wardrobe!');
    } catch (error: any) {
      console.error('Save outfit error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.error || 'Failed to save outfit');
    }
  };

  const handleTryOn = () => {
    if (!analysis) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/fashion-tryon',
      params: { analysisId: analysis.analysis_id },
    });
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading your analysis..." />;
  }

  if (!analysis) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Analysis not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.md }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadAnalysis(true)}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Outfit Image */}
          <Card style={styles.imageCard}>
            <Image
              source={{ uri: analysis.image_url }}
              style={styles.outfitImage}
              resizeMode="cover"
            />
          </Card>

          {/* Style Rating */}
          <Card style={styles.ratingCard}>
            <Text style={styles.sectionTitle}>Style Rating</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingScore}>{displayRating.toFixed(1)}</Text>
              <Text style={styles.ratingMax}>/10</Text>
            </View>
            {analysis.outfit_analysis.overall_feedback && (
              <Text style={styles.assessmentText}>{analysis.outfit_analysis.overall_feedback}</Text>
            )}
          </Card>

        {/* Detected Items */}
        {analysis.outfit_analysis.items && analysis.outfit_analysis.items.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>What We Detected</Text>
            <View style={styles.itemsContainer}>
              {analysis.outfit_analysis.items.map((item, idx) => (
                <View key={idx} style={styles.itemChip}>
                  <Text style={styles.itemText}>
                    {item.color.join(', ')} {item.type}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Occasion Suitability */}
        {analysis.outfit_analysis.occasion_suitability && Object.keys(analysis.outfit_analysis.occasion_suitability).length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Perfect For</Text>
            <View style={styles.badgeRow}>
              {Object.entries(analysis.outfit_analysis.occasion_suitability).map(([occasion, score], idx) => (
                <Badge
                  key={idx}
                  label={`${occasion} (${Math.round(score * 100)}%)`}
                  variant="success"
                />
              ))}
            </View>
          </Card>
        )}

        {/* Style Feedback (Strengths & Improvements) */}
        {((analysis.outfit_analysis.strengths && analysis.outfit_analysis.strengths.length > 0) ||
          (analysis.outfit_analysis.improvements && analysis.outfit_analysis.improvements.length > 0)) && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Style Feedback</Text>
            {analysis.outfit_analysis.strengths?.map((strength, idx) => (
              <View key={`strength-${idx}`} style={styles.feedbackItem}>
                <View style={styles.feedbackIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackCategory}>Strength</Text>
                  <Text style={styles.feedbackText}>{strength}</Text>
                </View>
              </View>
            ))}
            {analysis.outfit_analysis.improvements?.map((improvement, idx) => (
              <View key={`improvement-${idx}`} style={styles.feedbackItem}>
                <View style={styles.feedbackIconContainer}>
                  <Ionicons
                    name="bulb"
                    size={24}
                    color={Colors.warning}
                  />
                </View>
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackCategory}>Suggestion</Text>
                  <Text style={styles.feedbackText}>{improvement}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Recommended Improvements</Text>
            {analysis.recommendations.map((rec) => {
              const matchedProduct = matchedProducts[rec.id];
              return (
                <View key={rec.id} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <Badge label={rec.category} variant="secondary" />
                    {rec.product_image_url && (
                      <Image
                        source={{ uri: rec.product_image_url }}
                        style={styles.productImage}
                      />
                    )}
                  </View>
                  <Text style={styles.recommendationTitle}>{rec.suggestion_text}</Text>
                  <Text style={styles.recommendationReason}>{rec.reasoning || ''}</Text>

                  {/* Show matched product from catalog */}
                  {matchedProduct && (
                    <View style={styles.matchedProductContainer}>
                      <View style={styles.matchedProductHeader}>
                        <Ionicons name="storefront" size={16} color={Colors.success} />
                        <Text style={styles.matchedProductLabel}>Available in Store</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.matchedProductCard}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/product/${matchedProduct.id}`);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.matchedProductInfo}>
                          <Text style={styles.matchedProductName}>{matchedProduct.name}</Text>
                          <Text style={styles.matchedProductPrice}>₹{matchedProduct.mrp}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.shopNowButton}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push(`/product/${matchedProduct.id}`);
                          }}
                        >
                          <Text style={styles.shopNowText}>Shop Now</Text>
                          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Save to Wardrobe"
              onPress={handleSaveOutfit}
            />
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <Button
                title="Try On Recommendations"
                onPress={handleTryOn}
                style={{ backgroundColor: Colors.secondary }}
              />
            )}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Text style={styles.backButtonText}>Analyze Another</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  imageCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
    padding: 0,
  },
  outfitImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
  },
  ratingCard: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  ratingScore: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.secondary,
  },
  ratingMax: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textLight,
    marginLeft: Spacing.xs,
  },
  assessmentText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  card: {
    marginBottom: Spacing.md,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  itemChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  itemText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  feedbackItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  feedbackIconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackCategory: {
    ...Typography.button,
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  feedbackText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  recommendationCard: {
    padding: Spacing.md,
    backgroundColor: Colors.cream[100],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
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
  },
  matchedProductContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  matchedProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  matchedProductLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    textTransform: 'uppercase',
  },
  matchedProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchedProductInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  matchedProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  matchedProductPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  shopNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  actionButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  backButton: {
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
});
