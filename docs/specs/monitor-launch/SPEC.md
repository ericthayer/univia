# SPEC: Monitor launch

**Status:** Draft, nothing built yet
**Branch:** `feat/monitor-launch` (from `main` at `7de4110`, release v1.6.2)
**Design language:** UI refresh (`docs/specs/ui-refresh/SPEC.md`). No new visual primitives unless this spec is updated first.

> This repository is public. Unpatched security detail does not belong in this file. Phase 0 is described by outcome only, and its specifics stay out of git until the fixes are live.

## 1. Intent

Univia can audit one URL on demand and triage a demand letter. It cannot yet be sold. Monitor ($9 per site per month, or $90 per year) is what we charge for first.

**Usable means one small-business owner can, without help:**

1. Create an account.
2. Add a site and up to 25 pages.
3. Get a scan every week without asking for it.
4. Get an email when new issues appear.
5. Mark an issue fixed, and have a re-scan confirm it.
6. Download a dated record of that work.
7. Pay, update their card, cancel, and delete their account.

Standing product rules: no compliance, immunity, or legal-advice claims. No fake directory listings. Automated scans find only some accessibility issues, and the product says so wherever it shows a score.

## 2. Status review (2026-11-07)

The previous status was checked against `main`, production, Stripe, and Netlify.

| Claim | Verdict | What the check found |
|---|---|---|
| #37 merged, Pro gated server-side | Correct | Merged 2026-11-07. `analyze-document` v57 deployed 20:05 UTC, after the merge. Site is live on `7de4110`. |
| No open PRs | Correct | None open. `feat/ui-update` is stale: its work reached `main` through #26, and `main`'s header is newer. Nothing there needs merging. |
| Monitor features all "coming soon" | Correct but incomplete | True on Pricing, but several features listed as available today do not exist either (see Phase 2). |
| Stripe, webhooks, plan changes not built | Correct | No Stripe code in the repo. `Pricing.tsx` still shows a prototype `alert()`. |
| Stripe connector sign-in expired | **Out of date** | The connector is connected. Its only account is live mode, so test mode needs setting up (Decision 3). |
| Isolation migration not applied | Correct but incomplete | Still unapplied. It also stops on 42 ownerless audits, not just the 46 ownerless letters. |
| Letter data is live-exposed | **Overstated for letters** | No letter row currently matches the anonymous read rule, and the 46 ownerless rows are unreachable through the API. The rule is still too broad and must go. Other access-control gaps matter more: see Phase 0. |
| Auth branding is a launch blocker | **Downgraded** | Real and worth fixing, but it is trust polish that does not stop sign-up or payment. Runs in parallel. |
| Mobile drawer "Join Univia" decision | **Closed** | The string no longer exists on `main`. |
| Build tracker and scheduled scans together | Agreed | Scans produce the data the tracker works on, so scans come first. |

**Missing from the status entirely:**

- New sign-ups never get a `user_profiles` row. The production trigger writes to a different table, and that table has no insert path. Billing has nowhere to record a plan, and Account Settings renders blank for them.
- Saving a profile fails for everyone, with a database recursion error. Found while rehearsing Phase 0.
- Plan limits are not enforced on the server: not audit limits, and not letter limits for signed-in users.
- The migration history and the repo have drifted apart. Production has tables and two Edge Functions that are not in this repo, and some repo migrations reached production outside the migration history.
- `generate-accessibility-analysis` is not deployed. The AI step of Analyze Report calls it and gets a 404.
- Delete Account is a button with no handler.
- No email sending, no error reporting, no error boundary, and no staging environment.
- Terms and Privacy are not launch-ready: placeholder company address, contact domain that does not match `univia.help`, no mention of Google Gemini, and sign-in and sign-up links that point to `#`.
- A 25-page scan does not fit in one Edge Function call. Each page may take up to 90 seconds (`UPSTREAM_TIMEOUT_MS`), so a run needs a queue.

