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
  Platform,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useProducts } from '../lib/hooks';
import { useCartStore } from '../lib/stores/cartStore';
import { quickScanAI, ProductAnalysis } from '../lib/services/quickScanAI';
import { virtualTryOn } from '../lib/services/virtualTryOn';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fashion-forward color palette (matching camera screen)
const FashionColors = {
  primary: '#6B3AA0',        // Deep Plum
  primaryLight: '#8B5CF6',   // Electric Violet
  primaryDark: '#4C1D95',    // Royal Purple
  secondary: '#E8B4B8',      // Rose Gold
  accent: '#F472B6',         // Hot Pink
  success: '#95B99C',        // Sage Green
  warning: '#FFC947',        // Golden Yellow
  charcoal: '#1F1F23',       // Rich Charcoal
  gray: {
    50: '#FAF9F7',
    100: '#F5F3F0',
    200: '#E7E5E2',
    300: '#D4D2CE',
    400: '#A8A5A0',
    500: '#6B6966',
    600: '#4A4846',
    700: '#2D2C2A',
  },
  white: '#FFFFFF',
};

interface StyleTag {
  id: string;
  label: string;
  color: string;
}

export default function QuickScanResultImprovedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const autoScanned = params.autoScanned === 'true';

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [showTryOn, setShowTryOn] = useState(false);
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string | null>(null);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);

  const { data: products } = useProducts();
  const { addItem } = useCartStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const ratingAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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
    }
  };

  useEffect(() => {
    if (analysis) {
      // Smooth entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: analysis.rating / 10,
          duration: 1000,
          delay: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [analysis]);

  const analyzeImage = async () => {
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await quickScanAI.analyzeProduct(imageUri, products || []);

      const matchedProducts = result.matchingProducts
        .map((productId) => products?.find((p) => p.id === productId))
        .filter(Boolean);

      setAnalysis({
        ...result,
        matchingProducts: matchedProducts as any[],
      });

      setIsAnalyzing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleTryOn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTryOn(true);

    if (!virtualTryOn.isConfigured()) {
      Alert.alert(
        'Coming Soon',
        'Virtual try-on will be available in the next update!',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Photo Access',
          'We need your photo to show how this looks on you.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Allow', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) return;

      setIsGeneratingTryOn(true);

      const tryOnResult = await virtualTryOn.generateTryOn({
        personImageUri: result.assets[0].uri,
        garmentImageUri: imageUri,
        category: analysis ? virtualTryOn.mapCategoryToTryOn(analysis.category) : undefined,
      });

      setTryOnImageUrl(tryOnResult.tryOnImageUrl);
      setIsGeneratingTryOn(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Try-on error:', error);
      setIsGeneratingTryOn(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAddToCart = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(product, 1);

    // Show subtle notification instead of alert
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getStyleTags = (): StyleTag[] => {
    if (!analysis) return [];
    return [
      { id: '1', label: analysis.category, color: FashionColors.primary },
      { id: '2', label: analysis.color, color: FashionColors.secondary },
      { id: '3', label: analysis.pattern, color: FashionColors.accent },
    ];
  };

  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[FashionColors.primaryDark, FashionColors.primary, FashionColors.primaryLight]}
          style={styles.loadingGradient}
        >
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
            <Ionicons name="sparkles" size={60} color={FashionColors.white} />
          </Animated.View>
          <Text style={styles.loadingText}>AI Fashion Analysis</Text>
          <Text style={styles.loadingSubtext}>Creating your personalized style report...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!analysis) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image with Overlay Info */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUri }} style={styles.heroImage} />

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(31, 31, 35, 0.8)']}
            style={styles.heroGradient}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <BlurView intensity={20} style={styles.blurButton}>
              <Ionicons name="arrow-back" size={24} color={FashionColors.white} />
            </BlurView>
          </TouchableOpacity>

          {/* Auto-Scan Badge */}
          {autoScanned && (
            <View style={styles.autoBadge}>
              <Ionicons name="sparkles" size={14} color={FashionColors.white} />
              <Text style={styles.autoBadgeText}>AI Detected</Text>
            </View>
          )}

          {/* Hero Content */}
          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.itemType}>{analysis.itemType}</Text>
            <View style={styles.styleTags}>
              {getStyleTags().map((tag) => (
                <View
                  key={tag.id}
                  style={[styles.styleTag, { backgroundColor: tag.color + '20' }]}
                >
                  <Text style={[styles.styleTagText, { color: tag.color }]}>
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Floating Score Card */}
        <Animated.View
          style={[
            styles.scoreCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[FashionColors.white, FashionColors.gray[50]]}
            style={styles.scoreGradient}
          >
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>Style Score</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(analysis.confidence * 100)}% match
                </Text>
              </View>
            </View>

            {/* Circular Progress */}
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{analysis.rating.toFixed(1)}</Text>
              <Text style={styles.scoreMax}>/10</Text>
            </View>

            {/* Rating Stars */}
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(analysis.rating / 2) ? 'star' : 'star-outline'}
                  size={20}
                  color={FashionColors.warning}
                />
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {['overview', 'styling', 'shop'].map((section) => (
            <TouchableOpacity
              key={section}
              style={[
                styles.tab,
                activeSection === section && styles.tabActive,
              ]}
              onPress={() => setActiveSection(section)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeSection === section && styles.tabTextActive,
                ]}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Text>
              {activeSection === section && (
                <View style={styles.tabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {activeSection === 'overview' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* AI Feedback Card */}
              <View style={styles.feedbackCard}>
                <LinearGradient
                  colors={[FashionColors.primaryLight + '10', FashionColors.secondary + '10']}
                  style={styles.feedbackGradient}
                >
                  <View style={styles.feedbackHeader}>
                    <View style={styles.aiAvatar}>
                      <Ionicons name="sparkles" size={20} color={FashionColors.primary} />
                    </View>
                    <Text style={styles.feedbackTitle}>Style AI Says</Text>
                  </View>
                  <Text style={styles.feedbackText}>{analysis.feedback}</Text>
                </LinearGradient>
              </View>

              {/* Pros Grid */}
              <Text style={styles.sectionTitle}>Why It Works</Text>
              <View style={styles.prosGrid}>
                {analysis.pros.map((pro, index) => (
                  <View key={index} style={styles.proCard}>
                    <Ionicons name="checkmark-circle" size={18} color={FashionColors.success} />
                    <Text style={styles.proText}>{pro}</Text>
                  </View>
                ))}
              </View>

              {/* Occasions */}
              <Text style={styles.sectionTitle}>Perfect For</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.occasionsScroll}
              >
                {analysis.occasions.map((occasion, index) => (
                  <View
                    key={index}
                    style={[
                      styles.occasionCard,
                      { backgroundColor: occasion.score > 70 ? FashionColors.primary + '15' : FashionColors.gray[100] }
                    ]}
                  >
                    <Text style={styles.occasionScore}>{occasion.score}%</Text>
                    <Text style={styles.occasionName}>{occasion.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {activeSection === 'styling' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.sectionTitle}>Styling Tips</Text>
              {analysis.recommendations.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <LinearGradient
                    colors={[FashionColors.secondary + '15', FashionColors.accent + '10']}
                    style={styles.tipGradient}
                  >
                    <View style={styles.tipNumber}>
                      <Text style={styles.tipNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.tipText}>{tip}</Text>
                  </LinearGradient>
                </View>
              ))}

              {/* Virtual Try-On Section */}
              <TouchableOpacity
                style={styles.tryOnButton}
                onPress={handleTryOn}
                disabled={isGeneratingTryOn}
              >
                <LinearGradient
                  colors={[FashionColors.primary, FashionColors.primaryLight]}
                  style={styles.tryOnGradient}
                >
                  <Ionicons name="body" size={24} color={FashionColors.white} />
                  <Text style={styles.tryOnButtonText}>
                    {isGeneratingTryOn ? 'Generating...' : 'Virtual Try-On'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={FashionColors.white} />
                </LinearGradient>
              </TouchableOpacity>

              {tryOnImageUrl && (
                <View style={styles.tryOnResult}>
                  <Image source={{ uri: tryOnImageUrl }} style={styles.tryOnImage} />
                  <Text style={styles.tryOnCaption}>Your virtual try-on</Text>
                </View>
              )}
            </Animated.View>
          )}

          {activeSection === 'shop' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              {analysis.matchingProducts.length > 0 ? (
                <>
                  <View style={styles.shopHeader}>
                    <Text style={styles.sectionTitle}>Shop Similar</Text>
                    <Text style={styles.shopSubtitle}>
                      {analysis.matchingProducts.length} items found
                    </Text>
                  </View>

                  <FlatList
                    data={analysis.matchingProducts}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.productRow}
                    renderItem={({ item: product }) => (
                      <TouchableOpacity
                        style={styles.productCard}
                        onPress={() => router.push(`/product/${product.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.productImageContainer}>
                          <LinearGradient
                            colors={[FashionColors.gray[100], FashionColors.gray[200]]}
                            style={styles.productImagePlaceholder}
                          >
                            <Ionicons name="shirt" size={40} color={FashionColors.gray[400]} />
                          </LinearGradient>

                          {/* Quick Add Button */}
                          <TouchableOpacity
                            style={styles.quickAddButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                          >
                            <Ionicons name="add" size={20} color={FashionColors.white} />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={2}>
                            {product.name}
                          </Text>
                          <View style={styles.productPricing}>
                            <Text style={styles.productPrice}>₹{product.mrp}</Text>
                            {product.discount > 0 && (
                              <Text style={styles.productDiscount}>{product.discount}% off</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </>
              ) : (
                <View style={styles.noProductsContainer}>
                  <Ionicons name="basket-outline" size={48} color={FashionColors.gray[400]} />
                  <Text style={styles.noProductsText}>No matching products found</Text>
                  <Text style={styles.noProductsSubtext}>
                    We're updating our catalog daily
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.scanAnotherButton}
            onPress={() => router.back()}
          >
            <Ionicons name="scan" size={20} color={FashionColors.primary} />
            <Text style={styles.scanAnotherText}>Scan Another</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social" size={20} color={FashionColors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FashionColors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Loading
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: FashionColors.white,
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },

  // Hero Section
  heroContainer: {
    height: SCREEN_WIDTH * 1.2,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  autoBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FashionColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  autoBadgeText: {
    color: FashionColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  itemType: {
    fontSize: 32,
    fontWeight: '700',
    color: FashionColors.white,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  styleTags: {
    flexDirection: 'row',
    gap: 8,
  },
  styleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  styleTagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Score Card
  scoreCard: {
    marginTop: -60,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: FashionColors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  scoreGradient: {
    padding: 20,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: FashionColors.charcoal,
  },
  confidenceBadge: {
    backgroundColor: FashionColors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: FashionColors.success,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: FashionColors.primary,
  },
  scoreMax: {
    fontSize: 20,
    fontWeight: '500',
    color: FashionColors.gray[500],
    marginLeft: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: FashionColors.gray[100],
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: FashionColors.white,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: FashionColors.gray[500],
  },
  tabTextActive: {
    color: FashionColors.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    backgroundColor: FashionColors.primary,
    borderRadius: 2,
  },

  // Content
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FashionColors.charcoal,
    marginBottom: 15,
  },

  // Feedback Card
  feedbackCard: {
    marginBottom: 25,
    borderRadius: 16,
    overflow: 'hidden',
  },
  feedbackGradient: {
    padding: 20,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FashionColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: FashionColors.charcoal,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    color: FashionColors.gray[600],
  },

  // Pros
  prosGrid: {
    marginBottom: 25,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: FashionColors.success + '10',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  proText: {
    fontSize: 14,
    color: FashionColors.gray[700],
    flex: 1,
  },

  // Occasions
  occasionsScroll: {
    gap: 12,
    paddingBottom: 20,
  },
  occasionCard: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  occasionScore: {
    fontSize: 24,
    fontWeight: '700',
    color: FashionColors.primary,
    marginBottom: 4,
  },
  occasionName: {
    fontSize: 12,
    fontWeight: '500',
    color: FashionColors.gray[600],
  },

  // Styling Tips
  tipCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FashionColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: FashionColors.primary,
  },
  tipText: {
    fontSize: 14,
    color: FashionColors.gray[700],
    flex: 1,
    lineHeight: 20,
  },

  // Try On
  tryOnButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  tryOnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  tryOnButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: FashionColors.white,
  },
  tryOnResult: {
    marginTop: 20,
    alignItems: 'center',
  },
  tryOnImage: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 16,
    marginBottom: 10,
  },
  tryOnCaption: {
    fontSize: 12,
    color: FashionColors.gray[500],
  },

  // Shop Section
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  shopSubtitle: {
    fontSize: 14,
    color: FashionColors.gray[500],
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    backgroundColor: FashionColors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: FashionColors.gray[200],
  },
  productImageContainer: {
    position: 'relative',
  },
  productImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FashionColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: FashionColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: FashionColors.charcoal,
    marginBottom: 6,
    height: 36,
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: FashionColors.primary,
  },
  productDiscount: {
    fontSize: 12,
    color: FashionColors.success,
    fontWeight: '600',
  },

  // No Products
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProductsText: {
    fontSize: 16,
    fontWeight: '600',
    color: FashionColors.gray[600],
    marginTop: 12,
  },
  noProductsSubtext: {
    fontSize: 14,
    color: FashionColors.gray[500],
    marginTop: 4,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: FashionColors.white,
    borderTopWidth: 1,
    borderTopColor: FashionColors.gray[200],
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: FashionColors.primary,
  },
  scanAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: FashionColors.primary,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FashionColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});