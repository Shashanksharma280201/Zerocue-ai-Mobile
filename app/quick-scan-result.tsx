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
  ImageBackground,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const prosAnim = useRef(new Animated.Value(0)).current;
  const occasionsAnim = useRef(new Animated.Value(0)).current;
  const tipsAnim = useRef(new Animated.Value(0)).current;
  const productsAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const buttonScale1 = useRef(new Animated.Value(1)).current;
  const buttonScale2 = useRef(new Animated.Value(1)).current;
  const [displayRating, setDisplayRating] = useState(0);

  useEffect(() => {
    analyzeImage();
    configureVirtualTryOn();

    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animated loading dots
    Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
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
      // Staggered entrance animations
      Animated.sequence([
        // Hero section entrance
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        // Content cards staggered entrance
        Animated.stagger(100, [
          Animated.spring(cardsAnim, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(prosAnim, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(occasionsAnim, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(tipsAnim, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(productsAnim, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Rating counter animation with delay
      setTimeout(() => {
        Animated.timing(ratingAnim, {
          toValue: analysis.rating,
          duration: 1500,
          useNativeDriver: false,
        }).start();
      }, 300);

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

  // Animated button press helper
  const animateButtonPress = (animValue: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  // Loading state with fashion colors
  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={{ uri: imageUri }} style={styles.loadingImage} blurRadius={10} />
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <View style={styles.loadingIconContainer}>
                <Ionicons name="scan" size={60} color={Colors.white} />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>
              {isOffline ? 'Analyzing offline...' : 'AI Style Analysis'}
            </Text>
            <Text style={styles.loadingSubtext}>
              Getting personalized recommendations
            </Text>
            <View style={styles.loadingDots}>
              <Animated.View
                style={[
                  styles.loadingDot,
                  {
                    backgroundColor: Colors.fashion.ocean,
                    opacity: dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [{
                      scale: dot1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    }],
                  }
                ]}
              />
              <Animated.View
                style={[
                  styles.loadingDot,
                  {
                    backgroundColor: Colors.fashion.azure,
                    opacity: dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [{
                      scale: dot2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    }],
                  }
                ]}
              />
              <Animated.View
                style={[
                  styles.loadingDot,
                  {
                    backgroundColor: Colors.fashion.skyBlue,
                    opacity: dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [{
                      scale: dot3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    }],
                  }
                ]}
              />
            </View>
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
          {/* Hero Section with Blurred Background */}
          <View style={styles.heroContainer}>
            <ImageBackground
              source={{ uri: imageUri }}
              style={styles.heroBackground}
              blurRadius={20}
            >
              <View style={styles.heroOverlay}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>

                {isOffline && (
                  <View style={styles.offlineBadge}>
                    <Ionicons name="cloud-offline" size={14} color={Colors.white} />
                    <Text style={styles.offlineBadgeText}>Offline</Text>
                  </View>
                )}

                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>{analysis.itemType}</Text>

                  {/* Large Rating Display */}
                  <Animated.View
                    style={{
                      transform: [
                        { scale: pulseAnim },
                        {
                          scale: scaleAnim.interpolate({
                            inputRange: [0.95, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                      opacity: fadeAnim,
                    }}
                  >
                    <View style={styles.heroRatingContainer}>
                      <Text style={styles.heroRating}>{displayRating.toFixed(1)}</Text>
                      <Text style={styles.heroRatingMax}>/10</Text>
                    </View>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.heroStars,
                      {
                        opacity: fadeAnim,
                        transform: [{
                          scale: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        }],
                      },
                    ]}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(analysis.rating / 2) ? 'star' : 'star-outline'}
                        size={28}
                        color={Colors.fashion.skyBlue}
                      />
                    ))}
                  </Animated.View>

                  {/* Quick Info Tags */}
                  <View style={styles.heroTags}>
                    <View style={styles.heroTag}>
                      <Text style={styles.heroTagText}>{analysis.color}</Text>
                    </View>
                    <View style={styles.heroTag}>
                      <Text style={styles.heroTagText}>{analysis.pattern}</Text>
                    </View>
                    <View style={styles.heroTag}>
                      <Text style={styles.heroTagText}>{analysis.category}</Text>
                    </View>
                  </View>

                  {/* Confidence Badge */}
                  <View style={styles.heroConfidence}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.fashion.sage} />
                    <Text style={styles.heroConfidenceText}>
                      {Math.round(analysis.confidence * 100)}% Match
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Content Cards */}
          <View style={styles.content}>
            {/* AI Feedback - Premium Card */}
            <Animated.View
              style={{
                opacity: cardsAnim,
                transform: [{
                  translateY: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }, {
                  scale: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                }],
              }}
            >
              <View style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <View style={styles.aiAvatarContainer}>
                  <Ionicons name="sparkles" size={20} color={Colors.white} />
                </View>
                <View style={styles.feedbackHeaderText}>
                  <Text style={styles.feedbackTitle}>Your Style Assistant</Text>
                  <Text style={styles.feedbackSubtitle}>AI Analysis</Text>
                </View>
              </View>
              <View style={styles.feedbackBubble}>
                <Text style={styles.feedbackText}>{analysis.feedback}</Text>
              </View>
            </View>
            </Animated.View>

            {/* Pros - Clean List */}
            <Animated.View
              style={{
                opacity: prosAnim,
                transform: [{
                  translateY: prosAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }, {
                  scale: prosAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                }],
              }}
            >
            <Card style={styles.prosCard}>
              <Text style={styles.sectionTitle}>Why This Works</Text>
              <View style={styles.prosList}>
                {analysis.pros.map((pro, index) => (
                  <View key={index} style={styles.proItem}>
                    <View style={styles.proIconContainer}>
                      <Ionicons name="checkmark" size={18} color={Colors.white} />
                    </View>
                    <Text style={styles.proText}>{pro}</Text>
                  </View>
                ))}
              </View>
            </Card>
            </Animated.View>

            {/* Occasion Scores - Enhanced Bars */}
            <Animated.View
              style={{
                opacity: occasionsAnim,
                transform: [{
                  translateY: occasionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }, {
                  scale: occasionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                }],
              }}
            >
            <Card style={styles.occasionsCard}>
              <Text style={styles.sectionTitle}>Best For</Text>
              {analysis.occasions.map((occasion, index) => (
                <View key={index} style={styles.occasionItem}>
                  <View style={styles.occasionHeader}>
                    <Text style={styles.occasionLabel}>{occasion.name}</Text>
                    <View style={styles.occasionScoreBadge}>
                      <Text style={styles.occasionScoreText}>{occasion.score}%</Text>
                    </View>
                  </View>
                  <View style={styles.occasionBarContainer}>
                    <View style={styles.occasionBar}>
                      <Animated.View
                        style={[
                          styles.occasionBarFill,
                          {
                            width: occasionsAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', `${occasion.score}%`],
                            }),
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </Card>
            </Animated.View>

            {/* Styling Tips - Numbered List */}
            <Animated.View
              style={{
                opacity: tipsAnim,
                transform: [{
                  translateY: tipsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }, {
                  scale: tipsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                }],
              }}
            >
            <Card style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={24} color={Colors.fashion.skyBlue} />
                <Text style={styles.sectionTitle}>Styling Tips</Text>
              </View>
              {analysis.recommendations.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </Card>
            </Animated.View>

            {/* Matching Products - Grid Layout */}
            {analysis.matchingProducts.length > 0 && (
              <Animated.View
                style={{
                  opacity: productsAnim,
                  transform: [{
                    translateY: productsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  }, {
                    scale: productsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  }],
                }}
              >
              <Card style={styles.matchingCard}>
                <View style={styles.matchingHeader}>
                  <Ionicons name="storefront" size={24} color={Colors.fashion.azure} />
                  <Text style={styles.sectionTitle}>Shop Similar Styles</Text>
                </View>
                <Text style={styles.matchingSubtitle}>
                  Complete your look with these items
                </Text>
                <View style={styles.productsGrid}>
                  {analysis.matchingProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/product/${product.id}`);
                      }}
                      activeOpacity={0.9}
                    >
                      <View style={styles.productImageContainer}>
                        <Ionicons name="shirt" size={40} color={Colors.textLight} />
                      </View>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productPrice}>Rs. {product.mrp}</Text>
                      <TouchableOpacity
                        style={styles.quickAddButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleAddToCart(product);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cart" size={16} color={Colors.white} />
                        <Text style={styles.quickAddText}>Add</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
              </Animated.View>
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

            {/* Action Buttons - Premium Style */}
            <View style={styles.actionButtons}>
              <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    isGeneratingTryOn && styles.primaryActionButtonDisabled,
                  ]}
                  onPress={() => animateButtonPress(buttonScale1, handleTryOn)}
                  disabled={isGeneratingTryOn}
                  activeOpacity={1}
                >
                  <Ionicons name="camera" size={20} color={Colors.white} />
                  <Text style={styles.primaryActionText}>
                    {isGeneratingTryOn ? 'Generating...' : 'Try On Virtually'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => animateButtonPress(buttonScale2, handleScanAnother)}
                  disabled={isGeneratingTryOn}
                  activeOpacity={1}
                >
                  <Ionicons name="scan" size={20} color={Colors.fashion.azure} />
                  <Text style={styles.secondaryActionText}>Scan Another Item</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={{ height: 40 }} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fashion.softGray,
  },

  // Loading State - Fashion Colors
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.fashion.charcoal,
  },
  loadingImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 144, 226, 0.92)', // Ocean blue overlay
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  loadingSubtext: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Hero Section - No Gradient
  heroContainer: {
    height: SCREEN_HEIGHT * 0.5,
    width: SCREEN_WIDTH,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 144, 226, 0.88)', // Ocean blue overlay
    padding: Spacing.lg,
    justifyContent: 'center',
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
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  offlineBadge: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.fashion.skyBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  offlineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  heroContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroRatingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.sm,
  },
  heroRating: {
    fontSize: 72,
    fontWeight: '900',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroRatingMax: {
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  heroStars: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  heroTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  heroTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  heroConfidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(149, 185, 156, 0.3)', // Sage with transparency
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  heroConfidenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },

  // Content Section
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  content: {
    marginTop: -Spacing.xl,
    paddingHorizontal: Spacing.md,
  },

  // Feedback Card - Premium
  feedbackCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
    shadowColor: Colors.fashion.ocean,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  aiAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.fashion.ocean,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackHeaderText: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.fashion.charcoal,
    marginBottom: 2,
  },
  feedbackSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.fashion.azure,
  },
  feedbackBubble: {
    backgroundColor: Colors.fashion.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.fashion.charcoal,
  },

  // Pros Card
  prosCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.fashion.charcoal,
    marginBottom: Spacing.md,
  },
  prosList: {
    gap: Spacing.md,
  },
  proItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  proIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.fashion.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  proText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.fashion.charcoal,
  },

  // Occasions Card
  occasionsCard: {
    marginBottom: Spacing.md,
  },
  occasionItem: {
    marginBottom: Spacing.md,
  },
  occasionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  occasionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.fashion.charcoal,
  },
  occasionScoreBadge: {
    backgroundColor: Colors.fashion.azure,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  occasionScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  occasionBarContainer: {
    marginTop: Spacing.xs,
  },
  occasionBar: {
    height: 12,
    backgroundColor: Colors.fashion.softGray,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  occasionBarFill: {
    height: '100%',
    backgroundColor: Colors.fashion.ocean,
    borderRadius: BorderRadius.md,
  },

  // Tips Card
  tipsCard: {
    marginBottom: Spacing.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.fashion.azure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.fashion.charcoal,
    marginTop: 4,
  },

  // Products Grid
  matchingCard: {
    marginBottom: Spacing.md,
  },
  matchingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  matchingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  productCard: {
    width: (SCREEN_WIDTH - Spacing.md * 4) / 2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.small,
    shadowColor: Colors.fashion.charcoal,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.fashion.softGray,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.fashion.charcoal,
    marginBottom: 4,
    height: 40,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.fashion.ocean,
    marginBottom: Spacing.sm,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.fashion.azure,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.fashion.azure,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  quickAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },

  // Try-On Card
  tryOnCard: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  tryOnImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  tryOnCaption: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Action Buttons - Solid Colors
  actionButtons: {
    gap: Spacing.md,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.fashion.ocean,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xxl,
    ...Shadows.medium,
    shadowColor: Colors.fashion.ocean,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryActionButtonDisabled: {
    opacity: 0.6,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xxl,
    borderWidth: 2,
    borderColor: Colors.fashion.azure,
    ...Shadows.small,
    shadowColor: Colors.fashion.azure,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.fashion.azure,
    letterSpacing: 0.3,
  },
});
