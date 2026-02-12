/**
 * Virtual Try-On Screen
 * Core feature: Upload product image and see it on your avatar
 * Design: Minimal, fast, beautiful
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAvatarStore } from '../../lib/stores/avatarStore';
import { useVTOStore } from '../../lib/stores/vtoStore';
import { VTOResultView } from '../../components/vto/VTOResultView';
import { MinimalButton } from '../../components/ui/MinimalButton';
import { MinimalCard } from '../../components/ui/MinimalCard';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/Colors';

// Sample product images for testing VTO
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'White T-Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  },
  {
    id: '2',
    name: 'Black Hoodie',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
  },
  {
    id: '3',
    name: 'Denim Jacket',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
  },
  {
    id: '4',
    name: 'Formal Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
  },
];

export default function VirtualTryOnScreen() {
  const router = useRouter();
  const { avatar, hasAvatar } = useAvatarStore();
  const { requestVTO, processing } = useVTOStore();

  const [productImage, setProductImage] = useState<string | null>(null);
  const [vtoResult, setVTOResult] = useState<any>(null);

  // Check if user has avatar
  if (!hasAvatar()) {
    return (
      <View style={styles.emptyState}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.emptyContent}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-outline" size={60} color={Colors.light.primary} />
          </View>
          <Text style={styles.emptyTitle}>Create Your Avatar First</Text>
          <Text style={styles.emptyText}>
            You need to upload your photo before using virtual try-on
          </Text>
          <MinimalButton
            title="Create Avatar"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(onboarding)/create-avatar')}
            style={styles.createButton}
          />
        </Animated.View>
      </View>
    );
  }

  const handleScanProduct = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to scan products.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setProductImage(result.assets[0].uri);
      setVTOResult(null);
    }
  };

  const handleUploadProduct = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is needed to upload photos.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setProductImage(result.assets[0].uri);
      setVTOResult(null);
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProductImage(sampleUrl);
    setVTOResult(null);
  };

  const handleTryOn = async () => {
    if (!productImage || !avatar) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Pass avatar image URL instead of avatar ID
      const result = await requestVTO(avatar.imageUrl, productImage);
      setVTOResult(result);
    } catch (error) {
      console.error('VTO Screen: Try-on failed', error);
      Alert.alert(
        'Try-On Failed',
        'Failed to generate virtual try-on. Please try again.'
      );
    }
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Virtual try-on saved to your wardrobe');
  };

  const handleReset = () => {
    setProductImage(null);
    setVTOResult(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Text style={styles.title}>Virtual Try-On</Text>
        <Text style={styles.subtitle}>See how clothes look on you</Text>
      </Animated.View>

      {/* Avatar Preview */}
      <Animated.View entering={FadeInUp.duration(600).delay(200)}>
        <MinimalCard style={styles.avatarCard} elevation="sm">
          <Image
            source={{ uri: avatar?.thumbnailUrl }}
            style={styles.avatarThumbnail}
          />
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarLabel}>Your Avatar</Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/create-avatar')}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        </MinimalCard>
      </Animated.View>

      {/* Product Section */}
      {!vtoResult && (
        <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Select Product to Try On</Text>

          {!productImage ? (
            <>
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={styles.uploadOption}
                  onPress={handleScanProduct}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="camera" size={32} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.uploadOptionText}>Scan Product</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadOption}
                  onPress={handleUploadProduct}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="image" size={32} color={Colors.light.accent} />
                  </View>
                  <Text style={styles.uploadOptionText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Sample Products Section */}
              <View style={styles.samplesSection}>
                <Text style={styles.samplesTitle}>Or try sample products</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.samplesContainer}
                >
                  {SAMPLE_PRODUCTS.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.sampleItem}
                      onPress={() => handleSelectSample(product.imageUrl)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.sampleImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.sampleName}>{product.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          ) : (
            <MinimalCard style={styles.productCard} elevation="md">
              <Image
                source={{ uri: productImage }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productActions}>
                <MinimalButton
                  title="Change"
                  variant="outline"
                  size="sm"
                  onPress={() => setProductImage(null)}
                  icon={<Ionicons name="close" size={16} color={Colors.light.text.secondary} />}
                  style={styles.changeButton}
                />
                <MinimalButton
                  title="Try On"
                  variant="primary"
                  size="lg"
                  onPress={handleTryOn}
                  loading={processing}
                  icon={<Ionicons name="sparkles" size={20} color="white" />}
                  style={styles.tryOnButton}
                />
              </View>
            </MinimalCard>
          )}
        </Animated.View>
      )}

      {/* Processing State */}
      {processing && (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.processingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.processingText}>Creating your virtual try-on</Text>
          <Text style={styles.processingSubtext}>This may take 15-30 seconds</Text>
        </Animated.View>
      )}

      {/* VTO Result */}
      {vtoResult && (
        <VTOResultView
          originalAvatar={avatar?.imageUrl || ''}
          vtoImage={vtoResult.vtoImage}
          confidence={vtoResult.confidence}
          onSave={handleSave}
          onTryAnother={handleReset}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.text.secondary,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  avatarThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.neutral[200],
  },
  avatarInfo: {
    flex: 1,
  },
  avatarLabel: {
    ...Typography.body,
    color: Colors.light.text.primary,
    fontWeight: '600',
  },
  changeLink: {
    ...Typography.bodySmall,
    color: Colors.light.primary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.light.text.primary,
    marginBottom: Spacing.md,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  uploadOption: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOptionText: {
    ...Typography.body,
    color: Colors.light.text.primary,
    fontWeight: '500',
  },
  productCard: {
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.light.neutral[100],
  },
  productActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  changeButtonText: {
    ...Typography.body,
    color: Colors.light.text.secondary,
  },
  tryOnButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  tryOnText: {
    ...Typography.button,
    color: 'white',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  processingText: {
    ...Typography.h3,
    color: Colors.light.text.primary,
    marginTop: Spacing.lg,
  },
  processingSubtext: {
    ...Typography.body,
    color: Colors.light.text.tertiary,
    marginTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.light.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.light.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  createButton: {
    minWidth: 200,
  },
  samplesSection: {
    marginTop: Spacing.xl,
  },
  samplesTitle: {
    ...Typography.bodySmall,
    color: Colors.light.text.tertiary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  samplesContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sampleItem: {
    width: 140,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  sampleImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.light.neutral[100],
  },
  sampleName: {
    ...Typography.bodySmall,
    color: Colors.light.text.primary,
    padding: Spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
});