## 3. Scope

**In for launch:** everything in section 1, for one site per subscription.

**Cut to keep this simple:**

| Cut | Instead |
|---|---|
| Extra sites at $5 | One site per subscription. Moves to planned on Pricing. |
| Sitemap crawling | User enters up to 25 URLs. |
| Desktop and mobile scans | One weekly scan per page, mobile strategy. |
| Per-issue instant alerts | One summary email per run, only when something is new. |
| Accessibility statement generator | After launch. |
| Team seats, API, webhooks, white-label | Not built. Agency becomes "Contact us". |
| $149 Response Kit | After Monitor is stable (Decision 4). |
| Editable Admin Settings | Not needed to launch. |
| Percentage rollouts | Allow-list (section 7). Traffic is too low for 5% steps to mean anything. |

## 4. Work plan

One PR per phase unless noted. Order is firm through Phase 1. Phases 3 to 5 depend on each other in sequence.

### Phase 0: Security fixes (first, small)

Do not wait for feature work.

- [x] Confirm the older mobile prototype is retired (Decision 2, closed 2026-11-07).
- [x] Write the forward migration and rehearse it. Rehearsed against production's real schema in a transaction that always rolls back, because a Supabase branch rebuilds from the drifted migration history and would not match production. Removes no rows.
- [x] Apply the migration to production (`20261107210510_close_access_gaps`, 2026-11-07). Verified with role-by-role checks, and a real guest session created afterward got its profile row.
- [ ] Remove Edge Functions that are deployed but not in this repo. `pagespeed-proxy` is stubbed to return 410. `gemini-proxy` must be deleted from the Supabase dashboard, and `pagespeed-proxy` can go at the same time.
- [x] Re-run the Supabase security advisors. Remaining warnings are expected: the share-link functions, owner-scoped policies that guests can reach as `authenticated`, and leaked-password protection, which is a dashboard setting. Tables with no policies are closed by design until Phase 1.

**Done when:** the review's private findings list is empty and the advisors show no unexplained warnings.

### Phase 1: Accounts and data foundation

Two migrations, so the working fixes do not wait on Decision 1. Both are tested on a disposable local database built from every repo migration in order (see `supabase/tests/README.md`).

