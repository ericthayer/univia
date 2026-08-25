import { describe, expect, it, vi } from 'vitest';
import { getSupabaseKey, parseSupabaseKeyDictionary } from './supabase-keys';

const env = new Map<string, string>();

vi.stubGlobal('Deno', {
  env: {
    get: (name: string) => env.get(name),
  },
});

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

describe('getSupabaseKey', () => {
  it('uses the JSON dictionary before the conventional fallback secret', () => {
    env.set('SUPABASE_SECRET_KEYS', '{"default":"dictionary-secret"}');
    env.set('SUPABASE_SERVICE_ROLE_KEY', 'legacy-secret');

    expect(getSupabaseKey('SUPABASE_SECRET_KEYS')).toBe('dictionary-secret');

    env.clear();
  });

  it('falls back to the conventional service-role key', () => {
    env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-secret');

    expect(getSupabaseKey('SUPABASE_SECRET_KEYS')).toBe('service-role-secret');

    env.clear();
  });

  it('falls back to the conventional anonymous key for publishable access', () => {
    env.set('SUPABASE_ANON_KEY', 'anonymous-secret');

    expect(getSupabaseKey('SUPABASE_PUBLISHABLE_KEYS')).toBe('anonymous-secret');

    env.clear();
  });
});