import { forwardRef, ReactNode } from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import { keyframes, styled } from '@mui/material/styles';
import { Tone, toneColor } from '../tone';

export type { Tone } from '../tone';

export type BezelPadding = 'none' | 'sm' | 'md';

export interface BezelCardProps extends Omit<BoxProps, 'padding'> {
  children: ReactNode;
  /** Draws a 2px tone line along the top edge of the core. Decorative only. */
  accent?: Tone;
  /** Lifts the surface on hover and settles it on press. */
  interactive?: boolean;
  /** Stagger index for the mount reveal. Omit to render statically. */
  reveal?: number;
  /** Inner content padding. */
  padding?: BezelPadding;
}

const reveal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const MAX_STAGGER = 8;
const STAGGER_MS = 60;

interface ShellProps {
  interactive?: boolean;
  revealIndex?: number;
}

const Shell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'interactive' && prop !== 'revealIndex',
})<ShellProps>(({ theme, interactive, revealIndex }) => {
  const { palette } = theme.vars ?? theme;
  const slow = `${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}`;
  const standard = `${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`;

  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.surfaces.shellInset,
    borderRadius: theme.surfaces.shellRadius,
    border: `1px solid ${palette.divider}`,
    backgroundColor: 'rgba(0, 0, 0, 0.035)',
    // Only transform and border-color animate here; the core owns box-shadow.
    transition: `transform ${slow}, border-color ${standard}`,
    ...theme.applyStyles('dark', {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    }),
    ...(interactive && {
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: palette.text.secondary,
      },
      '&:active': {
        transform: 'translateY(0) scale(0.995)',
      },
    }),
    ...(revealIndex !== undefined && {
      // `backwards` holds the first keyframe through the delay and releases
      // the element to its natural styles afterwards, so hover transforms work.
      animation: `${reveal} ${slow} backwards`,
      animationDelay: `${Math.min(revealIndex, MAX_STAGGER) * STAGGER_MS}ms`,
    }),
  };
});

interface CoreProps {
  corePadding: BezelPadding;
}

const Core = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'corePadding',
})<CoreProps>(({ theme, corePadding }) => {
  const { palette } = theme.vars ?? theme;
  const slow = `${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}`;
  const paddingMap: Record<BezelPadding, string | number> = {
    none: 0,
    sm: theme.spacing(2),
    md: theme.spacing(3),
  };

  return {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    padding: paddingMap[corePadding],
    borderRadius: theme.surfaces.coreRadius,
    backgroundColor: palette.background.paper,
    boxShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.04), 0 16px 40px -24px rgba(0, 0, 0, 0.18)',
    transition: `box-shadow ${slow}`,
    [theme.breakpoints.down('sm')]: {
      padding: corePadding === 'md' ? theme.spacing(2) : paddingMap[corePadding],
    },
    '.BezelCard-shell:hover > &': {
      boxShadow:
        'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.04), 0 24px 48px -24px rgba(0, 0, 0, 0.24)',
    },
    ...theme.applyStyles('dark', {
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      '.BezelCard-shell:hover > &': {
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
    }),
  };
});

const Accent = styled('span', {
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: Tone }>(({ theme, tone }) => ({
  position: 'absolute',
  top: 0,
  left: theme.spacing(3),
  right: theme.spacing(3),
  height: 2,
  borderRadius: 1,
  backgroundColor: toneColor(theme, tone),
  pointerEvents: 'none',
}));

/**
 * Nested-bezel surface: an outer tray (shell) holding an inner plate (core)
 * with concentric radii. `sx` applies to the core; every other prop lands on
 * the shell so callers can pick the semantic element with `component`.
 */
export const BezelCard = forwardRef<HTMLDivElement, BezelCardProps>(function BezelCard(
  { children, accent, interactive = false, reveal: revealIndex, padding = 'md', sx, className, ...shellProps },
  ref
) {
  const shellClassName = className ? `BezelCard-shell ${className}` : 'BezelCard-shell';

  return (
    <Shell
      ref={ref}
      className={shellClassName}
      interactive={interactive}
      revealIndex={revealIndex}
      {...shellProps}
    >
      <Core corePadding={padding} sx={sx}>
        {accent && <Accent tone={accent} aria-hidden="true" />}
        {children}
      </Core>
    </Shell>
  );
});

export default BezelCard;
