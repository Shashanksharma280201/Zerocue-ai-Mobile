import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/Colors';
import { verifyOTP, sendOTP } from '../../lib/api/auth';
import { useAuthStore } from '../../lib/stores/authStore';

export default function OTP() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);
  const { setUser, setSession } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = async (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every(digit => digit !== '')) {
      const otpCode = newOtp.join('');
      await verifyOTPCode(otpCode);
    }
  };

  const verifyOTPCode = async (otpCode: string) => {
    if (loading) return;

    try {
      setLoading(true);
      Keyboard.dismiss();

      // BYPASS MODE - Accept any 6-digit OTP for testing
      console.log('BYPASS MODE: Accepting OTP:', otpCode);

      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate verification delay

      // Create mock session and user
      const mockSession = {
        access_token: 'mock-access-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        user: {
          id: 'mock-user-' + Date.now(),
          phone: phone,
        }
      };

      const mockUser = {
        id: 'mock-user-' + Date.now(),
        phone: phone,
        name: 'Test User',
      };

      // Update auth store
      setSession(mockSession as any);
      setUser(mockUser as any);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to avatar creation (bypassing store selection)
      setTimeout(() => {
        router.replace('/(onboarding)/create-avatar');
      }, 300);
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid OTP', error.message || 'Please check your code and try again.');

      // Clear OTP
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      setLoading(false);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer === 0 && !loading) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await sendOTP(phone);

        setTimer(30);
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('OTP Resent', 'A new verification code has been sent to your phone.');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to resend OTP');
      }
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
                <Text style={styles.title}>Enter verification code</Text>
                <Text style={styles.subtitle}>
                  We sent a code to +91 {phone}
                </Text>
              </View>

              {/* OTP inputs */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) inputs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit !== '' && styles.otpInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoFocus={index === 0}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>Verifying...</Text>
                </View>
              )}

              {/* Resend code */}
              <View style={styles.resendContainer}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend code in {timer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}>Resend code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Didn't receive the code?{' '}
                <Text style={styles.footerLink} onPress={handleBack}>
                  Change number
                </Text>
              </Text>
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
    marginBottom: Spacing.xl + Spacing.md,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    textAlign: 'center',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.cream[100],
  },
  resendContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  resendText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
