import React from 'react';
import {
  StyleSheet,
  Dimensions,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useAnimatedRef,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerImage?: ImageSourcePropType;
  headerHeight?: number;
  headerComponent?: React.ReactNode;
  fadeHeader?: boolean;
  stickyHeader?: React.ReactNode;
  onScroll?: (scrollY: number) => void;
  style?: ViewStyle;
}

export const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  children,
  headerImage,
  headerHeight = 300,
  headerComponent,
  fadeHeader = true,
  stickyHeader,
  onScroll,
  style,
}) => {
  const scrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (onScroll) {
        onScroll(event.contentOffset.y);
      }
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-headerHeight, 0, headerHeight],
      [headerHeight / 2, 0, -headerHeight / 3],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0],
      [2, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const headerOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight / 2, headerHeight],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: fadeHeader ? opacity : 1,
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [-headerHeight, 0],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [headerHeight - 50, headerHeight],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const contentContainerStyle = useAnimatedStyle(() => {
    return {
      paddingTop: headerHeight,
    };
  });

  return (
    <>
      {/* Parallax Header */}
      <Animated.View
        style={[
          styles.header,
          { height: headerHeight },
          headerAnimatedStyle,
        ]}
      >
        {headerImage && (
          <Animated.Image
            source={headerImage}
            style={[StyleSheet.absoluteFillObject, headerOpacityStyle]}
            resizeMode="cover"
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        {headerComponent && (
          <Animated.View style={[styles.headerContent, headerOpacityStyle]}>
            {headerComponent}
          </Animated.View>
        )}
      </Animated.View>

      {/* Sticky Header */}
      {stickyHeader && (
        <Animated.View style={[styles.stickyHeader, stickyHeaderStyle]}>
          {stickyHeader}
        </Animated.View>
      )}

      {/* Scrollable Content */}
      <Animated.ScrollView
        ref={scrollRef}
        style={[styles.scrollView, style]}
        contentContainerStyle={contentContainerStyle}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Animated.ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  headerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
});