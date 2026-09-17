import { useLocalSearchParams, useRouter } from 'expo-router';

/**
 * Back for screens in the More stack. Screens Home opens pass `from: 'home'`
 * and go back to Home; everything else pops the stack (back to the menu).
 *
 * Why not always `router.back()`: on web, leaving a Home-launched More screen
 * runs through browser history, which switches tabs without unwinding the
 * More stack (popToTopOnBlur only fires for router-driven tab switches). The
 * next tile push then sits on top of the stale screen, and a plain pop lands
 * on that instead of Home.
 */
export function useBack() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  return () => {
    if (from === 'home') router.navigate('/');
    else router.back();
  };
}
