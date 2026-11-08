/**
 * Read-only mirror of server-side constants shown on Admin Settings.
 * Sources of truth: GEMINI_MODELS in supabase/functions/analyze-document/index.ts,
 * and letter_quota() in supabase/migrations/20261108050610_enforce_plan_limits.sql.
 * Update both together.
 */
export const ANALYSIS_ENGINE = {
  primaryModel: 'gemini-3-flash-preview',
  deepModel: 'gemini-3-pro-preview',
  anonymousLetterLimit: 1,
} as const;
