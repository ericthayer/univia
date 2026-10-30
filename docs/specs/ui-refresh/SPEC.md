# SPEC: UI refresh for Dashboard, Site Audit, Analyze Letter, User Management

**Status:** Draft for approval
**Branch:** `feat/ui-update`
**Direction chosen:** Instrument panel (monochrome brand, nested-bezel surfaces, bento layout, tabular numerals, restrained motion)
**Decisions already made:** remove fabricated User Management numbers; user signs in manually for live testing.

---

## 1. Intent

The four most-used screens read as "template with a dark theme": flat hairline cards on a flat background, duplicated progress-bar blocks, category-colored scores that mislead (a perfect 100 renders yellow), fake admin metrics, and dead whitespace (a 600px table for one row). The brand itself is strong and restrained (DM Sans, near-black / near-white, inline SVG icons). This refactor keeps that brand and raises the finish: machined, layered surfaces; one consistent score vocabulary; honest data; layouts that use the width they have; motion that feels physical and respects reduced-motion.

No new dependencies. No changes to navigation, footer, routing, or data access.

## 2. Non-goals

- Logged-out Dashboard hero and "Standards Overview" marketing blocks (untouched).
- Audit Results page, Pattern Library, auth pages, settings.
- Wiring dead buttons (Share / View on letter cards; Engage / Export / Delete in the admin bulk bar). They stay visually, unchanged in behavior.
- Replacing MUI, Material icon paths, or the theme's base radius. The high-end-visual-design skill's Tailwind-specific rules (banned Material icons, detached pill navbar) conflict with AGENTS.md and are intentionally not applied; this is noted in code comments where relevant.

## 3. Design language

### 3.1 Surfaces: the nested bezel

Every primary card is two layers so it reads like a glass plate seated in a tray.

| Layer | Light | Dark | Radius | Notes |
|---|---|---|---|---|
| Shell (outer) | `rgba(0,0,0,0.035)` fill, `1px solid divider` | `rgba(255,255,255,0.04)` fill, `1px solid divider` | 20px | 6px inset padding |
| Core (inner) | `background.paper` + `inset 0 1px 0 rgba(255,255,255,0.9)` (no outer shadow) | `background.paper` + `inset 0 1px 0 rgba(255,255,255,0.06)` | 14px (= 20 − 6, concentric) | content padding 24px (16px below `sm`) |

Interactive surfaces lift 2px on hover and settle on press. Optional `accent` renders a 2px tone line along the core's top edge (replaces today's left-border stripe on stat cards).

### 3.2 Typography additions (theme variants, additive)

- `eyebrow`: 0.6875rem, weight 600, uppercase, letter-spacing 0.14em, `text.secondary`. Rendered as `span`.
- `metric`: `clamp(2.25rem, 6cqw, 3.5rem)`, weight 650, letter-spacing −0.03em, line-height 1, `font-variant-numeric: tabular-nums`. Rendered as `p`.
- All scores and counts anywhere on these pages use `tabular-nums`.

### 3.3 Score vocabulary (one rule everywhere)

Scores are colored by **value**, never by category: ≥ 90 `success`, ≥ 70 `warning`, else `error`. This already governs `ComplianceGauge`; it now also governs the Perf / A11y / BP / SEO strip and every score bar. Category is conveyed by label, not hue.

### 3.4 Motion

- Easing token `spring = cubic-bezier(0.32, 0.72, 0, 1)`; durations 300ms (color/border) and 600ms (transform/shadow).
- Only `transform` and `opacity` animate. No `transition: all` remains in touched files.
- Mount reveal on surfaces: `opacity 0→1`, `translateY(12px)→0`, 600ms spring, stagger 60ms × index (capped at 8). CSS keyframes only; the global `prefers-reduced-motion` rule in `index.css` already collapses it.
- No scroll listeners. No backdrop blur on scrolling content.

### 3.5 Page canvas

Each page sits on a faint top-centered radial glow (`radial-gradient(60% 40% at 50% 0%, rgba(255,255,255,0.05), transparent 70%)` dark; `rgba(0,0,0,0.03)` light) painted as a non-interactive background on the page root. Vertical rhythm: header block, then sections separated by 48px (32px below `md`).

