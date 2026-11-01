# ScoreStrip

**Intent:** The compact four-score readout used on every audit row (dashboard Recent Audits, Site Audit history). Previously hand-built twice with category colors that made a perfect Best Practices score render yellow.

**Usage**

```tsx
<ScoreStrip scores={{ performance: 87, accessibility: 96, bestPractices: 100, seo: 100 }} size="sm" />
```

**Architecture:** Pure presentational; depends on `scoreTone` / `clampScore` and `toneColor`.

**Accessibility:** Rendered as a `<dl>`; each cell is `<dt>` (visible abbreviation + visually hidden full name) and `<dd>` (tabular numeral). Visual order is value over label via `column-reverse`; DOM order keeps term before definition.

**Changelog**
- 2026-10-29 — Created.
