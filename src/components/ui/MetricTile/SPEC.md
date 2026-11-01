# MetricTile

**Intent:** The KPI tile for dashboards (Total Audits, Avg Accessibility, New Users, …). Supersedes `StatCard` on the refreshed pages; `StatCard` remains for the Pattern Library.

**Usage**

```tsx
<MetricTile label="Avg Accessibility" value="94%" support="Across all audits" tone="success" icon={<Icon name="accessibility_new" />} reveal={1} />
<MetricTile label="Total Audits" value={0} loading />
```

**Architecture:** Composes `BezelCard` (accent = tone) and the `eyebrow` / `metric` typography variants. The icon sits in a 36px nested circle colored by tone.

**Accessibility:** Label and value are paragraphs, not headings (tiles are not sections). The icon wrapper is `aria-hidden`. Loading state renders a `Skeleton` in place of the numeral.

**Changelog**
- 2026-10-29 — Created.
