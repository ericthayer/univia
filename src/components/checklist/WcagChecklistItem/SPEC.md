# WcagChecklistItem

**Intent:** One WCAG success criterion as a flush row inside a category surface. Replaces the per-item bordered cards (cards nested inside accordions) on the Compliance Checklist.

**Usage**

```tsx
<Box component="ul" sx={{ m: 0, p: 0 }}>
  <WcagChecklistItem criterion={item} completed={done} notes={notes} onToggle={…} onNotesChange={…} />
</Box>
```

- `WcagLevelPill` maps conformance level to visual weight: **A** solid (essential), **AA** tint (target), **AAA** outline (enhanced). Monochrome; emphasis tracks importance.
- Completed rows get a quiet `action.hover` fill and secondary-colored title (no strike-through, no green).

**Accessibility:** Checkbox and notes field have explicit accessible names containing the criterion title (they had none). Checkbox hit area is 44px. The criterion title is an `h3` under the category's `h2`.

**Changelog**
- 2026-10-29 — Created for the site-wide design-language pass.
