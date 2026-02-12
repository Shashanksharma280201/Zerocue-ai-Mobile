/**
 * Avatar Picker Component
 * Beautiful, minimal interface for capturing user's avatar photo
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/Colors';
import { MinimalButton } from '../ui/MinimalButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = SCREEN_WIDTH * 0.6;

interface AvatarPickerProps {
  onImageSelected: (imageUri: string) => void;
  initialImage?: string | null;
  loading?: boolean;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  onImageSelected,
  initialImage,
  loading = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take your avatar photo.'
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is needed to choose your avatar photo.'
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      scale.value = 0.95;
      setTimeout(() => (scale.value = 1), 200);
      onImageSelected(imageUri);
    }
  };

  const handleChooseFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      scale.value = 0.95;
      setTimeout(() => (scale.value = 1), 200);
      onImageSelected(imageUri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar Preview */}
      <Animated.View
        entering={FadeInDown.duration(600)}
        style={[styles.avatarContainer, animatedStyle]}
      >
        {selectedImage ? (
          <>
            <Image source={{ uri: selectedImage }} style={styles.avatarImage} />
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleChooseFromGallery}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person-outline"
              size={80}
              color={Colors.light.primary}
            />
            <Text style={styles.placeholderText}>Your Avatar</Text>
          </View>
        )}
      </Animated.View>

      {/* Guidelines */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(200)}
        style={styles.guidelines}
      >
        <GuidelineItem
          icon="body-outline"
          text="Full body or upper body"
        />
        <GuidelineItem
          icon="sunny-outline"
          text="Good lighting"
        />
        <GuidelineItem
          icon="locate-outline"
          text="Neutral background (preferred)"
        />
      </Animated.View>

      {/* Action Buttons */}
      {!selectedImage && (
        <Animated.View
          entering={FadeInUp.duration(600).delay(400)}
          style={styles.actions}
        >
          <MinimalButton
            title="Take Photo"
            variant="primary"
            size="lg"
            onPress={handleTakePhoto}
            disabled={loading}
            icon={<Ionicons name="camera" size={20} color="white" />}
            style={styles.button}
          />

          <MinimalButton
            title="Choose from Gallery"
            variant="outline"
            size="lg"
            onPress={handleChooseFromGallery}
            disabled={loading}
            icon={<Ionicons name="images" size={20} color={Colors.light.primary} />}
            style={styles.button}
          />
        </Animated.View>
      )}
    </View>
  );
};

const GuidelineItem: React.FC<{ icon: any; text: string }> = ({ icon, text }) => (
  <View style={styles.guidelineItem}>
    <View style={styles.guidelineIcon}>
      <Ionicons name={icon} size={16} color={Colors.light.accent} />
    </View>
    <Text style={styles.guidelineText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE * 1.33, // 3:4 aspect ratio
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.light.surface,
    ...Shadows.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.neutral[100],
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.light.text.secondary,
    marginTop: Spacing.sm,
  },
  editButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  guidelines: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  guidelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelineText: {
    ...Typography.body,
    color: Colors.light.text.secondary,
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    ...Typography.button,
    color: 'white',
  },
  outlineButtonText: {
    color: Colors.light.primary,
  },
});
