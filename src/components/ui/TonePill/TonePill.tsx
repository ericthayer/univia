import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';
import { Tone, toneColor, toneTextColor } from '../tone';

export type TonePillVariant = 'tonal' | 'outline' | 'solid';

export interface TonePillProps {
  tone?: Tone;
  /** `tonal` tints the tone, `outline` is a quiet hairline, `solid` is the inverse. */
  variant?: TonePillVariant;
  /** Leading status dot. */
  dot?: boolean;
  children: ReactNode;
}

interface RootProps {
  tone: Tone;
  pillVariant: TonePillVariant;
}

const Root = styled('span', {
  shouldForwardProp: (prop) => prop !== 'tone' && prop !== 'pillVariant',
})<RootProps>(({ theme, tone, pillVariant }) => {
  const { palette } = theme.vars ?? theme;
  const color = toneColor(theme, tone);

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 24,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid transparent',
    fontSize: '0.6875rem',
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    '.TonePill-dot': {
      width: 6,
      height: 6,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
      flexShrink: 0,
    },
  } as const;

  if (pillVariant === 'solid') {
    return {
      ...base,
      backgroundColor: palette.text.primary,
      borderColor: palette.text.primary,
      color: palette.background.paper,
    };
  }

  if (pillVariant === 'outline') {
    return {
      ...base,
      color: palette.text.secondary,
      borderColor: `color-mix(in srgb, ${palette.text.secondary} 45%, transparent)`,
    };
  }

  // Tonal. Text uses the scheme-aware toneText foreground so it clears 4.5:1 on its own tint.
  return {
    ...base,
    backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
    color: toneTextColor(theme, tone),
  };
});

/**
 * Small pill label for statuses and tiers. Replaces saturated rectangular
 * chips with tinted, hairline-bordered pills that stay readable in both schemes.
 */
export function TonePill({ tone = 'neutral', variant = 'tonal', dot = false, children }: TonePillProps) {
  return (
    <Root tone={tone} pillVariant={variant}>
      {dot && <span className="TonePill-dot" aria-hidden="true" />}
      {children}
    </Root>
  );
}

export default TonePill;
