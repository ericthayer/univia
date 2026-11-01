import { describe, expect, it } from 'vitest';
import { confidenceLabel, urgencyTone } from './urgency';

describe('confidenceLabel', () => {
  it('labels a zero score as Low instead of hiding it', () => {
    expect(confidenceLabel(0)).toBe('Low');
  });

  it('bands scores by threshold', () => {
    expect(confidenceLabel(0.95)).toBe('High');
    expect(confidenceLabel(0.9)).toBe('High');
    expect(confidenceLabel(0.75)).toBe('Medium');
    expect(confidenceLabel(0.3)).toBe('Low');
  });

  it('returns null only when the score is absent', () => {
    expect(confidenceLabel(undefined)).toBeNull();
    expect(confidenceLabel(null)).toBeNull();
    expect(confidenceLabel(Number.NaN)).toBeNull();
  });
});

describe('urgencyTone', () => {
  it('maps known levels and falls back to neutral', () => {
    expect(urgencyTone('critical')).toBe('error');
    expect(urgencyTone('low')).toBe('success');
    expect(urgencyTone('unknown')).toBe('neutral');
  });
});
