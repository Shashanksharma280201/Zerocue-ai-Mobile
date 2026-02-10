import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

type ReturnStatus = 'pending' | 'approved' | 'in_transit' | 'received' | 'refunded' | 'rejected';

interface ReturnRequest {
  id: string;
  orderId: string;
  type: 'return' | 'exchange';
  status: ReturnStatus;
  reason: string;
  itemsCount: number;
  amount: number;
  requestDate: string;
  lastUpdate: string;
}

// Mock data
const MOCK_RETURNS: ReturnRequest[] = [
  {
    id: 'RET-001',
    orderId: 'ORD-123',
    type: 'return',
    status: 'approved',
    reason: 'Defective/Damaged',
    itemsCount: 1,
    amount: 1299,
    requestDate: '2025-02-03',
    lastUpdate: '2025-02-04',
  },
  {
    id: 'RET-002',
    orderId: 'ORD-118',
    type: 'exchange',
    status: 'pending',
    reason: 'Size/Fit Issue',
    itemsCount: 1,
    amount: 2499,
    requestDate: '2025-02-05',
    lastUpdate: '2025-02-05',
  },
  {
    id: 'RET-003',
    orderId: 'ORD-115',
    type: 'return',
    status: 'refunded',
    reason: 'Changed Mind',
    itemsCount: 2,
    amount: 3598,
    requestDate: '2025-01-28',
    lastUpdate: '2025-02-02',
  },
];

const getStatusConfig = (status: ReturnStatus) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending Review',
        icon: 'time' as const,
        color: Colors.warning,
        bgColor: Colors.warning + '15',
      };
    case 'approved':
      return {
        label: 'Approved',
        icon: 'checkmark-circle' as const,
        color: Colors.success,
        bgColor: Colors.success + '15',
      };
    case 'in_transit':
      return {
        label: 'In Transit',
        icon: 'car' as const,
        color: Colors.primary,
        bgColor: Colors.primary + '15',
      };
    case 'received':
      return {
        label: 'Received',
        icon: 'cube' as const,
        color: Colors.primary,
        bgColor: Colors.primary + '15',
      };
    case 'refunded':
      return {
        label: 'Refunded',
        icon: 'cash' as const,
        color: Colors.success,
        bgColor: Colors.success + '15',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        icon: 'close-circle' as const,
        color: Colors.error,
        bgColor: Colors.error + '15',
      };
  }
};

export default function TrackReturnsScreen() {
  const router = useRouter();

  const handleReturnPress = (returnId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to detailed return status
    // router.push(`/returns/detail/${returnId}`);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="return-up-back-outline" size={80} color={Colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>No Returns or Exchanges</Text>
      <Text style={styles.emptyText}>
        You haven't requested any returns or exchanges yet
      </Text>
    </View>
  );

  const renderReturnCard = ({ item }: { item: ReturnRequest }) => {
    const statusConfig = getStatusConfig(item.status);
    const isActive = ['pending', 'approved', 'in_transit'].includes(item.status);

    return (
      <TouchableOpacity
        style={styles.returnCard}
        onPress={() => handleReturnPress(item.id)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isActive ? [Colors.cream[50], Colors.cream[100]] : [Colors.white, Colors.backgroundSecondary]}
          style={styles.returnCardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.returnId}>{item.id}</Text>
              <Text style={styles.returnType}>
                {item.type === 'return' ? 'Return' : 'Exchange'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Order</Text>
                <Text style={styles.detailValue}>{item.orderId}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Items</Text>
                <Text style={styles.detailValue}>{item.itemsCount}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>₹{item.amount.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.reasonRow}>
              <Ionicons name="help-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textLight} />
              <Text style={styles.dateText}>
                Requested on {new Date(item.requestDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Footer */}
          {isActive && (
            <View style={styles.cardFooter}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.updateText}>
                Last updated {new Date(item.lastUpdate).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Returns & Exchanges',
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

      {MOCK_RETURNS.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={MOCK_RETURNS}
          renderItem={renderReturnCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  listContent: {
    padding: Spacing.lg,
  },
  returnCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  returnCardGradient: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  returnId: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  returnType: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  cardDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white + '60',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  reasonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  updateText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
