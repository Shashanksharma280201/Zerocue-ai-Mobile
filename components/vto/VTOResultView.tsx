/**
 * VTO Result View Component
 * Beautiful side-by-side comparison with swipe gesture
 * Design: Minimal, clean, smooth animations
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/Colors';
import { MinimalButton } from '../ui/MinimalButton';
import { MinimalCard } from '../ui/MinimalCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

interface VTOResultViewProps {
  originalAvatar: string;
  vtoImage: string;
  confidence?: number;
  onSave: () => void;
  onTryAnother: () => void;
  onShare?: () => void;
}

export const VTOResultView: React.FC<VTOResultViewProps> = ({
  originalAvatar,
  vtoImage,
  confidence = 0,
  onSave,
  onTryAnother,
  onShare,
}) => {
  const translateX = useSharedValue(0);
  const [showOriginal, setShowOriginal] = React.useState(false);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      // Toggle if swiped more than 30%
      if (Math.abs(translateX.value) > IMAGE_WIDTH * 0.3) {
        setShowOriginal(!showOriginal);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      translateX.value = withSpring(0);
    });

  const vtoImageStyle = useAnimatedStyle(() => ({
    opacity: showOriginal ? 0 : 1,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(600)}
      style={styles.container}
    >
      {/* Comparison View */}
      <MinimalCard style={styles.comparisonCard} elevation="md">
        <View style={styles.imageContainer}>
          {/* Original Avatar (Background) */}
          <Image
            source={{ uri: originalAvatar }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* VTO Result (Foreground) */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.vtoImageContainer, vtoImageStyle]}>
              <Image
                source={{ uri: vtoImage }}
                style={styles.image}
                resizeMode="cover"
              />
            </Animated.View>
          </GestureDetector>

          {/* Labels */}
          <View style={styles.labels}>
            <View style={[styles.label, styles.originalLabel]}>
              <Text style={styles.labelText}>Original</Text>
            </View>
            {!showOriginal && (
              <View style={[styles.label, styles.vtoLabel]}>
                <Text style={styles.labelText}>Try-On</Text>
              </View>
            )}
          </View>

          {/* Swipe Hint */}
          <View style={styles.swipeHint}>
            <Ionicons name="swap-horizontal" size={24} color="white" />
            <Text style={styles.swipeText}>Swipe to compare</Text>
          </View>
        </View>

        {/* Confidence Score */}
        {confidence > 0 && (
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <View style={styles.confidenceValue}>
              <View style={[styles.confidenceBar, { width: `${confidence * 100}%` }]} />
              <Text style={styles.confidenceText}>{Math.round(confidence * 100)}%</Text>
            </View>
          </View>
        )}
      </MinimalCard>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.primaryActions}>
          <MinimalButton
            title="Save"
            variant="primary"
            size="lg"
            onPress={onSave}
            icon={<Ionicons name="heart-outline" size={20} color="white" />}
            style={styles.saveButton}
          />

          <MinimalButton
            title="Try Another"
            variant="outline"
            size="lg"
            onPress={onTryAnother}
            icon={<Ionicons name="refresh-outline" size={20} color={Colors.light.primary} />}
            style={styles.tryButton}
          />
        </View>

        {onShare && (
          <MinimalButton
            title="Share"
            variant="ghost"
            size="md"
            onPress={onShare}
            icon={<Ionicons name="share-outline" size={18} color={Colors.light.text.secondary} />}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  comparisonCard: {
    overflow: 'hidden',
    padding: 0,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: Colors.light.neutral[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  vtoImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  labels: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  originalLabel: {
    backgroundColor: Colors.light.neutral[700] + 'CC',
  },
  vtoLabel: {
    backgroundColor: Colors.light.accent + 'CC',
  },
  labelText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  swipeHint: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'center',
    borderRadius: BorderRadius.full,
  },
  swipeText: {
    ...Typography.bodySmall,
    color: 'white',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.neutral[200],
  },
  confidenceLabel: {
    ...Typography.body,
    color: Colors.light.text.secondary,
  },
  confidenceValue: {
    position: 'relative',
    width: 100,
    height: 24,
    backgroundColor: Colors.light.neutral[200],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  confidenceBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.light.accent,
  },
  confidenceText: {
    ...Typography.caption,
    color: Colors.light.text.primary,
    position: 'absolute',
    right: Spacing.xs,
    top: 4,
    fontWeight: '600',
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  tryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    ...Typography.button,
    color: 'white',
  },
  outlineText: {
    color: Colors.light.primary,
  },
  shareText: {
    ...Typography.body,
    color: Colors.light.text.secondary,
    marginLeft: Spacing.xs,
  },
});
