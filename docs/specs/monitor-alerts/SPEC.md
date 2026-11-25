# SPEC: Monitor scan alerts

**Status:** Built (slice E of the remaining Monitor plan; launch spec Phase 4)
**Provider:** Resend (owner decision, 2026-11-25). Sending domain `mail.univia.help`.

## Intent

Monitor customers should hear about new problems without opening the app. One summary email per scan run, only when the run found something the owner should act on. An unchanged run sends nothing.

## What triggers an email

A run that completes with at least one `issue_events` row of kind:

| Kind | Shown as |
|---|---|
| `detected` | New |
| `reopened` | Back again |
| `fix_not_confirmed` | Fix not confirmed |

No email when the owner has turned alerts off, has lost Monitor access, or has no email address (guests).

## Architecture

```
scan_runs.status → completed
  └─ trigger queue_scan_alert ──► email_outbox (one row per run, unique)
pg_cron every minute
  └─ kick_email_worker() ──(pg_net, shared secret)──► send-alerts
        claim_email_outbox(5) → build email → Resend → complete / fail
email link → /unsubscribe page → POST email-unsubscribe → unsubscribe_scan_alerts(token)
mail client one-click (RFC 8058) → POST email-unsubscribe?token=…
Account Settings → set_scan_alerts(bool)
```

- `notification_settings`: per account, alerts on by default. Browsers read `scan_alerts` for their own row; the token column is not readable from the browser.
- `email_outbox`: no browser access. Retries after 5 then 15 minutes on 429, 5xx and network errors; the third failure is final. A row left `sending` for 5 minutes is reclaimed. Resend's `Idempotency-Key` is the outbox id, so a retry cannot double-send. The recipient and payload are frozen on the first claim, so every retry sends the identical request even if issues or the owner's address change. Every claim re-checks alerts-on and Monitor access; mail waiting when either is removed is skipped.
- `send-alerts` reuses the scan worker's Vault URL (function name swapped) and shared secret: no new owner secrets except `RESEND_API_KEY`. Without that key it claims nothing, so mail waits rather than failing.
- Optional Edge secrets: `ALERTS_FROM` (default `Univia <alerts@mail.univia.help>`), `ALERTS_REPLY_TO` (default `hello@univia.help`), `APP_URL` (default `https://univia.help`).
- Unsubscribe never happens on GET: the email links to an app page that asks first, so link scanners cannot unsubscribe anyone. The `List-Unsubscribe` header points at the function for one-click POSTs.

## Email content

Subject: `{site}: 2 new issues, 1 issue back again` or `First scan of {site}: N issues found`. The intro names the run: the weekly scan, the scan you started, or a one-page re-check (which leaves out the site-wide open count). Body: summary, up to 15 issues (label, severity, title, page path) most severe first, then "and N more", a button to Monitor, the automated-checks disclaimer, and the unsubscribe link. Plain-text version included. No compliance language.

## Accessibility

- Account Settings switch has `role="switch"`, a visible label, a description, and a polite live region for the result. It reverts if saving fails.
- `/unsubscribe` confirms with a button and announces the result; it adds `noindex` and `no-referrer` while mounted.
- Email HTML: `lang`, a single `h1`, a presentation table, real link text, and a plain-text part.

## Tests

- `supabase/tests/monitor-alerts-behavior.sql`: 40 pgTAP checks (queueing, nothing-new runs, reopened issues, claims, retries with a frozen request, final failures, access removed while mail waits, settings, unsubscribe, lost access, account deletion, browser access).
- `send-alerts/alert-email.test.ts`, `resend.test.ts`, `email-unsubscribe/token.test.ts`, `ScanAlertsCard.test.tsx`, `Unsubscribe.test.tsx`.

## Production steps

1. Backup, then apply `20261126130000_monitor_scan_alerts.sql` in the SQL editor.
2. Deploy `send-alerts` and `email-unsubscribe` (verify_jwt off for both).
3. Resend domain verified and `RESEND_API_KEY` set as an Edge Function secret.
4. Watch one alert end to end on the owner's test site.

## Changelog

- 2026-11-25: Created.
