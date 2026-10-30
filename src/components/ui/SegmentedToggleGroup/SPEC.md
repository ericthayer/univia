# SegmentedToggleGroup

**Intent:** One pill segmented control for switching a view or dataset in place (dashboard score breakdown, user directory Cards/Table). `styled(ToggleButtonGroup)`; all ToggleButtonGroup props and keyboard behavior are unchanged.

**Usage**

```tsx
<SegmentedToggleGroup exclusive value={view} onChange={…} aria-label="Directory view">
  <ToggleButton value="cards" aria-label="Cards view">…</ToggleButton>
</SegmentedToggleGroup>
```

**Accessibility:** Native toggle-button semantics (`aria-pressed`). Buttons are 36px tall inside a 4px track (44px overall target). Selection is signaled by fill and a ring, not by color alone. Disabled segments drop to 45% opacity and stay in the tab order rules MUI defines.

**Changelog**
- 2026-10-29 — Extracted from `ScoreBreakdownCard`. The selected segment uses an inset 1px ring instead of the old `0 1px 2px` drop shadow.