Container widths: Dashboard, Site Audit, Analyze Letter use `lg`; User Management uses `xl` (tables want width). Gutter 32px (16px below `sm`).

## 4. Architecture

### 4.1 Theme (additive only)

`src/theme/tokens.ts`
- `surfaceTokens`: `{ shellRadius: 20, coreRadius: 14, shellInset: 6 }`
- `motionTokens`: `{ spring: 'cubic-bezier(0.32, 0.72, 0, 1)', slow: 600 }`

`src/theme/theme.ts`
- Module augmentation: `Theme.surfaces`, `ThemeOptions.surfaces`; `Easing.spring`; `Duration.slow`; typography variants `eyebrow` and `metric` (+ `variantMapping`).
- Nothing existing is modified.

`src/components/ui/Icon.tsx`
- Add Material paths: `view_list`, `grid_view`, `north_east` (used for the nested trailing-arrow), `shield`, `warning` (both referenced today but missing, which logs console warnings).

### 4.2 New shared primitives (`src/components/ui/<Name>/<Name>.tsx`, named exports, each with a short `SPEC.md`)

| Component | Props | Purpose |
|---|---|---|
| `BezelCard` | `children`, `accent?: Tone`, `interactive?`, `reveal?: number` (stagger index), `padding?: 'none' \| 'sm' \| 'md'`, `component?`, `sx?` | Nested-bezel surface (3.1). `styled` implementation; `sx` lands on the core. |
| `MetricTile` | `label`, `value: string \| number`, `support?`, `icon?: ReactNode`, `tone?: Tone`, `loading?` | KPI tile: eyebrow label, `metric` numeral, support line, icon in a 36px nested circle. Skeleton when `loading`. Built on `BezelCard`. |
| `ScoreBar` | `label`, `value: number`, `tone?: Tone` (defaults to value-based), `size?: 'sm' \| 'md'` | Label + tabular value + 6px pill `LinearProgress` with `aria-label`. Replaces 14 duplicated blocks. |
| `ScoreStrip` | `scores: { performance, accessibility, bestPractices, seo }`, `size?: 'sm' \| 'md'` | Four-up Perf / A11y / BP / SEO readout, value-colored (3.3). Each cell is a `<dl>` pair for screen readers. |
| `PageHeader` | `eyebrow?`, `title`, `description?`, `actions?: ReactNode`, `titleComponent?: 'h1' \| 'h2'` | Consistent page header, actions wrap below title under `md`. |
| `SectionHeader` | `title`, `meta?: ReactNode`, `action?: ReactNode`, `component?: 'h2' \| 'h3'` | Section title row with optional count / trailing link. |
| `EmptyState` | `icon: string`, `title`, `description?`, `action?: ReactNode` | Replaces four hand-rolled empty states. |
| `PageCanvas` | `children`, `maxWidth: 'lg' \| 'xl'` | Page root with glow (3.5), container, rhythm. |
| `ArrowButton` | extends `ButtonProps` | Primary CTA pill with the trailing arrow nested in its own circle; arrow translates 2px on hover. Used for Run Audit, Analyze Document, quick audit submit, "View report". |

`Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info'`, exported from `BezelCard`. `scoreTone(value)` helper lives in `src/components/ui/ScoreBar/scoreTone.ts` and is reused by `ScoreStrip` and `ComplianceGauge`.

### 4.3 Existing components touched

- `ComplianceGauge`: track color from tokens (`action.hover` light / `rgba(255,255,255,0.08)` dark) instead of hardcoded rgba; `transition: stroke-dashoffset 600ms spring` instead of `all`; uses `scoreTone`. API unchanged (Audit Results keeps working).
- `AuditHistoryCard`: becomes a flush row (no own border) designed to sit inside a `BezelCard` list with hairline separators; uses `ScoreStrip`; pin button gets `aria-label` + `aria-pressed`; pinned rows get a 2px `primary` accent on the left edge and the existing "Pinned" chip. Hover: background `action.hover`, no lift.
- `StatCard`, `GlassCard`: untouched (Pattern Library still uses them).

