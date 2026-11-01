import type { Tone } from './tone';

export const SEVERITIES = ['critical', 'serious', 'moderate', 'minor'] as const;
export type Severity = (typeof SEVERITIES)[number];

const SEVERITY_TONE: Record<Severity, Tone> = {
  critical: 'error',
  serious: 'warning',
  moderate: 'info',
  minor: 'neutral',
};

/** Violation severity to pill tone. Unknown values stay neutral. */
export function severityTone(severity: string): Tone {
  return SEVERITY_TONE[severity as Severity] ?? 'neutral';
}
