import { describe, expect, it } from 'vitest';
import { parseSupabaseKeyDictionary } from './supabase-keys';

describe('parseSupabaseKeyDictionary', () => {
  it('returns the default key from the Supabase dictionary', () => {
    expect(parseSupabaseKeyDictionary('{"default":"sb_publishable_test"}'))
      .toBe('sb_publishable_test');
  });

  it('rejects malformed or incomplete dictionaries', () => {
    expect(parseSupabaseKeyDictionary(undefined)).toBeNull();
    expect(parseSupabaseKeyDictionary('not-json')).toBeNull();
    expect(parseSupabaseKeyDictionary('{"other":"key"}')).toBeNull();
    expect(parseSupabaseKeyDictionary('{"default":123}')).toBeNull();
    expect(parseSupabaseKeyDictionary('{"default":"   "}')).toBeNull();
  });
});