- [x] `20261107211608_fix_signup_and_profiles`, applied to production 2026-11-07 and verified there: real accounts get a `user_profiles` row at sign-up, when a guest converts, and on email change. Guests are skipped because `user_profiles.email` is required. Backfills any account missing a profile. Fixes the recursive update policy so Save works again, extends the protected fields to `email`, `audit_count`, `last_login` and `created_at`, and lets active admins read and manage profiles, which the admin pages already assume. `accounts-behavior.sql`: 19 of 19 pass, and 16 fail against production's current state.
- [x] `20261107214000_tenant_isolation`: audits and violations become owner-only, letters always have an owner, deleting an account deletes its letters and audits, and `businesses.owner_id` exists (this also fixes `run-lighthouse-audit`'s filter). Stops before changing anything while ownerless rows remain. `tenant-isolation-behavior.sql`: 16 of 16 pass, and 7 fail before it.
- [x] Retired `20260208000000_harden_tenant_isolation` (never applied) and its policy contract, which asserted a superseded share-link design.
- [x] Schema check: every table the app uses has identical columns in the repo build and in production. Differences are only what the isolation migration adds, plus seven retired prototype tables that exist only in production.
- [ ] Resolve the 46 ownerless letters and 42 ownerless audits (Decision 1). Blocks the isolation migration.
- [ ] Apply the isolation migration to production after Decision 1, then rename its file to the version production records.
- [ ] Align the migration history records with the repo. That needs the Supabase CLI (`migration repair`), which is not installed here. Decide whether to drop the retired prototype tables.
- [x] Deploy `generate-accessibility-analysis`, unchanged from the repo (version 1, 2026-11-07). A guest session got a full answer in 5.6 seconds. Calls with no token, a fake token or another origin are refused.

**Done when:** a brand-new sign-up has a profile and working Settings page, a second account cannot read the first account's data (test added), and repo and production schemas match.

### Phase 2: Honest pricing and real limits

- [ ] Move everything not built out of `features` in `tierConfig.ts`: extra sites, team seats, API access, webhooks, unlimited use.
- [ ] Align Free's letter allowance with reality. Guests can currently save more letters than the Free plan offers.
- [ ] Enforce audit and letter limits inside the Edge Functions, using `user_profiles` as the source of truth.
- [ ] Remove `run-lighthouse-audit`'s publishable-key path. It stores audits with no owner, which bypass limits and that nobody can read. Then make `accessibility_audits.user_id` required, as letters already are.
- [ ] Replace the `alert()` on Pricing.
- [ ] Fix homepage copy that breaks the product rules or has expired: "by meeting ADA compliance", "Track performance and compliance", and "Coming in Q2 2026". Sweep the rest of the site for the same.

**Done when:** every item a plan lists as available works today and is enforced server-side.

### Phase 3: Sites and scheduled scans

- [ ] Tables and RLS from section 5, with owner-only access tested.
- [ ] Add a site and pages: reuse the existing URL validation, 25-page limit.
- [ ] Enable `pg_cron` and `pg_net`. Enqueue weekly runs. A worker function claims one page at a time.
- [ ] Record per-page failures. A run with some failed pages still completes and reports them.
- [ ] Spike first: test issue fingerprints across repeat scans of real sites. If selectors churn, every scan reports false "new" issues and alerts lose trust.

**Done when:** a site scans every week with no user action, and one failing page does not fail the run.

### Phase 4: Alerts and email

- [ ] Choose an email provider (Decision 5) and verify the sending domain.
- [ ] Send Supabase Auth email through it. Confirm the default sender's limits before launch.
- [ ] Send a summary email after a run with new issues. Include an unsubscribe link and a plain-text version.

**Done when:** a new issue on a test site produces exactly one email, and an unchanged run produces none.

### Phase 5: Fix tracker and record

- [ ] Issue list per site: open, marked fixed, confirmed fixed, reopened if it returns.
- [ ] Re-scan one page on demand to confirm a fix.
- [ ] Append-only `issue_events`, the source for the record.
- [ ] Record PDF, reusing the existing PDF export: dates, pages scanned, issues found, fixes confirmed, and a plain statement of what automated scans do not cover. No compliance language.
- [ ] Have an attorney review the name and wording (Decision 6).

**Done when:** an issue can go from found to confirmed fixed, and the PDF shows that history accurately.

### Phase 6: Payments

- [ ] Stripe sandbox with Monitor monthly and yearly prices. Test mode first; nothing is created in live mode until Phase 7.
- [ ] Checkout, Customer Portal, and a signature-verified webhook.
- [ ] Only the webhook changes `tier`, through the service role. Process each event once, keyed on its event id.
- [ ] Handle upgrade, cancel at period end, failed payment, and refund. Define what happens to scans when a plan ends.
- [ ] Update `/admin/billing` to show real data instead of estimates.

**Done when:** a test card can buy, a test failure downgrades correctly, and replaying a webhook changes nothing.

### Phase 7: Launch readiness

- [ ] Terms and Privacy as real pages at their own URLs, linked from sign-in and sign-up. Name Gemini, cover retention, refunds, and cancellation.
- [ ] Working account deletion with confirmation. Removes letters and files, and cancels the subscription.
- [ ] Letter retention rule, stated in Privacy and enforced.
- [ ] Error boundary, client and function error reporting, and an alert when scans or webhooks fail.
- [ ] Security headers in `netlify.toml`. Start CSP in report-only. Include `Referrer-Policy`, which protects share links.
- [ ] Real `robots.txt` and `sitemap.xml`. Both currently return the app's HTML.
- [ ] Upgrade `react-router-dom` to clear the three high-severity production advisories.
- [ ] Automate or document Edge Function and migration deploys. CI deploys neither today.
- [ ] One end-to-end smoke test of the section 1 journey, plus upload and reopen a letter. The storage bucket is empty, so that path is unproven in production.
- [ ] Audit Univia itself with the full checklist. Our own site has to pass.

**Done when:** section 8 has no failing line and every Decision is closed.

### In parallel: owner tasks

Not code, and none of them block the phases above: Supabase custom domain, Google branding verification, renamed GitHub OAuth app, and enabling leaked-password protection.

## 5. Architecture

Draft model, to be finalized in each phase's PR.

| Table | Purpose |
|---|---|
| `sites` | Owner, name, origin, paused state |
| `site_pages` | Up to 25 URLs per site |
| `scan_runs` | One row per run: trigger, status, page counts, timestamps |
| `scan_page_results` | One row per page per run. Doubles as the work queue |
| `issues` | Unique per site, page, and fingerprint. State, first seen, last seen |
| `issue_events` | Append-only history for the record |
| `subscriptions` | Stripe ids, status, period end, written only by the webhook |
| `stripe_events` | Processed event ids |

**Scan flow:** `pg_cron` creates the week's runs and pending page rows. A second job calls a `scan-worker` function through `pg_net` every minute. The worker claims rows with `FOR UPDATE SKIP LOCKED`, runs the existing PageSpeed path, and stores results. When the last page finishes, it compares issues against the previous run and queues the email.

Reuse `run-lighthouse-audit` parsing (`lighthouse-result.ts`), `_shared/audit-validation.ts`, and `_shared/http.ts`. Keep third-party keys in Edge Function secrets, never `VITE_*`. Pages live in `src/pages/`, components follow the folder-per-component rule, and URL state covers filters and tabs.

## 6. Accessibility and performance

- Issue states are conveyed in text, never by color alone. Reuse `TonePill` and `scoreTone`.
- Scan progress uses `aria-live="polite"`. Destructive actions need confirmation, per AGENTS.md.
- Tables are native `<table>` with captions and `scope` headers. Virtualize lists over 50 items.
- New pages are lazy-loaded. Do not add to the 586 kB main chunk.

## 7. Release and rollback

**Stages**

1. Owner only, with Stripe in test mode.
2. Live mode: one real purchase by the owner, then a refund.
3. Three to five invited customers on an allow-list, through at least two weekly cycles.
4. Public.

A single server-checked allow-list gates Monitor until stage 4, then gets removed.

**Staging:** production is the only Supabase environment today. Test migrations first on a disposable local database built from the repo's migrations (`supabase/tests/README.md`), which now matches production's columns for every table the app uses. Apply them as `postgres`, as production does. Use a Supabase branch once the migration history is aligned. Do not point deploy previews at production once Monitor tables exist.

**Roll back when:** any cross-account read, a paying customer without access for over an hour, more than 20% of pages failing in a run, or a wrong charge.

| Layer | How |
|---|---|
| Site | Netlify: publish the previous deploy |
| Monitor | Remove users from the allow-list. Unschedule the cron jobs |
| Edge Functions | Redeploy the previous version |
| Database | Forward-only. Take a backup before every production migration, and write the reversal before applying |
| Payments | Disable Checkout. Existing subscriptions stay live, so refund by hand if needed |

**First hour after each stage:** site loads, sign-up works, a scan completes, a webhook lands, an email arrives, errors are visible in reporting.

## 8. Pre-launch checklist

Baseline on `7de4110`, 2026-11-07.

| Item | State | Note |
|---|---|---|
| Typecheck, lint, build | Pass | Exit 0 |
| Unit tests | Pass | 214 tests in 46 files |
| End-to-end tests | **Fail** | None exist |
| No debug logging | Partial | `console.log` in 4 source files, including admin demos |
| Secrets not in code | Pass | Netlify scan clean |
| Dependency audit | **Fail** | Production: 3 high, 11 moderate, 0 critical. All high are the React Router chain |
| Access control | **Fail** | Phase 0 and 1 |
| Rate and plan limits | **Fail** | Phase 2 |
| CORS | Pass | Functions allow `https://univia.help`, no wildcard |
| Security headers | **Fail** | HSTS only |
| HTTPS and domain | Pass | `univia.help` |
| Core Web Vitals | Not measured | Netlify Lighthouse on `/`: performance 82, accessibility 100 |
| Error reporting, health check | **Fail** | None |
| Backups and restore | Unknown | Confirm plan and test a restore |
| Staging | **Fail** | None |
| Legal pages | **Fail** | Phase 7 |
| Account deletion | **Fail** | Button has no handler |
| AI data disclosure | Partial | Shown on upload, missing from Privacy |
| Gemini data terms | Unknown | Confirm the API key is on a paid tier (Decision 7) |

## 9. Decisions needed

1. **46 ownerless letters and 42 ownerless audits.** Delete, or move to an operator-only archive with a purge date? All 46 letters contain extracted text, and no user can reach them. Recommended: archive with a 30-day purge, or delete if they are test data.
2. **Mobile prototype: closed.** Retired, confirmed by the owner on 2026-11-07. Phase 0 closes client access and keeps the data. Dropping the tables is a separate decision after Phase 1 replaces the sign-up trigger.
3. **Which legal entity takes payment?** Must match the Terms. A Stripe sandbox is needed either way.
4. **$149 Kit timing.** Recommended: at least a month after Monitor, and only after attorney review. It carries more legal risk than Monitor and splits attention at launch.
5. **Email provider.** Recommended: any transactional provider with a free starter tier. Needed for both auth email and alerts.
6. **Attorney review** of Terms, Privacy, and the record's name. "Good-Faith Remediation Record" implies a legal standing the product rules say we do not claim. Recommended: review before Phase 5 copy is final.
7. **Gemini tier.** Letters contain names and legal details. Confirm the key is paid, and read Google's data terms before anyone pays us.

## 10. Changelog

- 2026-11-07: Created from a status review against `main`, production, Stripe, and Netlify.
- 2026-11-07: Phase 0 migration written and rehearsed. Added the profile-save and `owner_id` bugs to Phase 1. Closed Decision 2. Changed the rehearsal method until migration history is reconciled.
- 2026-11-07: Phase 0 migration applied to production and verified. Added homepage copy fixes to Phase 2. One function removal remains.
- 2026-11-07: Phase 1 migrations written and tested locally, not applied. Retired the 2026-02 isolation migration. Switched the rehearsal method to a local database. Added the publishable-key audit path to Phase 2.
- 2026-11-07: Applied the sign-up and profiles migration, and deployed `generate-accessibility-analysis`. Both are verified in production. The isolation migration still waits on Decision 1.
- 2026-11-07: Applied the profile repair to production as `20261108004110_repair_profile_emails_and_letter_policy`. Production had no stale emails, missing profiles or repeated timestamps, so no rows changed. The leftover letter insert policy was not present there. Rebuilt databases now drop it too.
- 2026-11-07: Decision 1: archived the 46 ownerless letters, 42 audits and their 620 violations to the locked `archive` schema on production (`20261108014858_archive_ownerless_legacy_rows`). Production now has no ownerless rows, so the isolation migration's guard passes. Purge date 2026-12-08, via `archive.purge_expired_ownerless()`, which nothing runs automatically yet.
- 2026-11-07: Applied tenant isolation to production as `20261108015043_tenant_isolation`. Audits and violations are visible only to their owner, and demand-letter insert policy is gone. Checked by role: a signed-out visitor sees 0 audits, an owner sees their own 24 audits and 332 violations, and another user sees only their own 8 audits. Decision 1 is closed.
