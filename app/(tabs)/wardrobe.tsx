import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/Colors';
import { fashionApi } from '../../lib/api/fashion';
import { useFashionStore } from '../../lib/stores/fashionStore';
import type { SavedOutfit } from '../../lib/types/fashion';

export default function WardrobeScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { setSavedOutfits } = useFashionStore();

  const loadOutfits = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fashionApi.getSavedOutfits();
      setOutfits(data);
      await setSavedOutfits(data);
    } catch (error: any) {
      console.error('Load outfits error:', error);
      Alert.alert('Error', error.error || 'Failed to load saved outfits');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOutfits();
  }, []);

  const handleOutfitPress = (outfit: SavedOutfit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/fashion-analysis',
      params: { analysisId: outfit.analysis_id },
    });
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Outfit',
      'Are you sure you want to delete this saved outfit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fashionApi.deleteSavedOutfit(outfitId);
              setOutfits((prev) => prev.filter((o) => o.outfit_id !== outfitId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Outfit deleted');
            } catch (error: any) {
              console.error('Delete outfit error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.error || 'Failed to delete outfit');
            }
          },
        },
      ]
    );
  };

  const renderOutfitCard = ({ item }: { item: SavedOutfit }) => (
    <TouchableOpacity
      style={styles.outfitCard}
      onPress={() => handleOutfitPress(item)}
      onLongPress={() => handleDeleteOutfit(item.outfit_id)}
    >
      <Card style={styles.imageContainer} padding={0}>
        <Image
          source={{ uri: item.tryon_image_url || item.image_url }}
          style={styles.outfitImage}
          resizeMode="cover"
        />
        {item.tryon_image_url && (
          <View style={styles.tryonBadge}>
            <Text style={styles.tryonBadgeText}>Virtual Try-On</Text>
          </View>
        )}
      </Card>
      <Text style={styles.outfitName} numberOfLines={2}>
        {item.name}
      </Text>
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagRow}>
          {item.tags.slice(0, 2).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="sparkles" size={60} color={Colors.fashion.ocean} />
      </View>
      <Text style={styles.emptyTitle}>Your AI Fashion Hub</Text>
      <Text style={styles.emptySubtitle}>
        Unlock personalized style insights powered by AI
      </Text>

      {/* AI Features List */}
      <View style={styles.aiFeaturesList}>
        <View style={styles.aiFeatureItem}>
          <Ionicons name="scan-outline" size={24} color={Colors.fashion.ocean} />
          <Text style={styles.aiFeatureText}>Instant outfit analysis</Text>
        </View>
        <View style={styles.aiFeatureItem}>
          <Ionicons name="color-palette-outline" size={24} color={Colors.fashion.azure} />
          <Text style={styles.aiFeatureText}>Smart color matching</Text>
        </View>
        <View style={styles.aiFeatureItem}>
          <Ionicons name="body-outline" size={24} color={Colors.fashion.sage} />
          <Text style={styles.aiFeatureText}>Virtual try-on magic</Text>
        </View>
        <View style={styles.aiFeatureItem}>
          <Ionicons name="bulb-outline" size={24} color={Colors.primary} />
          <Text style={styles.aiFeatureText}>Style recommendations</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/fashion-upload');
        }}
        activeOpacity={0.9}
      >
        <Ionicons name="camera" size={22} color={Colors.white} />
        <Text style={styles.uploadButtonText}>Try AI Fashion Assistant</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <SafeAreaView edges={['top']} style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Wardrobe</Text>
          <Text style={styles.headerSubtitle}>{outfits.length} outfits saved</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/fashion-upload');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading your wardrobe..." />;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={outfits}
        renderItem={renderOutfitCard}
        keyExtractor={(item) => item.outfit_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.content,
          outfits.length === 0 && styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadOutfits(true)}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header Styles
  headerContainer: {
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.fashion.ocean,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },

  // Content Styles
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  // Outfit Card Styles
  outfitCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  imageContainer: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.background,
  },
  outfitImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  tryonBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.fashion.azure,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  tryonBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outfitName: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    padding: Spacing.md,
    paddingBottom: Spacing.xs,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.fashion.ocean + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    color: Colors.fashion.ocean,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  emptyTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: Spacing.xl + Spacing.sm,
    lineHeight: 22,
  },

  // AI Features List Styles
  aiFeaturesList: {
    width: '100%',
    marginBottom: Spacing.xl + Spacing.sm,
    gap: Spacing.sm,
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    ...Shadows.small,
  },
  aiFeatureText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },

  // Upload Button Styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.fashion.ocean,
    paddingHorizontal: Spacing.xl + Spacing.sm,
    paddingVertical: Spacing.md + 6,
    borderRadius: BorderRadius.xxl,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  uploadButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
