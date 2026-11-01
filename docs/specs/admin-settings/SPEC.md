# SPEC: Admin Settings (`/admin/settings`)

**Status:** Implemented
**Branch:** off `feat/ui-update` (UI refresh, PR #26)
**Design language:** UI refresh (`docs/specs/ui-refresh/SPEC.md`). Interactive elements use a 16px radius; cards and pills keep theirs.

## 1. Intent

The "Admin Settings" entry in the admin menu routed to User Management. Admins need one place to see and change platform-level configuration. The page shows only what is real: every control is wired to the database, and every value is read from the code that enforces it. No placeholder toggles.

## 2. What is configurable today

| Setting | Where it lives | Page behavior |
|---|---|---|
| Who is an administrator | `user_profiles.is_admin`; RLS lets admins update any profile, and the `prevent_profile_privilege_escalation` trigger blocks everyone else | **Editable**: grant by email, revoke with confirmation |
| Plan limits and features | `src/config/tierConfig.ts` | Read-only table; changes ship with a release |
| Analysis models and anonymous letter quota | `supabase/functions/analyze-document/index.ts` constants, mirrored in `src/config/platformConfig.ts` | Read-only; changes need an Edge Function deploy |
| App version, backend host | `VITE_APP_VERSION` / `package.json`, `VITE_SUPABASE_URL` | Read-only |

## 3. Layout

```
PageCanvas lg
  PageHeader  eyebrow "Admin" · "Admin Settings" · description
  Grid (@container ≥ 900px: 7fr 5fr; else stacked)
    [AdminAccessCard]  SectionHeader "Administrators" (count)
                       list: name, email, "You" pill; Revoke (not on own row)
                       form: email field + "Grant access" button
                       revoke opens a confirm Dialog
    ---- right column ----
    [SystemInfoCard "Analysis engine"]  <dl>: primary model, deep model, anonymous letter limit
    [SystemInfoCard "Environment"]      <dl>: app version, backend host, build mode
  [PlanLimitsCard] full width (the table needs it) · SectionHeader "Plans & limits" · table: plan, price, audits/mo, team seats, scheduled audits, API, webhooks
```

## 4. Behavior

- `useAdminAccounts` (`src/hooks/useAdminAccounts.ts`) owns all Supabase calls: list admins, grant by email (case-insensitive exact match on `email`), revoke by id. Grant/revoke return a discriminated `AdminActionResult`.
- Grant: empty or malformed email blocks submit with an inline error and focuses the field. No matching profile → "No account uses that email. They need to sign up first." Already admin → info message, no write.
- Revoke: disabled on the current user's own row (prevents self-lockout, and therefore the last admin). Confirm dialog states the effect.
- Results announce through `role="status"` (success) or `role="alert"` (error).

## 5. Accessibility

- Each card is a `<section>` labelled by its heading. Admin list is a `<ul>`; read-only values are `<dl>`.
- Plan table is a native `<table>` with `<caption>` (visually hidden) and `scope` headers; it scrolls inside its own region on narrow screens (`tabIndex=0`, labelled).
- Email field has a visible label, `type="email"`, `autoComplete="off"`.
- Touch targets ≥ 44px.

## 6. Not built (needs a decision)

Persisted platform settings (maintenance banner, sign-ups open/closed, anonymous quota, default model) need an `app_settings` table plus readers in the Edge Functions. Adding toggles before that exists would be fake controls, so they are left out.
