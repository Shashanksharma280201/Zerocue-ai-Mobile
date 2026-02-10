import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/Colors';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '../lib/i18n';

type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te';
type Theme = 'light' | 'dark' | 'auto';

const LANGUAGES = getSupportedLanguages();

const THEMES = [
  { value: 'light' as Theme, label: 'Light', icon: 'sunny-outline' },
  { value: 'dark' as Theme, label: 'Dark', icon: 'moon-outline' },
  { value: 'auto' as Theme, label: 'Auto', icon: 'contrast-outline' },
];

export default function PreferencesScreen() {
  const router = useRouter();

  // Notification preferences
  const [pushNotifications, setPushNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // App preferences
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('light');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Shopping preferences
  const [autoAddSimilar, setAutoAddSimilar] = useState(false);
  const [saveCart, setSaveCart] = useState(true);
  const [showPricesWithTax, setShowPricesWithTax] = useState(true);

  useEffect(() => {
    // Load current language on mount
    const currentLang = getCurrentLanguage() as Language;
    setSelectedLanguage(currentLang);
  }, []);

  const handleLanguageChange = async (language: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLanguage(language);

    try {
      await changeLanguage(language);
      Alert.alert(
        'Language Changed',
        `Language changed to ${LANGUAGES.find(l => l.code === language)?.name}. Restart the app to see all changes.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to change language');
    }
  };

  const handleThemeChange = (theme: Theme) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTheme(theme);
    Alert.alert('Theme Changed', 'Theme preferences saved. Dark mode coming soon!');
  };

  const handleToggle = (value: boolean, setter: (val: boolean) => void, hapticEnabled: boolean = true) => {
    if (hapticEnabled && hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(value);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Preferences',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTitleStyle: {
            fontSize: FontSize.xl,
            fontWeight: FontWeight.bold,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Receive app notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={(val) => handleToggle(val, setPushNotifications)}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={pushNotifications ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Order Updates</Text>
                <Text style={styles.settingDesc}>Get notified about order status</Text>
              </View>
              <Switch
                value={orderUpdates}
                onValueChange={(val) => handleToggle(val, setOrderUpdates)}
                disabled={!pushNotifications}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={orderUpdates ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Promotions & Offers</Text>
                <Text style={styles.settingDesc}>Special deals and discounts</Text>
              </View>
              <Switch
                value={promotions}
                onValueChange={(val) => handleToggle(val, setPromotions)}
                disabled={!pushNotifications}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={promotions ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDesc}>Receive order receipts via email</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={(val) => handleToggle(val, setEmailNotifications)}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={emailNotifications ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Language</Text>
                <Text style={styles.settingDesc}>
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {}}>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.languageOptions}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.code && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguage === lang.code && styles.languageOptionTextActive,
                    ]}
                  >
                    {lang.nativeName}
                  </Text>
                  {selectedLanguage === lang.code && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Theme</Text>
                <Text style={styles.settingDesc}>Choose your preferred theme</Text>
              </View>
            </View>

            <View style={styles.themeOptions}>
              {THEMES.map((theme) => (
                <TouchableOpacity
                  key={theme.value}
                  style={[
                    styles.themeOption,
                    selectedTheme === theme.value && styles.themeOptionActive,
                  ]}
                  onPress={() => handleThemeChange(theme.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={theme.icon as any}
                    size={24}
                    color={selectedTheme === theme.value ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      selectedTheme === theme.value && styles.themeOptionTextActive,
                    ]}
                  >
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="finger-print-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Text style={styles.settingDesc}>Vibration on interactions</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => handleToggle(val, setHapticsEnabled, false)}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={hapticsEnabled ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Sound Effects</Text>
                <Text style={styles.settingDesc}>Audio feedback</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => handleToggle(val, setSoundEnabled)}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={soundEnabled ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>
          </View>
        </View>

        {/* Shopping Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Shopping</Text>
          </View>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Save Cart</Text>
                <Text style={styles.settingDesc}>Keep items when you close app</Text>
              </View>
              <Switch
                value={saveCart}
                onValueChange={(val) => handleToggle(val, setSaveCart)}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={saveCart ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Show Prices with Tax</Text>
                <Text style={styles.settingDesc}>Include GST in displayed prices</Text>
              </View>
              <Switch
                value={showPricesWithTax}
                onValueChange={(val) => handleToggle(val, setShowPricesWithTax)}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={showPricesWithTax ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>AI Recommendations</Text>
                <Text style={styles.settingDesc}>Get personalized suggestions</Text>
              </View>
              <Switch
                value={autoAddSimilar}
                onValueChange={(val) => handleToggle(val, setAutoAddSimilar)}
                trackColor={{ false: Colors.borderLight, true: Colors.primary + '40' }}
                thumbColor={autoAddSimilar ? Colors.primary : Colors.textLight}
                ios_backgroundColor={Colors.borderLight}
              />
            </View>
          </View>
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
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  settingsGroup: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  divider: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  languageOptions: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
  },
  languageOptionActive: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  languageOptionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  languageOptionTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  themeOptions: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    gap: Spacing.xs,
  },
  themeOptionActive: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  themeOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  themeOptionTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
