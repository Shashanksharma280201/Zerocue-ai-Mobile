import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fashionApi } from '../../lib/api/fashion';
import { aiStyleEngine } from '../../lib/ai/styleEngine';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  image?: string;
  suggestions?: string[];
  products?: any[];
  loading?: boolean;
}

interface FashionAdvisorChatProps {
  onClose?: () => void;
  initialContext?: {
    image?: string;
    occasion?: string;
    analysis?: any;
  };
}

export const FashionAdvisorChat: React.FC<FashionAdvisorChatProps> = ({
  onClose,
  initialContext,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Hi! I'm your AI Fashion Advisor. I can help you with:\n\n• Style recommendations\n• Outfit combinations\n• Color matching\n• Shopping suggestions\n• Wardrobe optimization\n\nHow can I assist you today?",
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        'What should I wear today?',
        'Help me build a capsule wardrobe',
        'Suggest outfits for a wedding',
        'What colors suit me best?',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString() + '_loading',
      text: '...',
      isUser: false,
      timestamp: new Date(),
      loading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Get AI response
      const response = await fashionApi.askFashionQuestion(text);

      // Process response for special content
      const processedResponse = await processAIResponse(response.answer, text);

      // Remove loading message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading);
        return [
          ...filtered,
          {
            id: Date.now().toString() + '_ai',
            text: processedResponse.text,
            isUser: false,
            timestamp: new Date(),
            suggestions: processedResponse.suggestions,
            products: processedResponse.products,
          },
        ];
      });
    } catch (error) {
      console.error('Chat error:', error);

      // Remove loading message and add error
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading);
        return [
          ...filtered,
          {
            id: Date.now().toString() + '_error',
            text: 'Sorry, I encountered an error. Please try again.',
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const processAIResponse = async (answer: string, question: string) => {
    let suggestions: string[] = [];
    let products: any[] = [];

    // Check for specific intents
    if (question.toLowerCase().includes('outfit') ||
        question.toLowerCase().includes('wear')) {

      // Get outfit recommendations
      const recommendations = await aiStyleEngine.generateOutfitRecommendations(
        'casual',
        { temp: 25, condition: 'sunny' },
        []
      );

      // Extract product suggestions
      products = recommendations.shoppingList.map(item => ({
        name: item.item,
        priceINR: item.priceINR,
        reasons: item.reasons,
      }));

      // Add follow-up suggestions
      suggestions = [
        'Show me similar styles',
        'What about for evening wear?',
        'Suggest accessories',
        'Find budget alternatives',
      ];

      // Add price context to answer
      answer += `\n\n💰 Estimated budget: ₹${recommendations.estimatedCostINR.toLocaleString('en-IN')}`;
    } else if (question.toLowerCase().includes('color')) {
      suggestions = [
        'What are complementary colors?',
        'Best colors for my skin tone',
        'Seasonal color palettes',
        'How to mix patterns',
      ];
    } else if (question.toLowerCase().includes('capsule') ||
               question.toLowerCase().includes('wardrobe')) {
      suggestions = [
        'Essential items list',
        'Budget breakdown',
        'Seasonal additions',
        'Maintenance tips',
      ];
    }

    return {
      text: answer,
      suggestions,
      products,
    };
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.loading) {
      return (
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[styles.messageBubble, styles.aiBubble]}
        >
          <View style={styles.loadingDots}>
            <View style={[styles.dot, { animationDelay: '0ms' }]} />
            <View style={[styles.dot, { animationDelay: '200ms' }]} />
            <View style={[styles.dot, { animationDelay: '400ms' }]} />
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        layout={Layout.springify()}
        style={styles.messageContainer}
      >
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {!item.isUser && (
            <View style={styles.aiAvatar}>
              <View style={styles.avatarCircle}>
                <Ionicons name="sparkles" size={16} color="white" />
              </View>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              item.isUser ? styles.userText : styles.aiText,
            ]}
          >
            {item.text}
          </Text>

          {item.image && (
            <Image source={{ uri: item.image }} style={styles.messageImage} />
          )}

          {item.products && item.products.length > 0 && (
            <View style={styles.productsContainer}>
              {item.products.map((product, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.productCard}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>
                    ₹{product.priceINR.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {item.suggestions && item.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {item.suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  useEffect(() => {
    // Scroll to bottom when new message is added
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Process initial context if provided
    if (initialContext?.analysis) {
      const contextMessage = `I've analyzed your outfit. ${initialContext.analysis.outfit_analysis.overall_feedback}

Would you like me to suggest improvements or alternative styling options?`;

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: contextMessage,
          isUser: false,
          timestamp: new Date(),
          image: initialContext.image,
          suggestions: [
            'Suggest improvements',
            'Show alternative styles',
            'Find similar items online',
            'Create a shopping list',
          ],
        },
      ]);
    }
  }, [initialContext]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <Ionicons name="chatbubbles" size={20} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Fashion Advisor</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? 'Typing...' : 'Online'}
              </Text>
            </View>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <BlurView intensity={80} tint="light" style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about fashion..."
            placeholderTextColor={Colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <View style={[
              styles.sendButtonCircle,
              inputText.trim() && styles.sendButtonActive
            ]}>
              <Ionicons name="send" size={18} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    marginVertical: Spacing.xs,
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  aiAvatar: {
    marginBottom: Spacing.xs,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  aiText: {
    color: Colors.text,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  productsContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productName: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
  },
  productPrice: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  suggestionText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textLight,
    opacity: 0.6,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.light.primary,
  },
});