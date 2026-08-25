# Lighthouse Audit Edge Function Specification

## Intent

Make hosted website audits reliable and diagnosable without replacing the existing Supabase Edge Function → Google PageSpeed Insights → Supabase persistence architecture. A request should produce a report when at least one device strategy completes, while a complete provider failure should return a safe error with an operator-correlatable request ID.

## Usage

The browser sends a `POST` request to `run-lighthouse-audit` with:

```json
{ "url": "https://example.com" }
```

The function validates the target, runs PageSpeed Insights for mobile and desktop, stores each successful audit, and returns a session containing per-device results:

```json
{
  "success": true,
  "session_id": "uuid",
  "mobile": { "status": "completed", "audit_id": "uuid", "scores": {}, "violations_count": 1 },
  "desktop": { "status": "failed", "error_type": "PAGESPEED_TIMEOUT" }
}
```

## Architecture and data flow

- Authenticate with either a caller bearer token or the Supabase publishable key. A request with a missing or invalid bearer token is rejected rather than downgraded to publishable access.
- Store user-authenticated and Supabase anonymous-session audits with their user ID. A publishable-key-only audit is stored without a user ID, and its result is available only in the immediate response.
- Validate HTTPS hostname, business ownership, and public DNS targets.
- Call Google PageSpeed Insights v5 with explicit Lighthouse categories and device strategy.
- Bound upstream response size and timeout.
- Validate the required Lighthouse result shape before persistence.
- Insert successful device audits and their violations using the Supabase service key.
- Execute device audits independently; return partial success if one device succeeds.
- Emit structured, request-correlated logs without tokens, API keys, or full URLs.
- Support the repository's JSON key dictionaries and conventional single-value Supabase key secrets.

## Error contract

- `401`: missing or invalid publishable/user credentials.
- `403`: origin or business access denied.
- `422`: malformed/private/unverifiable audit target.
- `429`: PageSpeed rate limit.
- `502`: provider failure or invalid provider payload; logs include safe provider status/classification.
- `503`: missing server-side configuration.
- `504`: provider timeout.

A successful response must contain a non-empty `session_id` and explicit `status` for both device entries. If both device runs fail, no successful session response is returned.

## Security and accessibility

- Keep API keys server-side only.
- Preserve SSRF protections for private, reserved, localhost, credentialed, and non-HTTPS targets.
- Never log authorization tokens, API keys, or unbounded user-provided content.
- Preserve the existing client loading, cancellation, inline error, and keyboard-accessible form behavior. Partial completion must be communicated as a recoverable audit result rather than a generic failure.

## Performance and reliability

- Keep the 90-second upstream timeout and 5 MiB response bound unless verification demonstrates a need to change them.
- Avoid duplicate provider calls beyond one mobile and one desktop request per audit session.
- Do not fail a completed device because the other strategy failed.
- Keep provider diagnostics bounded and sanitized.

## Implementation checklist

- [x] Add fallback key resolution and tests.
- [x] Add provider request/error classification and request-correlated structured logs.
- [x] Execute device audits with partial-success semantics.
- [x] Preserve SSRF validation while documenting resolver behavior.
- [x] Update client response types and tests.
- [x] Document required hosted secrets.
- [x] Run focused tests, typecheck, lint, full tests, and build.

## Changelog

- 2026-08-25: Initial specification for hosted Lighthouse audit reliability hardening.
- 2026-08-25: Implemented key fallbacks, request-correlated provider diagnostics, bounded error parsing, and partial device success handling.
- 2026-08-25: Accepted Lighthouse checklist-object detail payloads used by current PageSpeed responses after reproducing the hosted `502` with `ethayer.design`.
- 2026-08-25: Added `@supabase/server` user-or-publishable authentication so authenticated and anonymous callers can run audits without weakening audit ownership policies.
- 2026-08-25: Accepted the Supabase dashboard anon tester's duplicate publishable-key bearer header without downgrading other invalid bearer tokens.
