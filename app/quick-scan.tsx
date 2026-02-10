import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/Colors';
import { isOnline } from '../lib/offline/networkManager';
import { useProducts } from '../lib/hooks';
import VoiceButton from '../components/VoiceButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScanMode = 'idle' | 'detecting' | 'analyzing' | 'barcode';

export default function QuickScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [scanMode, setScanMode] = useState<ScanMode>('idle');
  const [detectionText, setDetectionText] = useState('Point at any fashion item');
  const [isOffline, setIsOffline] = useState(false);
  const [barcodeScanning] = useState(true);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  const { data: products } = useProducts();
  const cameraRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsOffline(!isOnline());

    // Gentle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scanning line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.fashion.ocean} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera" size={64} color={Colors.fashion.ocean} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan fashion items and get instant AI-powered style
          recommendations
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (data === lastScannedBarcode || scanMode !== 'idle') return;

    setLastScannedBarcode(data);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScanMode('barcode');
    setDetectionText('Barcode detected');

    const product = products?.find(
      (p) => p.barcode === data || p.id === data || p.sku === data
    );

    if (product) {
      setTimeout(() => {
        router.push(`/product/${product.id}`);
        setScanMode('idle');
        setLastScannedBarcode(null);
      }, 800);
    } else {
      setTimeout(() => {
        Alert.alert(
          'Product Not Found',
          'Try scanning the item visually instead',
          [
            {
              text: 'OK',
              onPress: () => {
                setScanMode('idle');
                setDetectionText('Point at any fashion item');
                setLastScannedBarcode(null);
              },
            },
          ]
        );
      }, 800);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScanMode('detecting');
    setDetectionText('Analyzing style...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
      });

      setTimeout(() => {
        router.push({
          pathname: '/quick-scan-result',
          params: {
            imageUri: photo.uri,
            offline: isOffline ? 'true' : 'false',
          },
        });
        setScanMode('idle');
      }, 800);
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
      setScanMode('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        setScanMode('analyzing');

        setTimeout(() => {
          router.push({
            pathname: '/quick-scan-result',
            params: {
              imageUri: result.assets[0].uri,
              offline: isOffline ? 'true' : 'false',
            },
          });
          setScanMode('idle');
        }, 600);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'Failed to select image');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={barcodeScanning ? handleBarcodeScanned : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <BlurView intensity={40} tint="dark" style={styles.blurButton}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </BlurView>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Style Scanner</Text>
            {isOffline && (
              <View style={styles.statusBadge}>
                <Ionicons name="cloud-offline-outline" size={12} color={Colors.white} />
                <Text style={styles.statusBadgeText}>Offline</Text>
              </View>
            )}
            {barcodeScanning && scanMode === 'idle' && (
              <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                <Ionicons name="barcode-outline" size={12} color={Colors.fashion.azure} />
                <Text style={[styles.statusBadgeText, { color: Colors.fashion.azure }]}>
                  Barcode Active
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFlashMode(flashMode === 'off' ? 'on' : 'off');
            }}
          >
            <BlurView intensity={40} tint="dark" style={styles.blurButton}>
              <Ionicons
                name={flashMode === 'on' ? 'flash' : 'flash-off'}
                size={24}
                color={flashMode === 'on' ? Colors.fashion.skyBlue : Colors.white}
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Detection Frame */}
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.detectionFrame,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Scanning Line */}
            {scanMode === 'idle' && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, SCREEN_WIDTH * 0.75 * 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}

            {/* Loading State */}
            {scanMode !== 'idle' && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.fashion.skyBlue} />
                <Text style={styles.loadingText}>{detectionText}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Instruction Text */}
        {scanMode === 'idle' && (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>{detectionText}</Text>
            <Text style={styles.instructionSubtext}>Your AI fashion assistant is ready</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={handleGallery}
            disabled={scanMode !== 'idle'}
          >
            <BlurView intensity={40} tint="dark" style={styles.sideButtonBlur}>
              <Ionicons name="images" size={24} color={Colors.white} />
            </BlurView>
            <Text style={styles.sideButtonLabel}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, scanMode !== 'idle' && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={scanMode !== 'idle'}
            activeOpacity={0.8}
          >
            <View style={styles.captureOuter}>
              <View style={styles.captureInner}>
                {scanMode === 'idle' ? (
                  <Ionicons name="scan" size={36} color={Colors.white} />
                ) : (
                  <ActivityIndicator size="large" color={Colors.white} />
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFacing(facing === 'back' ? 'front' : 'back');
            }}
            disabled={scanMode !== 'idle'}
          >
            <BlurView intensity={40} tint="dark" style={styles.sideButtonBlur}>
              <Ionicons name="camera-reverse" size={24} color={Colors.white} />
            </BlurView>
            <Text style={styles.sideButtonLabel}>Flip</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Assistant Button */}
        <VoiceButton
          onResult={(transcript, answer) => {
            console.log('Voice query:', transcript);
            console.log('AI answer:', answer);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },

  // Permission Screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.fashion.cream,
  },
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.fashion.ocean}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.fashion.charcoal,
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  permissionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
    maxWidth: 300,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.fashion.ocean,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  permissionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  backButton: {
    paddingVertical: Spacing.md,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.textLight,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  closeButton: {
    width: 44,
    height: 44,
  },
  flashButton: {
    width: 44,
    height: 44,
  },
  blurButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Detection Frame
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionFrame: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75 * 1.3,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: Colors.fashion.ocean,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: BorderRadius.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: BorderRadius.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: BorderRadius.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: BorderRadius.md,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.fashion.azure,
    shadowColor: Colors.fashion.azure,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // Instructions
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 0.3,
  },
  instructionSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom Controls
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: Spacing.xl,
  },
  sideButton: {
    alignItems: 'center',
    gap: 8,
    opacity: 0.95,
  },
  sideButtonBlur: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    ...Shadows.large,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureOuter: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    backgroundColor: Colors.fashion.ocean,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  captureInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: Colors.fashion.azure,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
