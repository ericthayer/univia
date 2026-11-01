# BezelCard

**Intent:** The one surface primitive for the refreshed pages. A shell (tray) with a hairline border holds a core (plate) with an inset highlight; radii are concentric (`shellRadius − shellInset = coreRadius`). See `docs/specs/ui-refresh/SPEC.md` §3.1.

**Usage**

```tsx
<BezelCard component="section" aria-labelledby="recent-audits" accent="success" interactive reveal={2}>
  …
</BezelCard>
```

- `sx` styles the core; all other props (including `component`, `aria-*`) land on the shell.
- `padding`: `md` (24px, 16px below `sm`), `sm` (16px), `none`.
- `interactive`: 2px lift on hover, settle on press. Pair with a `CardActionArea` or button inside; the shell itself is not focusable.
- `reveal`: stagger index for the mount animation (60ms steps, capped at 8). Uses `animation-fill-mode: backwards` so hover transforms are not overridden after the reveal ends.

**Architecture:** `styled` components reading `theme.surfaces`, `theme.transitions.easing.spring`, `theme.transitions.duration.slow`. Dark-scheme overrides via `theme.applyStyles('dark', …)`.

**Accessibility:** The accent line is `aria-hidden`. No color is the sole signal. Motion honors the global `prefers-reduced-motion` rule in `index.css`.

**Performance:** Animates `transform`, `opacity`, `border-color` only. No backdrop filters, no outer shadows.

**Changelog**
- 2026-10-29 — Created.
- 2026-10-29 — Removed the diffused ambient drop shadows (rest and hover). The core keeps only a crisp 1px inset highlight; depth comes from the nested shell and hairline border.
