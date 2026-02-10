import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

type ReturnType = 'return' | 'exchange';
type ReturnReason = 'defective' | 'wrong_item' | 'size_issue' | 'quality' | 'changed_mind' | 'other';

const RETURN_REASONS = [
  { value: 'defective' as ReturnReason, label: 'Defective/Damaged', icon: 'warning' },
  { value: 'wrong_item' as ReturnReason, label: 'Wrong Item Received', icon: 'close-circle' },
  { value: 'size_issue' as ReturnReason, label: 'Size/Fit Issue', icon: 'resize' },
  { value: 'quality' as ReturnReason, label: 'Poor Quality', icon: 'thumbs-down' },
  { value: 'changed_mind' as ReturnReason, label: 'Changed Mind', icon: 'refresh' },
  { value: 'other' as ReturnReason, label: 'Other Reason', icon: 'ellipsis-horizontal' },
];

// Mock order data
const MOCK_ORDER = {
  id: 'ORD-123',
  items: [
    { id: '1', name: 'Cotton T-Shirt', price: 599, quantity: 2, image: 'https://via.placeholder.com/100' },
    { id: '2', name: 'Denim Jeans', price: 1299, quantity: 1, image: 'https://via.placeholder.com/100' },
  ],
  total: 2497,
  date: '2025-02-01',
};

export default function RequestReturnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [returnType, setReturnType] = useState<ReturnType>('return');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedReason, setSelectedReason] = useState<ReturnReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleToggleItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to return');
      return;
    }

    if (!selectedReason) {
      Alert.alert('No Reason Selected', 'Please select a reason for return');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a detailed description');
      return;
    }

    try {
      setSubmitting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // TODO: Submit to API
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Request Submitted',
        `Your ${returnType} request has been submitted successfully. You'll receive updates via notifications.`,
        [
          {
            text: 'View Status',
            onPress: () => router.replace('/returns/track'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Request Return/Exchange',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTitleStyle: {
            fontSize: FontSize.lg,
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
        {/* Return Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What would you like to do?</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, returnType === 'return' && styles.typeButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setReturnType('return');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back-circle"
                size={32}
                color={returnType === 'return' ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.typeButtonText, returnType === 'return' && styles.typeButtonTextActive]}>
                Return
              </Text>
              <Text style={styles.typeButtonDesc}>Get a refund</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, returnType === 'exchange' && styles.typeButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setReturnType('exchange');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="swap-horizontal"
                size={32}
                color={returnType === 'exchange' ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.typeButtonText, returnType === 'exchange' && styles.typeButtonTextActive]}>
                Exchange
              </Text>
              <Text style={styles.typeButtonDesc}>Get a replacement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Select Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Items ({selectedItems.size})</Text>
          {MOCK_ORDER.items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => handleToggleItem(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selectedItems.has(item.id) && styles.checkboxChecked]}>
                {selectedItems.has(item.id) && (
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                )}
              </View>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Select Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for {returnType}</Text>
          <View style={styles.reasonsGrid}>
            {RETURN_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.value && styles.reasonCardActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedReason(reason.value);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={reason.icon as any}
                  size={24}
                  color={selectedReason === reason.value ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason.value && styles.reasonTextActive,
                  ]}
                >
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe the Issue *</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Please provide detailed information about the issue..."
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            {returnType === 'return'
              ? 'Refund will be processed within 5-7 business days after we receive the item.'
              : 'Exchange items will be shipped once we receive and verify the returned item.'}
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {submitting ? (
              <Text style={styles.submitText}>Submitting...</Text>
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.white} />
                <Text style={styles.submitText}>Submit Request</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  typeButtonTextActive: {
    color: Colors.primary,
  },
  typeButtonDesc: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reasonCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  reasonCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  reasonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  reasonTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  textArea: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cream[200],
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    gap: Spacing.sm,
  },
  submitText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
