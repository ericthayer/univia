# SPEC: Share a demand-letter analysis

**Status:** Implemented (migration not yet applied to production)
**Design language:** UI refresh (`docs/specs/ui-refresh/SPEC.md`). No new visual language: the dialog uses MUI `Dialog` with theme defaults, controls take `controlRadius`, the share view reuses `PageCanvas`, `PageHeader`, `BezelCard` and `InlineAnalysisResults`.

## 1. Intent

The **Share** buttons on the analysis results view and on each "Your Demand Letters" card did nothing. Owners need to send an analysis to a lawyer, insurer, or business partner who may not have an account. Demand letters are sensitive legal documents, so a share must be:

- **Opt-in and specific**: one link per share action, for one letter.
- **Time-boxed**: every link expires (24 hours, 7 days, or 30 days). No "never expires".
- **Revocable**: the owner sees every active link with its view count and can revoke any of them at once.
- **Minimal**: recipients see the analysis only. Never the original file, the extracted raw text, the storage path, or any ids.

## 2. Security model

| Concern | Decision |
|---|---|
| Token | 32 random bytes from `gen_random_bytes` (256 bits), base64url, 43 chars. Unguessable; no rate limit needed for brute force. |
| Storage | Only `sha256(token)` is stored in `shared_analysis_links.share_token`. A database leak or a backup does not expose working links. The raw link is shown once, at creation. Lost it → make a new one. |
| Table access | `anon` and `authenticated` have **no** table privileges on `shared_analysis_links`; every old non-service policy is dropped. All access goes through four `SECURITY DEFINER` RPCs with explicit ownership checks. This also closes the prod policy that let anyone list every active token. |
| Ownership | RPCs check `demand_letters.user_id = auth.uid()` directly. They do not depend on `user_owns_letter()` / `univia_is_admin()` from the tenant-isolation migration, which is not applied in production. |
| Link in URL | `/shared/letter#<token>`. The token lives in the URL fragment, so browsers never send it to Netlify, analytics, or a `Referer` header. |
| Recipient response | `get_shared_letter_analysis` returns the same `NULL` for unknown, expired, and revoked links, so it is not an oracle. Each successful read increments `access_count` and sets `last_accessed_at`. |
| Indexing | The share page sets `<meta name="robots" content="noindex, nofollow">` and `referrer: no-referrer` while mounted. |
| Limits | 10 active links per letter. Expiry between 1 and 30 days. |

### RPCs (migration `20261101120000_letter_share_links.sql`)

| Function | Caller | Returns |
|---|---|---|
| `create_letter_share(p_letter_id uuid, p_expires_in_days int)` | letter owner | `{ id, token, expires_at }` |
| `list_letter_shares(p_letter_id uuid)` | letter owner | active links only (no tokens) |
| `revoke_letter_share(p_link_id uuid)` | link creator who still owns the letter | `boolean` |
| `get_shared_letter_analysis(p_token text)` | anyone (`anon`, `authenticated`) | `jsonb` analysis payload or `NULL` |

The migration also adds `demand_letters.analysis_result jsonb` and makes `insert_demand_letter` persist it, so new uploads keep the full analysis (key points, legal analysis, recommended actions). Letters analyzed before that show the persisted fields only (summary, risk, deadline, parties, violations).

## 3. UI

### ShareLetterDialog (`src/components/documents/ShareLetterDialog/`)

```
Dialog "Share analysis"
  Text: what the recipient sees, and that the original document is never shared
  "Link expires after"  SegmentedToggleGroup  24 hours | 7 days | 30 days
  [Create link]
  -- after create --
  Read-only TextField (the URL) + [Copy]  · status line "Link copied"
  Note: "Copy it now. For security we only store a fingerprint of this link."
  -- active links --
  <ul> Created {date} · Expires {date} · {n} views   [Revoke]
  [Done]
```

Opened from `InlineAnalysisResults` (uses `analysis.letter_id`) and from `LetterCard`. If there is no `letter_id` (analysis not saved), the dialog explains why and offers no Create button.

### SharedLetter page (`/shared/letter`)

Public route inside the app shell, no auth guard. `InlineAnalysisResults` gains a `readOnly` prop (hides Upload Another / Share / Export PDF) and skips empty Key Information / Recommended Actions / Additional Resources sections, which older letters do not have. `PageCanvas` → `PageHeader` (eyebrow "Shared analysis", title = file name, description = expiry date) → `BezelCard` with `InlineAnalysisResults readOnly`. Invalid, expired, or revoked links get one `EmptyState` with the same copy.

## 4. Accessibility

- Dialog labelled by its title, described by its intro text. Full-screen below `sm`. Expiry choice is a `<fieldset>` with a `<legend>`.
- Copy result announced through `role="status"`; errors through `role="alert"`.
- Link field has a visible label and is read-only, selectable, and focusable.
- Active links are a `<ul>`; each Revoke button's accessible name includes the link's creation date.
- Touch targets ≥ 44px.

## 5. Not built

- Password-protected links (column exists; adds friction most owners will skip).
- Sharing the original file. Needs signed Storage URLs and a separate consent step.
- Email delivery of the link. Users paste it where they already talk to their lawyer.

## Changelog

- 2026-11-01 — Created.
