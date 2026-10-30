import type { Tone } from '../ui/tone';

/** Urgency level to pill tone. */
export function urgencyTone(level: string): Tone {
  switch (level) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'neutral';
  }
}

/** Urgency level to an `Icon` name. */
export function urgencyIcon(level: string): string {
  switch (level) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'check_circle';
    default:
      return 'help';
  }
}

/** Confidence score (0 to 1) to a label. */
export function confidenceLabel(score?: number): string | null {
  if (!score) return null;
  if (score >= 0.9) return 'High';
  if (score >= 0.7) return 'Medium';
  return 'Low';
}
