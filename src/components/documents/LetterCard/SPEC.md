# LetterCard

**Intent:** One uploaded demand letter in the "Your Demand Letters" grid: file name, status / risk / deadline / model chips, extracted meta, and the AI summary clamped to three lines with an expand toggle. Replaces the inline card markup that lived in `DemandLetters.tsx`.

**Usage**

```tsx
<LetterCard letter={letter} reveal={index} />
```

Sibling `letterStatus.ts` exports `getRiskColor`, `getStatusColor`, `getDaysUntilDeadline` for callers that need the same mappings.

**Architecture:** Composes `BezelCard` (`interactive`, `component="article"`). Local `expanded` state only. Share and View buttons are visual placeholders with no handlers (unchanged from the previous page).

**Accessibility:** Article labelled by file name; meta rendered as a `<dl>`; the summary toggle exposes `aria-expanded` and `aria-controls`. Chips always carry text; color is never the only signal. Amounts and dates use tabular numerals.

**Changelog**
- 2026-10-29 — Created.
