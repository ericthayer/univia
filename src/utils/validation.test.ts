import { describe, expect, it } from 'vitest';
import { validatePasswordChange } from './validation';

describe('validatePasswordChange', () => {
  it('returns mismatch error when passwords differ', () => {
    const result = validatePasswordChange('abc123', 'abc124');
    expect(result).toBe('Passwords do not match');
  });

  it('returns length error for short passwords', () => {
    const result = validatePasswordChange('abc', 'abc');
    expect(result).toBe('Password must be at least 6 characters');
  });

  it('returns null when password change input is valid', () => {
    const result = validatePasswordChange('secure123', 'secure123');
    expect(result).toBeNull();
  });
});
