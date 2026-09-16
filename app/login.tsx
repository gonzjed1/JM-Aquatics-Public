import { useEvent } from 'expo';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { WaterBackground } from '@/components/water-background';
import { useAuth } from '@/contexts/auth-context';

const LOGO = require('../design-refs/logo.webp');

/** Overhead drone shot of a lap pool, cut to a seamless 12s loop. */
const POOL_VIDEO = require('../assets/videos/pool-swimmers.mp4');

/** Navy ink on the frosted cards, white over the water. Both are fixed: the */
/** cards stay light in dark mode, so themed text would vanish on them.      */
const INK = '#0F2C3F';
const ON_WATER = '#FFFFFF';

/** react-native-web has no native animation driver. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

function CardText(props: ThemedTextProps) {
  return <ThemedText lightColor={INK} darkColor={INK} {...props} />;
}

function WaterText(props: ThemedTextProps) {
  return <ThemedText lightColor={ON_WATER} darkColor={ON_WATER} {...props} />;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInAsWorker, signInAsAdmin } = useAuth();

  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const player = useVideoPlayer(POOL_VIDEO, (p) => {
    p.loop = true;
    p.muted = true; // required for autoplay to be allowed on web
  });

  // On web the player forwards play() to whatever <video> elements are mounted,
  // and the setup callback above runs before VideoView has mounted one — so the
  // opening play has to happen here, once children exist.
  useEffect(() => {
    player.play();
  }, [player]);

  // On web `playingChange` is wired to the element's `play` event, which fires
  // the instant playback is *requested* — on a slow first visit that can be
  // several seconds before a single frame has arrived. Revealing on that alone
  // dropped the water fallback over an empty <video>, leaving a flat blue gap.
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // So the reveal also waits for the media clock to move: currentTime only
  // advances once frames are actually decoding and being presented.
  const [frameSeen, setFrameSeen] = useState(false);
  useEffect(() => {
    if (!isPlaying) {
      setFrameSeen(false);
      return;
    }
    const check = () => {
      if (player.currentTime > 0.1) {
        setFrameSeen(true);
        clearInterval(timer);
      }
    };
    const timer = setInterval(check, 150);
    check();
    return () => clearInterval(timer);
  }, [isPlaying, player]);

  const videoLive = isPlaying && frameSeen;

  // The animated water sits underneath until the video has fully faded in, and
  // comes back if playback never starts (autoplay blocked, decode failure).
  const [showWater, setShowWater] = useState(true);
  const videoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!videoLive) {
      videoOpacity.setValue(0);
      setShowWater(true);
      return;
    }
    const fade = Animated.timing(videoOpacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    fade.start(({ finished }) => {
      if (finished) setShowWater(false);
    });
    return () => fade.stop();
  }, [videoLive, videoOpacity]);

  const handleAdminSignIn = () => {
    if (signInAsAdmin(passcode)) {
      setPasscode('');
      setError(null);
    } else {
      setError('That passcode is not right.');
    }
  };

  return (
    <View style={styles.root}>
      {showWater ? <WaterBackground style={StyleSheet.absoluteFill} /> : null}

      <Animated.View style={[styles.videoLayer, { opacity: videoOpacity }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          // Without this, mobile Safari hijacks the video into fullscreen
          // instead of playing it behind the cards.
          playsInline
        />
      </Animated.View>

      {/* Barely-there scrim: enough to seat the cards, not enough to dull the water. */}
      <View style={styles.scrim} />

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <WaterText type="title" style={styles.wordmark}>
              J&M Scheduling
            </WaterText>
            <WaterText style={styles.tagline}>Teach. Grow. Make Waves.</WaterText>

            {/* --- employee path --- */}
            <View style={styles.cardShadow}>
              <BlurView intensity={55} tint="light" style={styles.cardBlur}>
                <View style={styles.cardInner}>
                  <CardText type="subtitle">Employee</CardText>
                  <CardText style={styles.cardBody}>
                    Clock in and out, check your schedule, and see your own hours and pay.
                  </CardText>
                  <Pressable
                    onPress={signInAsWorker}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.button,
                      styles.employeeButton,
                      pressed && styles.buttonPressed,
                    ]}>
                    <ThemedText type="defaultSemiBold" style={styles.buttonLabel}>
                      Sign in as Employee
                    </ThemedText>
                  </Pressable>
                </View>
              </BlurView>
            </View>

            {/* --- admin path (demo passcode gate) --- */}
            <View style={styles.cardShadow}>
              <BlurView intensity={55} tint="light" style={styles.cardBlur}>
                <View style={styles.cardInner}>
                  <CardText type="subtitle">Admin</CardText>
                  <CardText style={styles.cardBody}>
                    Full access to staff, schedules, and payroll.
                  </CardText>
                  <TextInput
                    value={passcode}
                    onChangeText={(text) => {
                      setPasscode(text);
                      if (error) setError(null);
                    }}
                    onSubmitEditing={handleAdminSignIn}
                    placeholder="Admin passcode"
                    placeholderTextColor="#5F7383"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    accessibilityLabel="Admin passcode"
                    style={styles.input}
                  />
                  {error ? <CardText style={styles.error}>{error}</CardText> : null}
                  <Pressable
                    onPress={handleAdminSignIn}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.button,
                      styles.adminButton,
                      pressed && styles.buttonPressed,
                    ]}>
                    <ThemedText type="defaultSemiBold" style={styles.buttonLabel}>
                      Sign in as Admin
                    </ThemedText>
                  </Pressable>
                </View>
              </BlurView>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Pool blue behind everything, so nothing ever flashes white.
    backgroundColor: '#1D5A8A',
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  // On web VideoView *is* the <video> element, and a replaced element with
  // inset:0 but auto size keeps its intrinsic 1280x720 instead of stretching.
  // The explicit 100% is what makes contentFit="cover" crop against the screen.
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 40, 58, 0.10)',
    pointerEvents: 'none',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  column: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  wordmark: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 28, 45, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  tagline: {
    marginBottom: 6,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 24, 40, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  // Shadow lives on the outer view: pairing it with overflow:hidden on the same
  // view suppresses it on iOS, and the blur needs the clip.
  cardShadow: {
    width: '100%',
    borderRadius: 18,
    boxShadow: '0 6px 16px rgba(0, 24, 36, 0.25)',
  },
  cardBlur: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
  },
  cardInner: {
    padding: 20,
    gap: 10,
  },
  cardBody: {
    opacity: 0.8,
    fontSize: 15,
    lineHeight: 21,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(15, 44, 63, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: INK,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  error: {
    color: '#B02A1C',
    fontSize: 14,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 2,
  },
  employeeButton: {
    backgroundColor: '#27AE60',
  },
  adminButton: {
    backgroundColor: '#1D3D47',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: '#FFFFFF',
  },
});
