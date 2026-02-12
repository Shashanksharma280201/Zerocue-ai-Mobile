/**
 * Avatar Creation Screen
 * Onboarding step where user creates their VTO avatar
 * Design: Minimal, clean, aesthetic
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAvatarStore } from '../../lib/stores/avatarStore';
import { AvatarPicker } from '../../components/avatar/AvatarPicker';
import { MinimalButton } from '../../components/ui/MinimalButton';
import { Colors, Spacing, Typography } from '../../constants/Colors';

export default function CreateAvatarScreen() {
  const router = useRouter();
  const { setAvatar, isLoading } = useAvatarStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelected = (imageUri: string) => {
    setSelectedImage(imageUri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleContinue = async () => {
    if (!selectedImage) {
      Alert.alert('Photo Required', 'Please select a photo to create your avatar.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await setAvatar(selectedImage);
      // Navigate to main app
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert(
        'Upload Failed',
        'Failed to create avatar. Please try again.'
      );
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Skip Avatar Creation?',
      'You can create your avatar later, but virtual try-on will not be available until then.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={styles.header}
        >
          <Text style={styles.title}>Create Your Avatar</Text>
          <Text style={styles.subtitle}>
            One photo for all virtual try-ons
          </Text>
          <Text style={styles.description}>
            Upload a clear photo of yourself to see how clothes look on you
          </Text>
        </Animated.View>

        {/* Avatar Picker */}
        <AvatarPicker
          onImageSelected={handleImageSelected}
          loading={isLoading}
        />

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(600)}
          style={styles.actions}
        >
          {selectedImage && (
            <MinimalButton
              title="Continue"
              variant="primary"
              size="lg"
              onPress={handleContinue}
              loading={isLoading}
            />
          )}

          <MinimalButton
            title="Skip for now"
            variant="ghost"
            size="md"
            onPress={handleSkip}
            disabled={isLoading}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl * 2,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.h3,
    color: Colors.light.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.light.text.tertiary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
  },
});
