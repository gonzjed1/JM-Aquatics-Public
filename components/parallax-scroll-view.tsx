import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const HEADER_HEIGHT = 250;

/**
 * On web (and tablets) the app stays a phone-width column instead of stretching
 * across the window. Applied here so every screen built on this layout keeps
 * the pattern for free. The header background still spans full width; only its
 * content is capped, so the title lines up with the body below it.
 */
const CONTENT_MAX_WIDTH = 600;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  /** Draws a back chevron over the header. Detail screens pass `router.back`. */
  onBack?: () => void;
  /** Action slot in the header's top-right corner — a gear, an "+ Add" button. */
  headerRight?: ReactNode;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  onBack,
  headerRight,
}: Props) {
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  const hasHeaderBar = Boolean(onBack || headerRight);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}>
        <View style={styles.headerContent}>
          {headerImage}
          {hasHeaderBar ? (
            <View style={[styles.headerBar, { top: insets.top + 8 }]}>
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
                  <IconSymbol name="chevron.left" size={26} color="#FFFFFF" />
                </Pressable>
              ) : (
                <View />
              )}
              {headerRight ?? <View />}
            </View>
          ) : null}
        </View>
      </Animated.View>
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  headerBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