### 4.4 Page compositions

#### Dashboard (`/`, logged in) — orchestrated by `UserAuditMetrics`, decomposed into `src/components/dashboard/*`

```
PageCanvas lg
  PageHeader  eyebrow "Overview" · "Your Audit Performance" · actions: QuickAuditBar
  Bento (CSS grid; container query on the grid's own width)
    @container ≥ 1000px: columns 5fr 7fr  |  ≥ 640px: 1fr 1fr  |  else 1fr
    [LatestScoreCard]  spans 2 rows at ≥ 1000px
    [MetricTile ×4]    2×2 inside the 7fr cell (Total Audits · Avg Accessibility · Avg Performance · Avg Best Practices)
  Row 2  (@container ≥ 1000px: 7fr 5fr; else stacked)
    [RecentAuditsList] BezelCard · SectionHeader "Recent Audits" (count, "View all →" to /audit) · up to 10 AuditHistoryCard rows, pinned first
    [ScoreBreakdownCard] BezelCard · pill ToggleButtonGroup "Overall (22) / Desktop (11) / Mobile (11)" · four ScoreBar
```

- `QuickAuditBar` (`src/components/dashboard/QuickAuditBar/`): URL field (pill, globe adornment) with nested circular submit (`ArrowButton` variant `icon`) + "Analyze Docs" outlined button opening the existing `DocumentUploadDrawer`. Enter submits; invalid URL disables submit; running state shows spinner and `aria-busy`.
- `LatestScoreCard`: gauge (size 180), "Latest Audit Score" eyebrow, scanned URL (new, truncated), date, `ArrowButton` "View report" → `/audit/:session`. Empty state when no audits.
- `ScoreBreakdownCard`: toggle switches the dataset in place; a device toggle with zero audits is disabled. Default: Overall.
- Loading: `MetricTile loading`, gauge card skeleton. Error: existing `Alert` above the bento.

#### Site Audit (`/audit`)

```
PageCanvas lg
  PageHeader  eyebrow "Lighthouse" · "Web Accessibility Audit" · description
  BezelCard "Run Audit": TextField (pill, globe adornment, clear button) · ValidationFeedback · ArrowButton "Run Audit" (full width ≤ sm) · Cancel while running
  BezelCard tabs surface
    Tabs (MUI, URL-synced `?tab=history|metrics|checks`) — "Audit History" · "Performance Metrics" · "What We Check"
    history : SectionHeader (count) · sticky search (shown when > 5) · flush AuditHistoryCard rows · Pagination (`?page=`) · EmptyState
    metrics : "Latest Audit Scores" four ComplianceGauge (120) in a responsive row · "Average Scores (last N)" four ScoreBar in a 2×2 · EmptyState
    checks  : intro paragraph · 2-column grid of six check items (icon in nested circle, title, description)
```

- Submit focuses the URL field when validation fails (first-error focus).
- Running state: `role="status"` live region announces "Running audit for {url}".
- Data loading and grouping logic is unchanged; the stray `useState` declared after use is moved to the top of the component.

#### Analyze Letter (`/letters`)

```
PageCanvas lg
  PageHeader  eyebrow "AI analysis" · "Analyze Demand Letters" · description incl. Gemini disclosure
  Row (≥ md: 7fr 5fr; else stacked)
    [BezelCard upload]   InlineDocumentUpload (restyled) — or InlineAnalysisResults when a result exists
    [BezelCard "What happens next"] numbered steps · "Need legal help?" link block (moved up from the bottom of the list)
  SectionHeader "Your Demand Letters" (count)
  Letters grid: CSS grid `repeat(auto-fill, minmax(20rem, 1fr))` of LetterCard · Skeleton ×3 while loading · EmptyState · error Alert with Retry
```

