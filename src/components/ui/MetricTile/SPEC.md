# MetricTile

**Intent:** The KPI tile for dashboards (Total Audits, Avg Accessibility, New Users, …). Supersedes `StatCard` on the refreshed pages; `StatCard` remains for the Pattern Library.

**Usage**

```tsx
<MetricTile label="Avg Accessibility" value="94%" support="Across all audits" tone="success" icon={<Icon name="accessibility_new" />} reveal={1} />
<MetricTile label="Total Audits" value={0} loading />
```

**Architecture:** Composes `BezelCard` (no edge accent) and the `eyebrow` / `metric` typography variants. The icon sits in a 36px circle: neutral = `action.hover`; toned = TonePill tint recipe (14% fill, 30% hairline, `toneText` glyph). The numeral is one step larger than `metric` (`clamp(2.75rem, 12cqw, 4.25rem)`); an optional `status` renders a tonal `TonePill` with a dot directly under it, left-aligned.

**Accessibility:** State is carried by the `status` text label, not color alone (WCAG 1.4.1); score tiles use `scoreStatus` (Good / Needs work / Poor). Label and value are paragraphs, not headings (tiles are not sections). The icon wrapper is `aria-hidden`. Loading state renders a `Skeleton` in place of the numeral.

**Changelog**
- 2026-10-29 — Created.
- 2026-11-25 — Removed the top accent line. State now reads from the tone-tinted icon badge plus an optional `status` pill.
- 2026-11-25 — Larger numeral; status pill stacked under it, left-aligned.
