import { describe, expect, it } from 'vitest';
import { extractBearerToken } from './auth-utils';

describe('extractBearerToken', () => {
  it('extracts a single bearer token', () => {
    expect(extractBearerToken('Bearer access-token')).toBe('access-token');
  });

  it('accepts case-insensitive bearer scheme', () => {
    expect(extractBearerToken('bEaReR access-token')).toBe('access-token');
  });

  it('rejects missing, malformed, or non-bearer authorization', () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
    expect(extractBearerToken('Basic access-token')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
    expect(extractBearerToken('Bearer access token')).toBeNull();
  });
});
