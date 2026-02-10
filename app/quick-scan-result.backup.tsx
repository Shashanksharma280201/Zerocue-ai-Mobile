import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/Colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useProducts } from '../lib/hooks';
import { useCartStore } from '../lib/stores/cartStore';
import { quickScanAI, ProductAnalysis } from '../lib/services/quickScanAI';
import { virtualTryOn } from '../lib/services/virtualTryOn';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function QuickScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const isOffline = params.offline === 'true';

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string | null>(null);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);
  const { data: products } = useProducts();
  const { addItem } = useCartStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const ratingAnim = useRef(new Animated.Value(0)).current;
  const [displayRating, setDisplayRating] = useState(0);

  useEffect(() => {
    analyzeImage();
    configureVirtualTryOn();
  }, []);

  const configureVirtualTryOn = () => {
    const provider = process.env.EXPO_PUBLIC_TRYON_PROVIDER as any;
    const apiKey = process.env.EXPO_PUBLIC_TRYON_API_KEY;
    const baseUrl = process.env.EXPO_PUBLIC_TRYON_BASE_URL;

    if (provider && apiKey) {
      virtualTryOn.configure(provider, apiKey, baseUrl);
      console.log(`Virtual try-on configured with provider: ${provider}`);
    } else {
      console.warn('Virtual try-on not configured');
    }
  };

  useEffect(() => {
    if (analysis) {
      // Entrance animations
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

      // Rating counter animation
      Animated.timing(ratingAnim, {
        toValue: analysis.rating,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      const listenerId = ratingAnim.addListener(({ value }) => {
        setDisplayRating(value);
      });

      return () => {
        ratingAnim.removeListener(listenerId);
      };
    }
  }, [analysis]);

  const analyzeImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Call the AI service for analysis
      const result = await quickScanAI.analyzeProduct(imageUri, products || []);

      // Map matching product IDs to actual product objects
      const matchedProducts = result.matchingProducts
        .map((productId) => products?.find((p) => p.id === productId))
        .filter(Boolean);

      // Set analysis with matched products
      setAnalysis({
        ...result,
        matchingProducts: matchedProducts as any[],
      });

      setIsAnalyzing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Analysis error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Analysis Failed',
        'Failed to analyze the product. Please try again.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          { text: 'Retry', onPress: () => analyzeImage() },
        ]
      );
      setIsAnalyzing(false);
    }
  };

  const handleAddToCart = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(product, 1);
    Alert.alert(
      'Added to Cart',
      `${product.name} has been added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => router.push('/(tabs)/cart'),
        },
      ]
    );
  };

  const handleTryOn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if virtual try-on is configured
    if (!virtualTryOn.isConfigured()) {
      Alert.alert(
        'Virtual Try-On Not Available',
        'Virtual try-on is not configured. Please set up the API key in environment settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Request permission to access photo library for user's photo
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to select your photo for virtual try-on.'
        );
        return;
      }

      // Ask user to select their photo
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const personImageUri = result.assets[0].uri;

      // Show loading
      setIsGeneratingTryOn(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Generate try-on
      const tryOnResult = await virtualTryOn.generateTryOn({
        personImageUri,
        garmentImageUri: imageUri,
        category: analysis ? virtualTryOn.mapCategoryToTryOn(analysis.category) : undefined,
      });

      setTryOnImageUrl(tryOnResult.tryOnImageUrl);
      setIsGeneratingTryOn(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Virtual Try-On Ready',
        `Generated in ${(tryOnResult.processingTime / 1000).toFixed(1)}s. Check the image below!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Virtual try-on error:', error);
      setIsGeneratingTryOn(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Try-On Failed',
        error.message || 'Failed to generate virtual try-on. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleScanAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={{ uri: imageUri }} style={styles.loadingImage} />
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="scan" size={60} color={Colors.white} />
            </Animated.View>
            <Text style={styles.loadingText}>
              {isOffline ? 'Analyzing offline...' : 'Analyzing with AI...'}
            </Text>
            <Text style={styles.loadingSubtext}>
              Getting personalized recommendations
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header with Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            {isOffline && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline" size={14} color={Colors.white} />
                <Text style={styles.offlineBadgeText}>Offline Analysis</Text>
              </View>
            )}
          </View>

          {/* Detected Item */}
          <Card style={styles.detectedCard}>
            <View style={styles.detectedHeader}>
              <View>
                <Text style={styles.detectedType}>{analysis.itemType}</Text>
                <Text style={styles.detectedDetails}>
                  {analysis.color} • {analysis.pattern}
                </Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(analysis.confidence * 100)}% match
                </Text>
              </View>
            </View>
          </Card>

          {/* Rating Card */}
          <Card style={styles.ratingCard}>
            <Text style={styles.sectionTitle}>Style Rating</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingScore}>{displayRating.toFixed(1)}</Text>
              <Text style={styles.ratingMax}>/10</Text>
            </View>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(analysis.rating / 2) ? 'star' : 'star-outline'}
                  size={24}
                  color={Colors.warning}
                />
              ))}
            </View>
          </Card>

          {/* AI Feedback */}
          <Card style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primary} />
              <Text style={styles.feedbackTitle}>Your Style Assistant Says</Text>
            </View>
            <Text style={styles.feedbackText}>{analysis.feedback}</Text>
          </Card>

          {/* Pros */}
          <Card style={styles.prosCard}>
            <Text style={styles.sectionTitle}>Why This Works</Text>
            {analysis.pros.map((pro, index) => (
              <View key={index} style={styles.proItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.proText}>{pro}</Text>
              </View>
            ))}
          </Card>

          {/* Occasion Scores */}
          <Card style={styles.occasionsCard}>
            <Text style={styles.sectionTitle}>Best For</Text>
            {analysis.occasions.map((occasion, index) => (
              <View key={index} style={styles.occasionItem}>
                <View style={styles.occasionLabelContainer}>
                  <Text style={styles.occasionLabel}>{occasion.name}</Text>
                  <Text style={styles.occasionScore}>{occasion.score}%</Text>
                </View>
                <View style={styles.occasionBar}>
                  <View
                    style={[
                      styles.occasionBarFill,
                      { width: `${occasion.score}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Card>

          {/* Styling Tips */}
          <Card style={styles.tipsCard}>
            <Text style={styles.sectionTitle}>Styling Tips</Text>
            {analysis.recommendations.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipBullet}>
                  <Text style={styles.tipBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Card>

          {/* Matching Products */}
          {analysis.matchingProducts.length > 0 && (
            <Card style={styles.matchingCard}>
              <View style={styles.matchingHeader}>
                <Ionicons name="storefront" size={24} color={Colors.secondary} />
                <Text style={styles.matchingTitle}>Available in Store</Text>
              </View>
              <Text style={styles.matchingSubtitle}>
                Complete your look with these items
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.matchingScroll}
              >
                {analysis.matchingProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.matchingProduct}
                    onPress={() => router.push(`/product/${product.id}`)}
                  >
                    <View style={styles.matchingProductImage}>
                      <Ionicons name="shirt" size={40} color={Colors.textLight} />
                    </View>
                    <Text style={styles.matchingProductName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.matchingProductPrice}>
                      Rs. {product.mrp}
                    </Text>
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <Ionicons name="cart" size={16} color={Colors.white} />
                      <Text style={styles.addToCartText}>Add</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>
          )}

          {/* Virtual Try-On Result */}
          {tryOnImageUrl && (
            <Card style={styles.tryOnCard}>
              <Text style={styles.sectionTitle}>Your Virtual Try-On</Text>
              <Image source={{ uri: tryOnImageUrl }} style={styles.tryOnImage} />
              <Text style={styles.tryOnCaption}>
                See how this {analysis?.itemType} looks on you
              </Text>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title={isGeneratingTryOn ? 'Generating Try-On...' : 'Try On Virtually'}
              onPress={handleTryOn}
              style={styles.actionButton}
              disabled={isGeneratingTryOn}
            />
            <TouchableOpacity
              style={styles.scanAnotherButton}
              onPress={handleScanAnother}
              disabled={isGeneratingTryOn}
            >
              <Ionicons name="scan" size={20} color={Colors.primary} />
              <Text style={styles.scanAnotherText}>Scan Another Item</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.h3,
    color: Colors.white,
  },
  loadingSubtext: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBadge: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  offlineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  detectedCard: {
    margin: Spacing.md,
    marginTop: -30,
    ...Shadows.large,
  },
  detectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectedType: {
    ...Typography.h3,
    color: Colors.text,
  },
  detectedDetails: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  confidenceBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  ratingCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  ratingScore: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
  },
  ratingMax: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  feedbackCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.cream[100],
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  feedbackTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  feedbackText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  prosCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  proItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  proText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  occasionsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  occasionItem: {
    marginBottom: Spacing.md,
  },
  occasionLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  occasionLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  occasionScore: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  occasionBar: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  occasionBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  tipsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  tipText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  matchingCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  matchingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  matchingTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  matchingSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  matchingScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  matchingProduct: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.small,
  },
  matchingProductImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  matchingProductName: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
    height: 36,
  },
  matchingProductPrice: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  tryOnCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  tryOnImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  tryOnCaption: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    marginHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    backgroundColor: Colors.secondary,
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  scanAnotherText: {
    ...Typography.button,
    color: Colors.primary,
  },
});
