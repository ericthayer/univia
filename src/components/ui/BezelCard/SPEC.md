# BezelCard

**Intent:** The one surface primitive for the refreshed pages. A single card: the shell draws the hairline border and `background.paper` fill at `shellRadius` (20px); the core is the unpadded-by-default content area with no second fill or inset highlight. See `docs/specs/ui-refresh/SPEC.md` §3.1.

**Usage**

```tsx
<BezelCard component="section" aria-labelledby="recent-audits" interactive reveal={2}>
  …
</BezelCard>
```

- `sx` styles the core; all other props (including `component`, `aria-*`) land on the shell.
- `padding`: `md` (24px, 16px below `sm`), `sm` (16px), `none`.
- `interactive`: 2px lift on hover, settle on press. Pair with a `CardActionArea` or button inside; the shell itself is not focusable.
- `reveal`: stagger index for the mount animation (60ms steps, capped at 8). Uses `animation-fill-mode: backwards` so hover transforms are not overridden after the reveal ends.

**Architecture:** `styled` components reading `theme.surfaces`, `theme.transitions.easing.spring`, `theme.transitions.duration.slow`. Dark-scheme overrides via `theme.applyStyles('dark', …)`.

**Accessibility:** No edge accents; state goes in content (TonePill with a text label, tinted icon). No color is the sole signal. Motion honors the global `prefers-reduced-motion` rule in `index.css`.

**Performance:** Animates `transform`, `opacity`, `border-color` only. No backdrop filters, no shadows.

**Changelog**
- 2026-10-29 — Created.
- 2026-10-29 — Removed the diffused ambient drop shadows (rest and hover). The core keeps only a crisp 1px inset highlight; depth comes from the nested shell and hairline border.
- 2026-11-25 — Removed the double-card effect: no tinted shell tray, no 6px inset, no core fill or inset highlight. The shell is now the paper surface; `coreRadius` = 19px (shell radius minus border).
- 2026-11-25 — Light scheme: white fill + #D4D4D4 border (`cardTokens.light`) for contrast against the page; dark unchanged.
- 2026-11-25 — Removed the `accent` prop (top tone line). Cards show state with a TonePill or tinted icon instead.
