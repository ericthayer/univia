/**
 * Read-only mirror of server-side constants shown on Admin Settings.
 * Source of truth: supabase/functions/analyze-document/index.ts
 * (GEMINI_MODELS, ANONYMOUS_LETTER_LIMIT). Update both together.
 */
export const ANALYSIS_ENGINE = {
  primaryModel: 'gemini-3-flash-preview',
  deepModel: 'gemini-3-pro-preview',
  anonymousLetterLimit: 5,
} as const;
