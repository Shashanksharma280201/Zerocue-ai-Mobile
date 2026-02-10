import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/Colors';
import { sendOTP } from '../../lib/api/auth';

export default function Phone() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const formatted = cleaned.slice(0, 10);
    setPhone(formatted);
    setIsValid(formatted.length === 10);
  };

  const handleContinue = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Send OTP
      await sendOTP(phone);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to OTP screen with phone number
      router.push({
        pathname: '/(auth)/otp',
        params: { phone },
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Main content */}
            <View style={styles.main}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Enter your phone number</Text>
                <Text style={styles.subtitle}>
                  We'll send you a verification code to confirm your number
                </Text>
              </View>

              {/* Phone input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder="Phone number"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                  />
                  {phone.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setPhone('');
                        setIsValid(false);
                      }}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Helper text */}
              <Text style={styles.helperText}>
                We'll never share your phone number with anyone
              </Text>
            </View>

            {/* Footer with button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!isValid || loading) && styles.continueButtonDisabled
                ]}
                onPress={handleContinue}
                disabled={!isValid || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={[
                      styles.continueButtonText,
                      !isValid && styles.continueButtonTextDisabled
                    ]}>
                      Continue
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={isValid ? Colors.white : Colors.textLight}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.sm,
  },
  main: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontWeight: FontWeight.normal,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  countryCode: {
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  countryCodeText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  helperText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingBottom: Spacing.xl,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.cream[200],
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0,
  },
  continueButtonTextDisabled: {
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
});
