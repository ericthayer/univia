# Dashboard components

Feature spec for the signed-in dashboard bento (parent spec: `docs/specs/ui-refresh/SPEC.md` §4.4 "Dashboard"). `UserAuditMetrics` (in `src/components/audit/`) orchestrates data via `useUserAudits` and composes these presentational units.

## Intent

Replace a 500-line monolith with four units that each own one job, so the layout can be a real bento and the score vocabulary stays consistent.

## Units

| Unit | Owns | Depends on |
|---|---|---|
| `QuickAuditBar` | URL field state, audit request, navigation to the report, "Analyze Docs" trigger | `useFormValidation`, `requestLighthouseAudit`, `ensureSession` |
| `LatestScoreCard` | Gauge, scanned URL, date, device chip, "View report"; empty and loading states | `ComplianceGauge`, `EmptyState`, `ArrowButton` |
| `ScoreBreakdownCard` | Dataset toggle (Overall / Desktop / Mobile) and four score bars | `ScoreBar`, `SectionHeader` |
| `RecentAuditsList` | Pinned-first sort, up to `max` rows, "View all" | `AuditHistoryCard`, `SectionHeader` |

## Usage

```tsx
<PageHeader eyebrow="Overview" title="Your Audit Performance" actions={<QuickAuditBar onAnalyzeDocs={open} />} />
<LatestScoreCard audit={metrics.latestAudit} loading={loading} onRunAudit={goToAudit} reveal={0} />
<MetricTile … reveal={1} />
<RecentAuditsList audits={metrics.allAudits} pinnedIds={pinned} onPinToggle={refetch} reveal={5} />
<ScoreBreakdownCard overall={…} desktop={…} mobile={…} reveal={6} />
```

## Layout

Bento grid on the PageCanvas container (`@container` queries): ≥ 1000px `5fr 7fr` with the gauge card beside a 2×2 tile grid; ≥ 640px two columns; else one. Row two: `7fr 5fr` (recent audits / breakdown) at ≥ 1000px, stacked below.

## Accessibility

- Each card is a `<section>` labelled by its heading (`h2` for the hero card, `h3` for the rest; the page title is `h1`).
- The quick-audit submit is an `IconButton` with `aria-label="Run audit"` and `aria-busy`; a visually hidden `role="status"` announces the run.
- The dataset toggle is a `ToggleButtonGroup` with `aria-label`; empty datasets are disabled, not hidden.
- Recent audits are a `<ul>` of `<li>` rows; the pin toggle exposes `aria-pressed`.

## Performance

No new data fetching; `RecentAuditsList` memoizes its sort. Entry reveal uses CSS keyframes with `animation-fill-mode: backwards`.

## Changelog

- 2026-10-29 — Created. Metric tiles for the three averages take their tone from `scoreTone(value)` (SPEC §3.3) rather than a fixed per-category color.
