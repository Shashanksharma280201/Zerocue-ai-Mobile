import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useShoppingListStore } from '../lib/stores/shoppingListStore';

const EMOJI_OPTIONS = ['📝', '🛒', '🎯', '💼', '🏠', '🎉', '🎁', '💪', '🌟', '❤️'];

export default function ShoppingListsScreen() {
  const router = useRouter();
  const { lists, createList, deleteList } = useShoppingListStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');

  const handleCreateList = () => {
    if (!newListName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a list name');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newList = createList(newListName.trim(), newListDescription.trim() || undefined, selectedEmoji);

    setShowCreateModal(false);
    setNewListName('');
    setNewListDescription('');
    setSelectedEmoji('📝');

    // Navigate to the new list
    router.push(`/shopping-list/${newList.id}`);
  };

  const handleDeleteList = (listId: string, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteList(listId);
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="list-outline" size={80} color={Colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>No Shopping Lists</Text>
      <Text style={styles.emptyText}>
        Create lists to organize your shopping and never forget an item
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCreateModal(true);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
          style={styles.emptyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.emptyButtonText}>Create Your First List</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderListCard = ({ item }: { item: any }) => {
    const itemCount = item.items.length;
    const checkedCount = item.items.filter((i: any) => i.checked).length;
    const progress = itemCount > 0 ? checkedCount / itemCount : 0;

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/shopping-list/${item.id}`);
        }}
        onLongPress={() => handleDeleteList(item.id, item.name)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[Colors.cream[50], Colors.cream[100]]}
          style={styles.listCardGradient}
        >
          <View style={styles.listCardHeader}>
            <View style={styles.listCardLeft}>
              <Text style={styles.listEmoji}>{item.emoji}</Text>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.listDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </View>

          <View style={styles.listCardFooter}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {checkedCount} of {itemCount} items
              </Text>
              <Text style={styles.progressPercentage}>
                {itemCount > 0 ? Math.round(progress * 100) : 0}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Shopping Lists',
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
          headerRight: () => lists.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowCreateModal(true);
              }}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={28} color={Colors.primary} />
            </TouchableOpacity>
          ) : null,
        }}
      />

      {lists.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create List Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Shopping List</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                  setNewListDescription('');
                  setSelectedEmoji('📝');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Emoji Selection */}
            <View style={styles.emojiSection}>
              <Text style={styles.fieldLabel}>Choose an Icon</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      selectedEmoji === emoji && styles.emojiOptionActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedEmoji(emoji);
                    }}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* List Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>List Name *</Text>
              <TextInput
                style={styles.input}
                value={newListName}
                onChangeText={setNewListName}
                placeholder="e.g., Weekly Groceries"
                placeholderTextColor={Colors.textLight}
                autoFocus
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newListDescription}
                onChangeText={setNewListDescription}
                placeholder="Add notes about this list..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateList}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.createButtonText}>Create List</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  listCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  listCardGradient: {
    padding: Spacing.lg,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  listCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  listDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  listCardFooter: {
    gap: Spacing.xs,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  progressPercentage: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
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
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSection: {
    marginBottom: Spacing.lg,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  emojiText: {
    fontSize: 28,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
  },
  createButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
    marginTop: Spacing.sm,
  },
  createButtonGradient: {
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
