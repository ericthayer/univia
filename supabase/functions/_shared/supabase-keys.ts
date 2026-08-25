function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'string');
}

export function parseSupabaseKeyDictionary(rawValue: string | undefined): string | null {
  if (!rawValue) return null;

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!isStringRecord(parsed)) return null;

    const defaultKey = parsed.default?.trim();
    return defaultKey || null;
  } catch {
    return null;
  }
}

export function getSupabaseKey(variableName: 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS'): string | null {
  const dictionaryKey = parseSupabaseKeyDictionary(Deno.env.get(variableName));
  if (dictionaryKey) return dictionaryKey;

  const fallbackNames = variableName === 'SUPABASE_SECRET_KEYS'
    ? ['SUPABASE_SERVICE_ROLE_KEY']
    : ['SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'];

  for (const fallbackName of fallbackNames) {
    const fallbackKey = Deno.env.get(fallbackName)?.trim();
    if (fallbackKey) return fallbackKey;
  }

  return null;
}