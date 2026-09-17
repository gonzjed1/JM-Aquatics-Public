import { Button } from '@/components/ui/button';
import { useArmedAction } from '@/hooks/use-armed-action';
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<typeof Button>;

/**
 * A button that takes two taps: the first arms it and swaps the label, the
 * second does the thing. It disarms itself after about four seconds. Same
 * arm-then-confirm as the punch buttons, for anything else that shouldn't fire
 * by accident — deleting a conversation, dropping a shift.
 */
export function ConfirmButton({
  label,
  armedLabel,
  onConfirm,
  tone,
  variant,
  armedVariant = 'solid',
  size,
  style,
  accessibilityLabel,
}: {
  label: string;
  /** What the button says once it is armed, e.g. 'Tap again to delete'. */
  armedLabel: string;
  onConfirm: () => void;
  tone?: ButtonProps['tone'];
  variant?: ButtonProps['variant'];
  /** How the armed state looks — solid by default, so it clearly changed. */
  armedVariant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  style?: ButtonProps['style'];
  accessibilityLabel?: string;
}) {
  const { armed, tap } = useArmedAction(onConfirm);

  return (
    <Button
      label={armed ? armedLabel : label}
      tone={tone}
      variant={armed ? armedVariant : variant}
      size={size}
      onPress={tap}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
