import type { Theme } from '@mui/material/styles';

/**
 * Semantic tone shared by the surface primitives (BezelCard, MetricTile,
 * ScoreBar, ScoreStrip). Scores map to a tone by value via `scoreTone`.
 */
export type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

/**
 * Resolve a tone to a palette color string. Uses CSS variables when the theme
 * exposes them so light/dark switching needs no re-render.
 */
export function toneColor(theme: Theme, tone: Tone): string {
  const palette = (theme.vars ?? theme).palette;
  if (tone === 'neutral') {
    return palette.text.secondary;
  }
  return palette[tone].main;
}

/**
 * Resolve a tone to a foreground color safe for small text in both schemes.
 * Bars, rings and accents keep `toneColor`; numerals and pill labels use this.
 */
export function toneTextColor(theme: Theme, tone: Tone): string {
  const palette = (theme.vars ?? theme).palette;
  if (tone === 'neutral') {
    return palette.text.primary;
  }
  return palette.toneText[tone];
}
