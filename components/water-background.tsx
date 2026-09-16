import { useEffect, useRef, type PropsWithChildren } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * Animated pool-water backdrop.
 *
 * A deep blue gradient with a few large, soft, light-blue shapes drifting and
 * breathing across it — the look of light caustics on the bottom of a pool.
 * Each shape runs its own slow loop with a staggered start, so the combined
 * motion never lines up into a visible repeat.
 *
 * Deliberately dependency-free: the gradient is a stack of thin flex rows and
 * the shapes are plain Views driven by the Animated API, so one implementation
 * runs on iOS, Android and web. If it ever costs too much on a weak device,
 * remove entries from BLOBS rather than stopping the animation.
 */

/** #4A90D9 at the surface down to #1D5A8A in the deep end. */
const TOP_COLOR = [0x4a, 0x90, 0xd9] as const;
const BOTTOM_COLOR = [0x1d, 0x5a, 0x8a] as const;

/** Thin horizontal bands fake a vertical gradient without a gradient library. */
const BAND_COUNT = 48;

function bandColor(t: number) {
  const mix = (from: number, to: number) => Math.round(from + (to - from) * t);
  return `rgb(${mix(TOP_COLOR[0], BOTTOM_COLOR[0])}, ${mix(TOP_COLOR[1], BOTTOM_COLOR[1])}, ${mix(
    TOP_COLOR[2],
    BOTTOM_COLOR[2]
  )})`;
}

const BANDS = Array.from({ length: BAND_COUNT }, (_, i) => bandColor(i / (BAND_COUNT - 1)));

/** react-native-web has no native animation driver, so the JS driver runs there. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

type BlobSpec = {
  /** Width as a share of the backdrop; height follows via aspectRatio. */
  width: DimensionValue;
  left: DimensionValue;
  top: DimensionValue;
  driftX: number;
  driftY: number;
  scaleTo: number;
  opacity: number;
  /** One leg of the loop. A full out-and-back takes twice this. */
  duration: number;
  /** Staggered starts keep the shapes from moving in lockstep. */
  delay: number;
};

const BLOBS: BlobSpec[] = [
  {
    width: '85%',
    left: '-25%',
    top: '-8%',
    driftX: 44,
    driftY: 28,
    scaleTo: 1.16,
    opacity: 0.22,
    duration: 5500,
    delay: 0,
  },
  {
    width: '70%',
    left: '45%',
    top: '12%',
    driftX: -38,
    driftY: 34,
    scaleTo: 1.1,
    opacity: 0.18,
    duration: 7000,
    delay: 1700,
  },
  {
    width: '95%',
    left: '-15%',
    top: '48%',
    driftX: 32,
    driftY: -26,
    scaleTo: 1.2,
    opacity: 0.16,
    duration: 4750,
    delay: 3300,
  },
  {
    width: '60%',
    left: '58%',
    top: '66%',
    driftX: -30,
    driftY: -36,
    scaleTo: 1.14,
    opacity: 0.2,
    duration: 6250,
    delay: 5100,
  },
];

function Blob({ spec }: { spec: BlobSpec }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const leg = (toValue: number) =>
      Animated.timing(progress, {
        toValue,
        duration: spec.duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: USE_NATIVE_DRIVER,
      });

    const loop = Animated.loop(Animated.sequence([leg(1), leg(0)]));
    const startTimer = setTimeout(() => loop.start(), spec.delay);

    return () => {
      clearTimeout(startTimer);
      loop.stop();
    };
  }, [progress, spec.duration, spec.delay]);

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: spec.width,
          left: spec.left,
          top: spec.top,
          opacity: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [spec.opacity, spec.opacity * 1.4, spec.opacity],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, spec.driftX],
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, spec.driftY],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, spec.scaleTo],
              }),
            },
          ],
        },
      ]}>
      {/* Concentric rings fake a soft edge — no blur filter needed. */}
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringMid]} />
      <View style={[styles.ring, styles.ringCore]} />
    </Animated.View>
  );
}

export function WaterBackground({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <View style={[styles.root, style]}>
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        {BANDS.map((color, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: color }} />
        ))}
        {BLOBS.map((spec, i) => (
          <Blob key={i} spec={spec} />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Shapes drift past the edges; clipping keeps them from growing the page on web.
    overflow: 'hidden',
    backgroundColor: '#1D5A8A',
  },
  blob: {
    position: 'absolute',
    aspectRatio: 1,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#BFE4FB',
  },
  ringOuter: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  ringMid: {
    top: '14%',
    left: '14%',
    right: '14%',
    bottom: '14%',
    opacity: 0.4,
  },
  ringCore: {
    top: '30%',
    left: '30%',
    right: '30%',
    bottom: '30%',
    opacity: 0.5,
  },
});
