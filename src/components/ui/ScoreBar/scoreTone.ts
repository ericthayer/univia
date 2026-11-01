import type { Tone } from '../tone';

/**
 * Lighthouse-style score banding. One rule for every score on the refreshed
 * pages (SPEC §3.3): color follows the value, never the category.
 */
export function scoreTone(value: number): Tone {
  if (value >= 90) return 'success';
  if (value >= 70) return 'warning';
  return 'error';
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}
