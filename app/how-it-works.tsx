/**
 * How It Works - Self Checkout Explainer
 * Comprehensive guide to ZeroCue's AI-powered self-checkout system
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: 'scan-outline',
    title: 'Scan Items',
    description: 'Use your phone camera to scan product barcodes as you shop. Our AI instantly identifies items and adds them to your cart.',
    color: Colors.fashion.ocean,
  },
  {
    icon: 'sparkles',
    title: 'AI Fashion Assistant',
    description: 'Get real-time style advice and outfit recommendations. Take a photo of any item for instant fashion insights and matching suggestions.',
    color: Colors.fashion.azure,
  },
  {
    icon: 'cart-outline',
    title: 'Smart Cart',
    description: 'Your cart updates in real-time. See running totals, apply discounts, and get personalized deals based on your shopping history.',
    color: Colors.fashion.sage,
  },
  {
    icon: 'exit-outline',
    title: 'Walk Out',
    description: 'Just walk out! No lines, no checkout counters. Payment is automatic and your receipt is instantly available in the app.',
    color: Colors.primary,
  },
];

const BENEFITS = [
  {
    icon: 'time-outline',
    title: 'Save Time',
    description: 'Skip the checkout lines completely',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Contactless',
    description: 'Touch-free shopping experience',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Secure',
    description: 'Bank-level encryption for payments',
  },
  {
    icon: 'analytics-outline',
    title: 'Smart Shopping',
    description: 'Personalized recommendations & deals',
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [email, setEmail] = useState('');

  const handleJoinWaitlist = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Integrate with your waitlist API
    Alert.alert(
      'Welcome to ZeroCue! 🎉',
      'Thank you for your interest! We\'ll notify you as soon as self-checkout is available in your area.',
      [{ text: 'OK' }]
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.hero, { opacity: headerOpacity }]}>
          <LinearGradient
            colors={[Colors.fashion.ocean + '15', Colors.fashion.azure + '15']}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="cart-outline" size={64} color={Colors.fashion.ocean} />
            </View>
            <Text style={styles.heroTitle}>Shop Without Queues</Text>
            <Text style={styles.heroSubtitle}>
              Experience the future of retail with AI-powered self-checkout
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Experience</Text>
          <Text style={styles.sectionSubtitle}>
            Four simple steps to a seamless shopping experience
          </Text>

          <View style={styles.stepsContainer}>
            {STEPS.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>

                <View style={[styles.stepIconContainer, { backgroundColor: step.color + '15' }]}>
                  <Ionicons name={step.icon} size={36} color={step.color} />
                </View>

                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>

                {index < STEPS.length - 1 && (
                  <View style={styles.stepConnector}>
                    <Ionicons name="chevron-down" size={20} color={Colors.fashion.skyBlue} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Benefits Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose ZeroCue?</Text>

          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon} size={28} color={Colors.fashion.ocean} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Technology Section */}
        <View style={styles.section}>
          <View style={styles.techCard}>
            <View style={styles.techHeader}>
              <Ionicons name="hardware-chip" size={32} color={Colors.fashion.azure} />
              <Text style={styles.techTitle}>Powered by AI</Text>
            </View>

            <View style={styles.techFeatures}>
              <View style={styles.techFeature}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.fashion.sage} />
                <Text style={styles.techFeatureText}>Computer Vision for accurate item recognition</Text>
              </View>

              <View style={styles.techFeature}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.fashion.sage} />
                <Text style={styles.techFeatureText}>ML-powered fashion recommendations</Text>
              </View>

              <View style={styles.techFeature}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.fashion.sage} />
                <Text style={styles.techFeatureText}>Real-time inventory synchronization</Text>
              </View>

              <View style={styles.techFeature}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.fashion.sage} />
                <Text style={styles.techFeatureText}>Secure payment processing</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Questions</Text>

          <View style={styles.faqContainer}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Is it really that fast?</Text>
              <Text style={styles.faqAnswer}>
                Yes! Most customers complete their shopping 3-5x faster than traditional checkout.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>What if I scan an item incorrectly?</Text>
              <Text style={styles.faqAnswer}>
                You can easily remove or adjust items in your cart before checkout. The app also alerts you if something seems wrong.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>How does payment work?</Text>
              <Text style={styles.faqAnswer}>
                Add your preferred payment method once. When you walk out, payment is processed automatically and you'll receive an instant digital receipt.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Is my data secure?</Text>
              <Text style={styles.faqAnswer}>
                Absolutely. We use bank-level encryption and never store full payment details. Your privacy and security are our top priorities.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[Colors.fashion.ocean, Colors.fashion.azure]}
            style={styles.ctaCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="rocket" size={48} color={Colors.white} />
            <Text style={styles.ctaTitle}>Ready to Shop Smarter?</Text>
            <Text style={styles.ctaSubtitle}>
              Join the waitlist and be among the first to experience checkout-free shopping
            </Text>

            <TouchableOpacity
              style={styles.waitlistButton}
              onPress={handleJoinWaitlist}
              activeOpacity={0.9}
            >
              <Ionicons name="star" size={20} color={Colors.fashion.ocean} />
              <Text style={styles.waitlistButtonText}>Join the Waitlist</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.fashion.ocean} />
            </TouchableOpacity>

            <Text style={styles.ctaFooter}>
              No commitment • Free forever • Early access perks
            </Text>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fashion.softGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },

  // Hero
  hero: {
    marginBottom: Spacing.lg,
  },
  heroGradient: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.fashion.charcoal,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.fashion.charcoal,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  // Steps
  stepsContainer: {
    gap: Spacing.md,
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.medium,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.fashion.skyBlue + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.fashion.ocean,
  },
  stepIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  stepContent: {
    gap: Spacing.sm,
  },
  stepTitle: {
    ...Typography.h3,
    color: Colors.fashion.charcoal,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  stepConnector: {
    alignSelf: 'center',
    marginTop: Spacing.md,
  },

  // Benefits
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  benefitCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fashion.skyBlue + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  benefitTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.fashion.charcoal,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  benefitDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Technology
  techCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  techTitle: {
    ...Typography.h2,
    color: Colors.fashion.charcoal,
  },
  techFeatures: {
    gap: Spacing.md,
  },
  techFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  techFeatureText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },

  // FAQ
  faqContainer: {
    gap: Spacing.md,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  faqQuestion: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.fashion.charcoal,
    marginBottom: Spacing.sm,
  },
  faqAnswer: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // CTA
  ctaSection: {
    paddingHorizontal: Spacing.lg,
  },
  ctaCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.large,
  },
  ctaTitle: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.white,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  ctaSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.white,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 26,
  },
  waitlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xxl,
    ...Shadows.medium,
  },
  waitlistButtonText: {
    ...Typography.button,
    color: Colors.fashion.ocean,
    fontSize: 18,
  },
  ctaFooter: {
    ...Typography.bodySmall,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
