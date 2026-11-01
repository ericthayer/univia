# PageCanvas

**Intent:** Shared page framing for the four refreshed screens: glow, container width (`lg` default, `xl` for tables), gutters (32px / 16px below `sm`), vertical rhythm.

**Usage**

```tsx
<PageCanvas maxWidth="xl">
  <PageHeader … />
  …
</PageCanvas>
```

**Performance:** The glow is a static radial gradient on a pseudo-element. No filters, no blur, no scroll listeners.

**Changelog**
- 2026-10-29 — Created.
