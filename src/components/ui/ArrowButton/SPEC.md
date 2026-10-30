# ArrowButton

**Intent:** The primary call-to-action on the refreshed pages (Run Audit, Analyze Document, View report). Pill shape with a nested circular arrow, so the arrow never sits naked beside the label.

**Usage**

```tsx
<ArrowButton type="submit" disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
  Run Audit
</ArrowButton>
<ArrowButton variant="text" component={RouterLink} to="/audit">View all</ArrowButton>
```

**Architecture:** `styled(Button)`; all `ButtonProps` except `endIcon` pass through, so `component`, `href`, `to`, `disabled`, `fullWidth`, and `startIcon` work as usual.

**Accessibility:** The arrow glyph is `aria-hidden`; the visible label is the accessible name. Min height 48px. Press feedback is a 2% scale, never a color-only change.

**Changelog**
- 2026-10-29 — Created.
