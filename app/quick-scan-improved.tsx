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
  Vibration,
  PanResponder,
} from 'react-native';
import { CameraView, Camera, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { isOnline } from '../lib/offline/networkManager';
import { useProducts } from '../lib/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fashion-forward color palette
const FashionColors = {
  primary: '#6B3AA0',        // Deep Plum
  primaryLight: '#8B5CF6',   // Electric Violet
  primaryDark: '#4C1D95',    // Royal Purple
  secondary: '#E8B4B8',      // Rose Gold
  accent: '#F472B6',         // Hot Pink
  success: '#95B99C',        // Sage Green
  charcoal: '#1F1F23',       // Rich Charcoal
  gray: {
    50: '#FAF9F7',           // Off-white
    100: '#F5F3F0',
    200: '#E7E5E2',
    300: '#D4D2CE',
    400: '#A8A5A0',
    500: '#6B6966',
    600: '#4A4846',
    700: '#2D2C2A',
  },
  white: '#FFFFFF',
  overlay: 'rgba(31, 31, 35, 0.85)',
};

type ScanState = 'ready' | 'detecting' | 'captured' | 'processing';

export default function QuickScanImprovedScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [autoCapture, setAutoCapture] = useState(true);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(true);

  const { data: products } = useProducts();
  const cameraRef = useRef<any>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(100)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confidenceAnim = useRef(new Animated.Value(0)).current;

  // Auto-detection timer
  const detectionTimer = useRef<NodeJS.Timeout | null>(null);
  const captureCountdown = useRef(3);

  // Gesture handler for swipe up to open gallery
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < -50; // Detect upward swipe
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -100 && gestureState.vy < -0.5) {
          handleGallery();
        }
      },
    })
  ).current;

  useEffect(() => {
    // Initialize animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start continuous pulse animation for scanner
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

    // Start rotation animation for loading state
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Auto-hide tip after 4 seconds
    const tipTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowTip(false));
    }, 4000);

    return () => {
      clearTimeout(tipTimer);
      if (detectionTimer.current) {
        clearTimeout(detectionTimer.current);
      }
    };
  }, []);

  // Simulate AI detection with auto-capture
  useEffect(() => {
    if (autoCapture && scanState === 'ready') {
      // Start detection simulation after 2 seconds
      detectionTimer.current = setTimeout(() => {
        simulateDetection();
      }, 2000);
    }

    return () => {
      if (detectionTimer.current) {
        clearTimeout(detectionTimer.current);
      }
    };
  }, [autoCapture, scanState]);

  const simulateDetection = () => {
    setScanState('detecting');
    let confidence = 0;

    // Animate confidence building
    const interval = setInterval(() => {
      confidence += Math.random() * 20;
      if (confidence >= 85) {
        clearInterval(interval);
        setDetectionConfidence(confidence);

        // Trigger auto-capture
        Animated.timing(confidenceAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (autoCapture) {
            handleAutoCapture();
          }
        });
      } else {
        setDetectionConfidence(confidence);
      }
    }, 200);
  };

  const handleAutoCapture = async () => {
    // Haptic feedback for detection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Visual feedback
    setScanState('captured');

    // Capture photo
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
        });

        setCapturedImage(photo.uri);

        // Quick transition to results
        setTimeout(() => {
          setScanState('processing');

          // Navigate to results with seamless transition
          setTimeout(() => {
            router.push({
              pathname: '/quick-scan-result-improved',
              params: {
                imageUri: photo.uri,
                autoScanned: 'true',
              },
            });

            // Reset state for return
            setTimeout(() => {
              setScanState('ready');
              setDetectionConfidence(0);
            }, 500);
          }, 800);
        }, 400);
      } catch (error) {
        console.error('Auto-capture error:', error);
        setScanState('ready');
      }
    }
  };

  const handleManualCapture = async () => {
    if (scanState !== 'ready') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScanState('captured');

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
        });

        setCapturedImage(photo.uri);
        setScanState('processing');

        setTimeout(() => {
          router.push({
            pathname: '/quick-scan-result-improved',
            params: {
              imageUri: photo.uri,
              autoScanned: 'false',
            },
          });

          // Reset state
          setTimeout(() => {
            setScanState('ready');
            setCapturedImage(null);
          }, 500);
        }, 800);
      } catch (error) {
        console.error('Manual capture error:', error);
        setScanState('ready');
      }
    }
  };

  const handleGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Gallery Access',
          'We need access to your photos to help you find the perfect style match.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Allow', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setScanState('processing');

        setTimeout(() => {
          router.push({
            pathname: '/quick-scan-result-improved',
            params: {
              imageUri: result.assets[0].uri,
              autoScanned: 'false',
            },
          });
          setScanState('ready');
        }, 600);
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={FashionColors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={[FashionColors.primaryDark, FashionColors.primary]}
        style={styles.permissionContainer}
      >
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera" size={60} color={FashionColors.white} />
          </View>
          <Text style={styles.permissionTitle}>Camera Magic Awaits</Text>
          <Text style={styles.permissionText}>
            Let's unlock AI-powered fashion insights with your camera
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
            <Ionicons name="arrow-forward" size={20} color={FashionColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.skipButton}>
            <Text style={styles.skipText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Gradient Overlay for Premium Feel */}
        <LinearGradient
          colors={['rgba(107, 58, 160, 0.15)', 'transparent', 'rgba(31, 31, 35, 0.4)']}
          style={styles.gradientOverlay}
        />

        {/* Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <BlurView intensity={20} style={styles.blurButton}>
              <Ionicons name="close" size={24} color={FashionColors.white} />
            </BlurView>
          </TouchableOpacity>

          {autoCapture && (
            <Animated.View
              style={[
                styles.autoCaptureBadge,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.autoCaptureDot} />
              <Text style={styles.autoCaptureText}>AI Active</Text>
            </Animated.View>
          )}
        </View>

        {/* Smart Scanner Frame */}
        <View style={styles.scannerContainer}>
          <Animated.View
            style={[
              styles.scannerFrame,
              {
                transform: [
                  { scale: pulseAnim },
                  {
                    rotate: scanState === 'detecting'
                      ? rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      : '0deg'
                  }
                ],
                opacity: scanState === 'captured' ? 0.3 : 1,
              }
            ]}
          >
            {/* Animated Corner Brackets */}
            <View style={[styles.corner, styles.topLeft]}>
              <View style={styles.cornerLine} />
              <View style={[styles.cornerLine, styles.cornerLineVertical]} />
            </View>
            <View style={[styles.corner, styles.topRight]}>
              <View style={styles.cornerLine} />
              <View style={[styles.cornerLine, styles.cornerLineVertical]} />
            </View>
            <View style={[styles.corner, styles.bottomLeft]}>
              <View style={styles.cornerLine} />
              <View style={[styles.cornerLine, styles.cornerLineVertical]} />
            </View>
            <View style={[styles.corner, styles.bottomRight]}>
              <View style={styles.cornerLine} />
              <View style={[styles.cornerLine, styles.cornerLineVertical]} />
            </View>

            {/* Detection Indicator */}
            {scanState === 'detecting' && (
              <Animated.View
                style={[
                  styles.detectionIndicator,
                  {
                    opacity: confidenceAnim,
                    transform: [{ scale: confidenceAnim }]
                  }
                ]}
              >
                <LinearGradient
                  colors={[FashionColors.primaryLight, FashionColors.accent]}
                  style={styles.detectionGradient}
                >
                  <Text style={styles.detectionPercent}>
                    {Math.round(detectionConfidence)}%
                  </Text>
                  <Text style={styles.detectionLabel}>Confidence</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Captured Flash Effect */}
            {scanState === 'captured' && (
              <Animated.View style={styles.captureFlash} />
            )}
          </Animated.View>

          {/* Smart Tips */}
          {showTip && scanState === 'ready' && (
            <Animated.View
              style={[
                styles.tipContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }]
                }
              ]}
            >
              <BlurView intensity={80} style={styles.tipBlur}>
                <Ionicons name="sparkles" size={16} color={FashionColors.secondary} />
                <Text style={styles.tipText}>AI will auto-detect fashion items</Text>
              </BlurView>
            </Animated.View>
          )}
        </View>

        {/* Status Messages */}
        <View style={styles.statusContainer}>
          {scanState === 'ready' && (
            <Animated.Text style={[styles.statusText, { opacity: fadeAnim }]}>
              Point at any fashion item
            </Animated.Text>
          )}
          {scanState === 'detecting' && (
            <Text style={styles.statusTextActive}>Analyzing style...</Text>
          )}
          {scanState === 'captured' && (
            <Text style={styles.statusTextSuccess}>Perfect shot!</Text>
          )}
          {scanState === 'processing' && (
            <Text style={styles.statusTextActive}>Creating your style report...</Text>
          )}
        </View>

        {/* Simplified Bottom Controls */}
        <View style={styles.bottomContainer}>
          {/* Swipe Indicator */}
          <Animated.View
            style={[
              styles.swipeIndicator,
              { opacity: scanState === 'ready' ? 1 : 0.3 }
            ]}
          >
            <Ionicons name="chevron-up" size={20} color={FashionColors.white} />
            <Text style={styles.swipeText}>Swipe up for gallery</Text>
          </Animated.View>

          {/* Single Action Button */}
          <View style={styles.actionContainer}>
            {scanState === 'ready' && (
              <>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setAutoCapture(!autoCapture)}
                >
                  <Ionicons
                    name={autoCapture ? "eye" : "eye-off"}
                    size={20}
                    color={FashionColors.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleManualCapture}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[FashionColors.secondary, FashionColors.accent]}
                    style={styles.captureGradient}
                  >
                    <View style={styles.captureInner}>
                      <Ionicons name="scan" size={32} color={FashionColors.white} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={handleGallery}
                >
                  <Ionicons name="images" size={20} color={FashionColors.white} />
                </TouchableOpacity>
              </>
            )}

            {scanState !== 'ready' && (
              <View style={styles.processingIndicator}>
                <ActivityIndicator size="large" color={FashionColors.secondary} />
              </View>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FashionColors.charcoal,
  },
  camera: {
    flex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  autoCaptureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  autoCaptureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FashionColors.secondary,
  },
  autoCaptureText: {
    color: FashionColors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Scanner Styles
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75 * 1.3,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  cornerLine: {
    position: 'absolute',
    backgroundColor: FashionColors.secondary,
    height: 3,
    width: 40,
    borderRadius: 2,
    shadowColor: FashionColors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  cornerLineVertical: {
    width: 3,
    height: 40,
  },
  detectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -60,
    marginTop: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  detectionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionPercent: {
    fontSize: 28,
    fontWeight: '700',
    color: FashionColors.white,
  },
  detectionLabel: {
    fontSize: 11,
    color: FashionColors.white,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  captureFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FashionColors.white,
    opacity: 0.8,
  },

  // Tips
  tipContainer: {
    position: 'absolute',
    bottom: -80,
    alignSelf: 'center',
  },
  tipBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(232, 180, 184, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232, 180, 184, 0.3)',
  },
  tipText: {
    color: FashionColors.white,
    fontSize: 13,
    fontWeight: '500',
  },

  // Status
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  statusTextActive: {
    color: FashionColors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: FashionColors.success,
    fontSize: 16,
    fontWeight: '600',
  },

  // Bottom Controls
  bottomContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    alignItems: 'center',
  },
  swipeIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  swipeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: FashionColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureGradient: {
    flex: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  processingIndicator: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Permission Screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: FashionColors.white,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FashionColors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 20,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: FashionColors.primary,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
});