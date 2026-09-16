import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Arm-then-confirm for taps that shouldn't fire by accident, like clocking in
 * or out. The first tap arms; a second tap within `disarmAfterMs` runs
 * `action`. With no second tap it quietly disarms. No modal, no dialog — the
 * button itself shows the armed state.
 */
export function useArmedAction(action: () => void, disarmAfterMs = 4000) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Don't let a pending disarm fire on an unmounted screen.
  useEffect(() => clearTimer, [clearTimer]);

  const disarm = useCallback(() => {
    clearTimer();
    setArmed(false);
  }, [clearTimer]);

  const tap = useCallback(() => {
    if (armed) {
      disarm();
      action();
      return;
    }
    clearTimer();
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), disarmAfterMs);
  }, [armed, action, disarm, clearTimer, disarmAfterMs]);

  return { armed, tap, disarm };
}
