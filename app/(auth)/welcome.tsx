import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/phone');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background with gradient overlay */}
      <View style={styles.backgroundContainer}>
        <View style={styles.placeholder}>
          {/* Placeholder with ZeroCue brand colors */}
          <View style={styles.placeholderGrid}>
            <View style={[styles.placeholderBox, { backgroundColor: Colors.cream[100] }]} />
            <View style={[styles.placeholderBox, { backgroundColor: Colors.accent.sage }]} />
            <View style={[styles.placeholderBox, { backgroundColor: Colors.cream[300] }]} />
            <View style={[styles.placeholderBox, { backgroundColor: Colors.accent.terracotta }]} />
          </View>
        </View>

        {/* Sage gradient overlay for ZeroCue branding */}
        <LinearGradient
          colors={['rgba(156,175,136,0.5)', 'rgba(122,142,106,0.8)', 'rgba(44,44,44,0.9)']}
          style={styles.gradient}
        />
      </View>

      {/* Content */}
      <SafeAreaView style={styles.contentContainer} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Top section - Logo */}
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ZeroCue</Text>
              <Text style={styles.logoSubtext}>Smart Shopping</Text>
            </View>
          </View>

          {/* Bottom section - CTA */}
          <View style={styles.bottomSection}>
            {/* Tagline */}
            <View style={styles.taglineContainer}>
              <Text style={styles.taglineMain}>Scan.</Text>
              <Text style={styles.taglineMain}>Pay.</Text>
              <Text style={styles.taglineMain}>Go.</Text>
              <Text style={styles.taglineDescription}>
                Skip the checkout lines. Shop smarter with barcode scanning.
              </Text>
            </View>

            {/* Features - minimalist */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <Ionicons name="scan" size={20} color={Colors.cream[100]} />
                <Text style={styles.featureText}>Scan products instantly</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="wallet" size={20} color={Colors.cream[100]} />
                <Text style={styles.featureText}>Pay with one tap</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="time" size={20} color={Colors.cream[100]} />
                <Text style={styles.featureText}>Skip checkout queues</Text>
              </View>
            </View>

            {/* CTA Buttons */}
            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGetStarted}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.accent.charcoal} />
              </TouchableOpacity>
            </View>

            {/* Footer text */}
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accent.charcoal,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    flex: 1,
  },
  placeholderGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  placeholderBox: {
    width: '50%',
    height: '50%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  topSection: {
    paddingTop: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
    fontWeight: FontWeight.medium,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
  taglineContainer: {
    marginBottom: Spacing.xl,
  },
  taglineMain: {
    fontSize: 44,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: -1,
    lineHeight: 48,
  },
  taglineDescription: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.md,
    lineHeight: 24,
    fontWeight: FontWeight.normal,
  },
  featuresContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.95,
    fontWeight: FontWeight.normal,
    lineHeight: 22,
  },
  ctaContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.cream[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    color: Colors.accent.charcoal,
    letterSpacing: 0,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },
});
