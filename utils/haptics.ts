/**
 * ZEROCUE HAPTIC FEEDBACK SYSTEM
 * Tactile feedback patterns for top 1% feel
 * Inspired by: iOS, Arc Browser, Linear
 */

import * as Haptics from 'expo-haptics';

// ============================================
// HAPTIC PATTERNS
// ============================================

/**
 * Ultra-light haptic - For hover states, subtle feedback
 * Use when: Scrolling through lists, swiping between tabs
 */
export const hapticUltraLight = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Light haptic - For taps, selections
 * Use when: Tapping buttons, selecting items, toggling switches
 */
export const hapticLight = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium haptic - For important actions
 * Use when: Adding to cart, opening modals, scanning products
 */
export const hapticMedium = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Heavy haptic - For critical actions
 * Use when: Checkout, deleting items, confirming orders
 */
export const hapticHeavy = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Success haptic - For successful actions
 * Use when: Item added to cart, order placed, payment successful
 */
export const hapticSuccess = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning haptic - For warnings, important notices
 * Use when: Item out of stock, cart limit reached
 */
export const hapticWarning = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Error haptic - For errors, failed actions
 * Use when: Payment failed, network error, validation error
 */
export const hapticError = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Selection haptic - For changing selections
 * Use when: Picking sizes, choosing colors, changing quantities
 */
export const hapticSelection = async () => {
  await Haptics.selectionAsync();
};

// ============================================
// COMPOSITE PATTERNS
// ============================================

/**
 * Swipe gesture haptic - Light feedback during swipe
 * Use when: Swiping to delete, swiping between products
 */
export const hapticSwipe = async () => {
  await hapticUltraLight();
};

/**
 * Long press haptic - Medium feedback when long press activates
 * Use when: Long-pressing for context menu, multi-select mode
 */
export const hapticLongPress = async () => {
  await hapticMedium();
};

/**
 * Add to cart haptic - Success with medium impact
 * Use when: Successfully adding item to cart
 */
export const hapticAddToCart = async () => {
  await hapticMedium();
  setTimeout(() => hapticSuccess(), 100);
};

/**
 * Remove from cart haptic - Warning feedback
 * Use when: Removing item from cart
 */
export const hapticRemoveFromCart = async () => {
  await hapticWarning();
};

/**
 * Checkout success haptic - Double success (celebration!)
 * Use when: Order successfully placed
 */
export const hapticCheckoutSuccess = async () => {
  await hapticSuccess();
  setTimeout(() => hapticHeavy(), 150);
  setTimeout(() => hapticSuccess(), 300);
};

/**
 * Scan success haptic - Quick medium + success
 * Use when: Successfully scanning a product barcode
 */
export const hapticScanSuccess = async () => {
  await hapticMedium();
  setTimeout(() => hapticSuccess(), 80);
};

/**
 * Button press haptic - Light feedback on press
 * Use when: Pressing any interactive button
 */
export const hapticButtonPress = async () => {
  await hapticLight();
};

/**
 * Toggle haptic - Selection feedback
 * Use when: Toggling switches, checkboxes
 */
export const hapticToggle = async () => {
  await hapticSelection();
};

/**
 * Pull to refresh haptic - Light feedback when threshold reached
 * Use when: Pull-to-refresh gesture completes
 */
export const hapticPullRefresh = async () => {
  await hapticLight();
};

/**
 * Page transition haptic - Ultra-light feedback
 * Use when: Navigating between screens
 */
export const hapticPageTransition = async () => {
  await hapticUltraLight();
};

// ============================================
// CONTEXTUAL PATTERNS (ZeroCue Specific)
// ============================================

/**
 * Size selection haptic - Selection feedback with confirmation
 * Use when: Selecting clothing size
 */
export const hapticSizeSelect = async () => {
  await hapticSelection();
  setTimeout(() => hapticLight(), 50);
};

/**
 * Color selection haptic - Light selection feedback
 * Use when: Choosing product color
 */
export const hapticColorSelect = async () => {
  await hapticSelection();
};

/**
 * Stock check haptic - Based on availability
 * Use when: Checking if size is in stock
 */
export const hapticStockCheck = async (inStock: boolean) => {
  if (inStock) {
    await hapticSuccess();
  } else {
    await hapticWarning();
  }
};

/**
 * Floating button haptic - Medium with quick follow-up
 * Use when: Pressing floating scan button
 */
export const hapticFloatingButton = async () => {
  await hapticMedium();
  setTimeout(() => hapticLight(), 80);
};

/**
 * Reserve item haptic - Success pattern
 * Use when: Successfully reserving item for trial
 */
export const hapticReserveItem = async () => {
  await hapticMedium();
  setTimeout(() => hapticSuccess(), 120);
};

/**
 * Gesture complete haptic - Light confirmation
 * Use when: Completing a swipe gesture (swipe-to-add, swipe-to-delete)
 */
export const hapticGestureComplete = async () => {
  await hapticLight();
};

/**
 * Modal open haptic - Light feedback
 * Use when: Opening modals, bottom sheets
 */
export const hapticModalOpen = async () => {
  await hapticLight();
};

/**
 * Modal close haptic - Ultra-light feedback
 * Use when: Closing modals, bottom sheets
 */
export const hapticModalClose = async () => {
  await hapticUltraLight();
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if haptics are supported
 */
export const isHapticsSupported = async (): Promise<boolean> => {
  // Haptics are always supported in Expo
  return true;
};

/**
 * Disable all haptics (user preference)
 * Store in AsyncStorage/MMKV for persistence
 */
let hapticsEnabled = true;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

export const getHapticsEnabled = (): boolean => {
  return hapticsEnabled;
};

/**
 * Wrapper to check if haptics are enabled before firing
 */
const withHapticCheck = (hapticFn: () => Promise<void>) => {
  return async () => {
    if (hapticsEnabled) {
      await hapticFn();
    }
  };
};

// Export wrapped versions (respects user preferences)
export const Haptic = {
  ultraLight: withHapticCheck(hapticUltraLight),
  light: withHapticCheck(hapticLight),
  medium: withHapticCheck(hapticMedium),
  heavy: withHapticCheck(hapticHeavy),
  success: withHapticCheck(hapticSuccess),
  warning: withHapticCheck(hapticWarning),
  error: withHapticCheck(hapticError),
  selection: withHapticCheck(hapticSelection),

  // Composite patterns
  swipe: withHapticCheck(hapticSwipe),
  longPress: withHapticCheck(hapticLongPress),
  addToCart: withHapticCheck(hapticAddToCart),
  removeFromCart: withHapticCheck(hapticRemoveFromCart),
  checkoutSuccess: withHapticCheck(hapticCheckoutSuccess),
  scanSuccess: withHapticCheck(hapticScanSuccess),
  buttonPress: withHapticCheck(hapticButtonPress),
  toggle: withHapticCheck(hapticToggle),
  pullRefresh: withHapticCheck(hapticPullRefresh),
  pageTransition: withHapticCheck(hapticPageTransition),

  // ZeroCue specific
  sizeSelect: withHapticCheck(hapticSizeSelect),
  colorSelect: withHapticCheck(hapticColorSelect),
  stockCheck: (inStock: boolean) => withHapticCheck(() => hapticStockCheck(inStock))(),
  floatingButton: withHapticCheck(hapticFloatingButton),
  reserveItem: withHapticCheck(hapticReserveItem),
  gestureComplete: withHapticCheck(hapticGestureComplete),
  modalOpen: withHapticCheck(hapticModalOpen),
  modalClose: withHapticCheck(hapticModalClose),
};
