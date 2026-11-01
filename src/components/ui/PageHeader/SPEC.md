# PageHeader

**Intent:** One header pattern for Dashboard, Site Audit, Analyze Letter, and User Management: eyebrow, title, description, actions.

**Usage**

```tsx
<PageHeader eyebrow="Overview" title="Your Audit Performance" titleId="dash-title" actions={<QuickAuditBar />} />
```

**Accessibility:** Renders a `<header>`; the title defaults to `h1` (set `titleComponent="h2"` where the shell already provides an `h1`). `titleId` lets a following region reference the title via `aria-labelledby`.

**Layout:** Title block is `flex: 1 1 28rem`, so actions sit right on wide canvases and wrap underneath at phone widths. Title size scales with the container (`cqw`).

**Changelog**
- 2026-10-29 — Created.
