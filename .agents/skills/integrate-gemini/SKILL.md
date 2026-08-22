---
name: integrate-gemini
description: Implement robust Google Gemini API integration through Supabase Edge Functions with streaming, error handling, and type safety.
---

# `integrate-gemini`

Use this skill when adding or changing Gemini-backed analysis in Univia.

## Non-negotiable boundary

- Never import `@google/generative-ai` into browser code.
- Never expose `GEMINI_API_KEY` or a `VITE_GEMINI_API_KEY` to the browser.
- Use `npm:@google/generative-ai@0.21.0` and `Deno.env.get('GEMINI_API_KEY')` only inside a Supabase Edge Function under `supabase/functions/`.
- Browser components call the authenticated Edge Function through the existing service helpers and `AuthContext`/`useAuth` boundaries.

## Workflow

1. Read [the Gemini rules](../../rules/gemini.md), the target Edge Function, and the existing service or hook before changing code.
2. Validate and bound user input at the Edge Function boundary. Do not rely on browser validation for security.
3. Keep API-key access and provider calls in the Edge Function. Return a typed, minimal response to the browser.
4. Add loading, error, retry, and AI-attribution states. Stream long-form text when the Edge Function contract supports streaming.
5. Keep critical AI output human-reviewed; never save or apply generated content without explicit user confirmation.
6. Add or update Vitest tests for success, network failure, rate limiting, malformed output, and safety-block responses.

## Browser pattern

Use the existing authenticated service boundary rather than constructing a Gemini client:

```tsx
const analysis = await requestAccessibilityAnalysis({
  content: prompt,
  accessToken: session?.access_token ?? null,
});
```

The current `useGemini` hook exposes `isLoading`, `error`, and server-protected attribution. Preserve that contract unless the feature explicitly requires a documented change.

## Edge Function pattern

```ts
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';

const apiKey = Deno.env.get('GEMINI_API_KEY');
if (!apiKey) {
  throw new Error('Gemini service is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);
```

Configure safety settings, timeouts, bounded retries with exponential backoff, and response validation in the Edge Function. Return user-friendly error codes/messages; do not return provider credentials or raw internal errors.

## UI requirements

- Disable submission after the request starts and show a spinner while loading.
- Announce loading, errors, and streaming updates with accessible status text or `aria-live="polite"`.
- Identify generated content as AI-assisted and tell users when their data is sent to Google Gemini.
- Offer retry or recovery for transient failures.
- Support cancellation where the Edge Function and service contract allow it.

## Verification

Run the focused tests, then `npm run typecheck`, `npm run lint`, and `npm run build` for cross-cutting changes. Keep `GEMINI_API_KEY` configured only in Supabase Edge Function secrets; browser `.env` files may contain only the documented Vite Supabase variables.