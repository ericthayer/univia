# TonePill

**Intent:** Small status/tier label that fits the refreshed surfaces. The default MUI `Chip` renders a saturated rectangle (`BASIC`, `ACTIVE`) that fights the hairline-and-tint language of the bezel cards.

**Usage**

```tsx
<TonePill tone="success" dot>Active</TonePill>
<TonePill variant="outline">Basic</TonePill>
<TonePill variant="solid">Enterprise</TonePill>
```

- `tonal` (default): tone tinted at 14% with a 30% hairline.
- `outline`: neutral hairline, secondary text. Lowest emphasis.
- `solid`: inverse (text color as fill). Highest emphasis; the brand stays monochrome.

**Accessibility:** The label text carries the meaning; the dot is `aria-hidden` and never the only signal. Tonal text uses the tone's `dark` shade in light mode and `main` in dark mode so it keeps ≥ 4.5:1 on its tint.

**Changelog**
- 2026-10-29 — Created for User Management.