- `InlineDocumentUpload` changes: dropzone becomes `<label for="file-upload-inline">` with a visually-hidden but focusable `<input type="file">` (keyboard operable; `:focus-within` ring); dashed inner bezel; upload icon in nested circle; file-selected state shows name, size, "Remove"; stage progress wrapped in `role="status" aria-live="polite"`; caption adds "Your file is sent to Google Gemini for analysis and is not used for training."; the `display:none` marketing paragraph is deleted; advanced options menu unchanged.
- `LetterCard` (`src/components/documents/LetterCard/`): file name clamped to 2 lines, status / risk chips (risk uses tone), deadline chip when ≤ 30 days, model chip, meta grid, summary clamped to 3 lines with "Show more / Show less" toggle (`aria-expanded`), existing Share / View buttons unchanged.
- The hidden `Tabs` in `DemandLetters.tsx` are removed; the upload/result swap keeps the same state logic.

#### User Management (`/admin/users`)

```
PageCanvas xl
  PageHeader  eyebrow "Admin" · "User Management" · description
  MetricTile ×3  New Users (7 days) · Active Users · Churned Users   (no deltas, no revenue, no sparklines)
  BezelCard directory
    Toolbar: ToggleButtonGroup "Cards | Table" (Icon view_list / grid_view, labels match content) · Status select · Tier select · search
    cards : CSS grid `repeat(auto-fill, minmax(18rem, 1fr))` of UserCard (BezelCard, interactive)
    table : DataGrid autoHeight, rowHeight 64, columns User · Tier · Status · Audits · Last Active · actions (Icon edit / delete, aria-labels kept)
    EmptyState when filters match nothing
    Bulk bar (table, ≥1 selected): floating nested-bezel pill, bottom center, unchanged buttons
```

- URL state: `?view=cards|table&status=&tier=&q=` via `useSearchParams`; defaults match today (`cards`, `all`, `all`, empty).
- Removed from state and rendering: `generateMockTrend`, `activity_trend`, `new_users_change`, `active_users_change`, `total_revenue`, `revenue_change`.
- Inline Lucide-style SVGs are replaced with the project `Icon` component.
- Access-denied view uses `PageCanvas` + `EmptyState`.
- Loading: three `MetricTile loading` + card skeletons.

### 4.5 State and data flow

Unchanged: Supabase queries, `useUserAudits`, `useFormValidation`, `ensureSession`, `requestLighthouseAudit`, upload fetch. New state is UI-only (tab, page, filters, view) and lives in the URL where the AGENTS.md conventions require it. No new context.

## 5. Accessibility

- Every icon-only control has `aria-label`; the pin toggle also exposes `aria-pressed`.
- Async status (audit running, upload stage) is announced via `role="status"` / `aria-live="polite"`.
- Audit form focuses the first invalid field on submit; the dropzone is keyboard operable via the native file input.
- Tabs remain MUI `Tabs` (roving tabindex, `aria-controls`); the view/dataset toggles are `ToggleButtonGroup` with `aria-label`.
- Score strips render label/value as `<dl>`; colors are never the only signal (the numeral and label are always present).
- Contrast: eyebrow text uses `text.secondary` on `background.paper` (≥ 4.5:1 in both schemes with the existing tokens). Accent lines are decorative (`aria-hidden`).
- Motion collapses under `prefers-reduced-motion` through the existing global rule; no component sets `!important` durations of its own.
- Touch targets ≥ 44px for all buttons, pin toggles, and toggle groups.

## 6. Performance

- No new dependencies; no images; no webfonts beyond the self-hosted DM Sans already loaded.
- Only `transform` / `opacity` animate; the glow is a static gradient, no filter.
- Lists: audits capped at 30 (existing), letters rendered as cards (expected < 50), users virtualized by DataGrid. If letters exceed 50, paginate (documented follow-up, not built now).
- Bento uses CSS grid + container queries, no JS measurement.
- Bundle budget: primitives add < 6 KB gzipped combined; verified with `npm run build`.

## 7. Testing

Vitest + Testing Library, colocated:

