import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/Colors';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ShopHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>zerocue</Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/profile');
              }}
            >
              <Ionicons name="person-circle-outline" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="cart" size={72} color={Colors.fashion.ocean} />
          </View>
          <Text style={styles.heroTitle}>Welcome to ZeroCue</Text>
          <Text style={styles.heroDescription}>
            The future of shopping is here. No lines, no waiting, just scan and go.
          </Text>
        </View>

        {/* How It Works Banner */}
        <TouchableOpacity
          style={styles.howItWorksBanner}
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/how-it-works');
          }}
        >
          <View style={styles.howItWorksContent}>
            <View style={styles.howItWorksIconContainer}>
              <Ionicons name="information-circle" size={32} color={Colors.fashion.ocean} />
            </View>
            <View style={styles.howItWorksText}>
              <Text style={styles.howItWorksTitle}>How Self-Checkout Works</Text>
              <Text style={styles.howItWorksSubtitle}>Scan, shop & walk out. No queues!</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Features Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why ZeroCue?</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.fashion.ocean + '15' }]}>
                <Ionicons name="time-outline" size={32} color={Colors.fashion.ocean} />
              </View>
              <Text style={styles.featureTitle}>Save Time</Text>
              <Text style={styles.featureDescription}>
                Skip checkout lines completely. Shop at your own pace.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.fashion.azure + '15' }]}>
                <Ionicons name="phone-portrait-outline" size={32} color={Colors.fashion.azure} />
              </View>
              <Text style={styles.featureTitle}>Contactless</Text>
              <Text style={styles.featureDescription}>
                Touch-free shopping experience from start to finish.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.fashion.sage + '15' }]}>
                <Ionicons name="shield-checkmark-outline" size={32} color={Colors.fashion.sage} />
              </View>
              <Text style={styles.featureTitle}>Secure</Text>
              <Text style={styles.featureDescription}>
                Bank-level encryption keeps your payments safe.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="sparkles-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>AI-Powered</Text>
              <Text style={styles.featureDescription}>
                Get smart fashion recommendations as you shop.
              </Text>
            </View>
          </View>
        </View>

        {/* Coming Soon Banner */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="rocket-outline" size={48} color={Colors.fashion.ocean} />
          <Text style={styles.comingSoonTitle}>Coming Soon to Your City</Text>
          <Text style={styles.comingSoonDescription}>
            We're bringing checkout-free shopping to stores near you. Join the waitlist to be notified when we launch.
          </Text>
          <TouchableOpacity
            style={styles.joinWaitlistButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/how-it-works');
            }}
          >
            <Text style={styles.joinWaitlistText}>Learn More & Join Waitlist</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  logoContainer: {
    flex: 0,
  },
  logo: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  heroIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.fashion.ocean + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.xl,
  },

  // Sections
  section: {
    marginBottom: Spacing.xxl,
    // backgroundColor: Colors.black,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.medium,
  },
  featureIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Coming Soon Banner
  comingSoonBanner: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.large,
  },
  comingSoonTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  joinWaitlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.fashion.ocean,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xxl,
    ...Shadows.medium,
  },
  joinWaitlistText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // How It Works Banner
  howItWorksBanner: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  howItWorksContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  howItWorksIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fashion.ocean + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksText: {
    flex: 1,
    gap: 4,
  },
  howItWorksTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  howItWorksSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
