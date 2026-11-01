# SPEC: Billing Management (`/admin/billing`)

**Status:** Implemented
**Branch:** off `feat/ui-update` (PR #26)
**Design language:** UI refresh "instrument panel" (`docs/specs/ui-refresh/SPEC.md`). No new visual primitives.

## 1. Intent

"Billing Management" in the admin user menu routed to User Management. It now opens a billing page built only from data the app actually has.

Univia has no payment processor wired in yet: no subscriptions, invoices, or payment tables exist. The only billing facts are each account's `tier` and `status` in `user_profiles` and each plan's list price in `src/config/tierConfig.ts`. The page reports those honestly and labels every derived money figure as an estimate. Nothing is fabricated (same rule as the User Management refresh).

## 2. Non-goals

- Payment processor integration, invoices, refunds, dunning, coupons.
- Editing plan prices (they live in code) or changing an account's plan (User Management owns account edits).
- Navigation changes: the existing admin menu link and route stay; only the route's element changes.

## 3. Composition

```
PageCanvas xl
  PageHeader  eyebrow "Admin" · "Billing Management" · description · action: "View pricing page" → /pricing
  MetricTile ×4  Estimated MRR · Paid Accounts · Custom-Priced · Churned Paid
  Row (@container ≥ 900px: 7fr 5fr; else stacked)
    [PlanMixCard]      share of accounts per plan (TierPill, count, share bar, estimated monthly)
    [PlanCatalogCard]  each plan's list price, audit limit, team seats, active accounts
  BezelCard "Accounts"
    Toolbar: FilterSelect Plan (Paid | All | Basic | Pro | Enterprise) · FilterSelect Status · search
    BillingAccountsTable  Account · Plan · Status · Member since · List price · "Manage" → /admin/users?q=<email>
    EmptyState when filters match nothing
  BezelCard "Invoices"
    EmptyState "No invoices yet": invoices, payment methods, and failed charges appear once a payment processor is connected.
```

## 4. Definitions (src/utils/billing.ts)

| Term | Rule |
|---|---|
| List price | `USER_TIERS[tier].price` parsed: `$49` → 49, `$0` → 0, `Custom` → `null` |
| Paid account | tier list price is not 0 (pro, enterprise) and status `active` |
| Estimated MRR | Σ list price over active accounts with a numeric price. Custom-priced plans are excluded and counted separately |
| Paid share | paid accounts ÷ active accounts |
| Churned paid | status `churned` on a paid tier |
| Unknown tier | treated as `basic` (same as User Management) |

## 5. State

URL-backed (`useSearchParams`, defaults omitted): `?plan=paid|all|basic|pro|enterprise` (default `paid`), `?status=all|active|inactive|churned` (default `all`), `?q=`. Data loads once through `useBillingAccounts` (admin only).

## 6. Accessibility

- One `h1`; card titles are `h2` via `SectionHeader`, sections labelled with `aria-labelledby`.
- Share bars carry `aria-label` with plan name and percentage; numbers are always printed next to the bar.
- Table is a native `<table>` with a caption (visually hidden) and `scope="col"` headers; it scrolls horizontally inside its card on narrow screens.
- Load errors render an `EmptyState` with a Retry button; loading uses `MetricTile loading` and `aria-busy`.

## 7. Testing

- `billing.test.ts`: price parsing, MRR excludes custom and non-active, paid share, churned paid, unknown tier.
- `BillingManagement.test.tsx`: tiles render from mocked profiles; default `paid` filter hides basic accounts; switching Plan to All writes `?plan=all` and shows them.

## 8. Changelog

- 2026-11-01 — Created and implemented.
