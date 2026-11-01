# ScoreBar

**Intent:** One progress-bar block for every averaged Lighthouse score. Removes fourteen near-identical copies from `UserAuditMetrics` and `AccessibilityAudit`.

**Usage**

```tsx
<ScoreBar label="Accessibility" value={94} />
<ScoreBar label="SEO" value={97} size="sm" />
```

- Tone follows the value through `scoreTone` (≥ 90 success, ≥ 70 warning, else error); pass `tone` to override.
- `scoreTone` and `clampScore` are exported for `ScoreStrip` and `ComplianceGauge`.

**Accessibility:** The `LinearProgress` carries `aria-label="<label> score"`, `role="progressbar"`, and `aria-valuenow` from MUI. The numeral is always visible; color is never the only signal.

**Performance:** Only the bar's `transform` animates.

**Changelog**
- 2026-10-29 — Created.
