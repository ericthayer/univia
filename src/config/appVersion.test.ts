import { describe, expect, it } from 'vitest';
import { normalizeAppVersion } from './appVersion';

describe('normalizeAppVersion', () => {
  it('removes the leading v from a release version', () => {
    expect(normalizeAppVersion('v1.3.0', '1.2.0')).toBe('1.3.0');
  });

  it('uses the fallback when no build version is provided', () => {
    expect(normalizeAppVersion(undefined, '1.2.0')).toBe('1.2.0');
  });
});