- `BezelCard.test.tsx`: renders children; `interactive` sets hover styles via class; `accent` renders the decorative line `aria-hidden`.
- `MetricTile.test.tsx`: label / value / support render; `loading` renders a skeleton and no numeral.
- `ScoreBar.test.tsx`: `scoreTone` thresholds (90 → success, 89 → warning, 70 → warning, 69 → error); progressbar has `aria-label` and `aria-valuenow`.
- `ScoreStrip.test.tsx`: four cells, values colored by threshold.
- `ScoreBreakdownCard.test.tsx`: toggling Desktop swaps the bar values; a zero-count device is disabled.
- `UserManagement` filter sync: changing status writes `?status=` and filters rows (router + supabase mocked, pattern from existing tests).
- Existing `InlineDocumentUpload.test.tsx` must keep passing after the dropzone becomes a label.

Verification commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then a browser pass on all four pages in light and dark, desktop and 375px, plus one live audit run and one resume analysis.

## 8. Implementation checklist

- [x] Phase 0 — theme tokens, typography variants, Icon paths
- [x] Phase 1 — primitives + tests (BezelCard, MetricTile, ScoreBar + scoreTone, ScoreStrip, PageHeader, SectionHeader, EmptyState, PageCanvas, ArrowButton)
- [x] Phase 2 — Dashboard (QuickAuditBar, LatestScoreCard, ScoreBreakdownCard, RecentAuditsList; UserAuditMetrics recomposed; AuditHistoryCard + ComplianceGauge updates)
- [x] Phase 3 — Site Audit (URL-synced tabs/page, first-error focus, live region)
- [x] Phase 4 — Analyze Letter (InlineDocumentUpload a11y + restyle, LetterCard, layout)
- [x] Phase 5 — User Management (fakes removed, URL filters, Icon swap, autoHeight table, cards)
- [x] Phase 6 — typecheck / lint / test / build green; browser pass on Dashboard, Site Audit, Analyze Letter (dark + light, desktop + 375px); one live audit (univia.help) and one resume analysis completed. User Management verified by its three tests only: the test account is not an admin, so the route guard blocks the page in the browser.

Phases 3, 4, 5 are independent once Phase 1 lands and may run in parallel.

## 10. Deviations from the draft (decided during implementation)

- **Metric tile tones follow the value.** The three average tiles take `scoreTone(value)` instead of a fixed per-category color, so §3.3 holds for KPI tiles too. "Total Audits" stays neutral.
- **Quick-audit submit is an `IconButton`, not an `ArrowButton` variant.** `ButtonProps.variant` is closed; a 32px filled circle inside the field reads the same and keeps `aria-label` / `aria-busy`.
- **`ArrowButton` is typed as `ExtendButton<ButtonTypeMap>`** so `component={RouterLink} to` type-checks; `fullWidth` spreads label and arrow to the edges.
- **`InlineDocumentUpload` guards `theme.surfaces?.coreRadius`** because its existing test renders without the project theme. New tests use `src/test/renderWithTheme.tsx`.
- **User Management load effect depends on `Boolean(profile?.is_admin)`** rather than the `profile` object, which removed a reload loop on identity changes. Default view remains `cards`.
- **`showNextSteps` prop on `InlineDocumentUpload`** (default `true`) keeps the drawer unchanged while the page renders the steps in its own column.
- **Shared `srOnly` helper** at `src/components/ui/srOnly.ts` for live regions.

## 11. Follow-ups noticed, not built

- Dashboard "Recent Audits" lists one row per device (two rows per run) because `useUserAudits` does not group by `audit_session_id`; the Site Audit page does group. Pre-existing; align the hook.
- The `analyze-document` function returned "extracted text is heavily corrupted with OCR errors" for a clean text PDF resume; PDF text extraction in the Edge Function deserves a look.
- `InlineAnalysisResults` header actions wrap awkwardly in the 7fr column; the component was out of scope.
- Share / View on letter cards and Engage / Export / Delete in the admin bulk bar remain unwired.

## 9. Changelog

- 2026-10-29 — Initial draft after codebase review and direction/mock-data/sign-in decisions.
- 2026-10-29 — Implementation complete; added §10 deviations and §11 follow-ups; checklist ticked.
- 2026-10-29 — Removed diffused ambient shadows from BezelCard (rest and hover) and the admin bulk-action bar; §3.1 and the "diffused ambient shadows" wording in the direction notes no longer apply. Inset highlights stay.
