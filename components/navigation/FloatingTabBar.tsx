import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const FloatingTabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // Only show Home and Wardrobe tabs
  const allowedTabs = ['home', 'wardrobe'];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBarWrapper}>
        <BlurView
          intensity={80}
          tint="light"
          style={[StyleSheet.absoluteFillObject, styles.blurContainer]}
        />
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = state.index === index;

            // Only show Home and Wardrobe tabs
            if (!allowedTabs.includes(route.name)) return null;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {options.tabBarIcon &&
                    options.tabBarIcon({
                      focused: isFocused,
                      color: isFocused ? '#5B21B6' : '#94A3B8',
                      size: 24,
                    })}
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused ? '#5B21B6' : '#94A3B8',
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
                {isFocused && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40, // Increased padding for better floating effect
    paddingBottom: 30,
  },
  tabBarWrapper: {
    borderRadius: 40, // More rounded for 2 tabs
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.92)',
      android: 'rgba(255, 255, 255, 0.96)',
    }),
    shadowColor: '#5B21B6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(91, 33, 182, 0.05)',
  },
  blurContainer: {
    borderRadius: 40,
  },
  tabBar: {
    flexDirection: 'row',
    height: 65, // Slightly shorter for 2 tabs
    paddingHorizontal: 20, // More padding for 2 tabs
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5B21B6',
  },
});