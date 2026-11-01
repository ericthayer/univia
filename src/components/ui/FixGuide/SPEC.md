# FixGuide

**Intent:** Site Audit's "How to fix" used to echo raw Lighthouse text: unrendered markdown links, raw console errors, and the Lighthouse rule id shown as a WCAG criterion ("WCAG errors-in-console"). Most Univia users have no accessibility or web-performance background. FixGuide turns each violation into plain-language guidance they can act on or hand to whoever builds their site.

**Usage**

```tsx
import { getFixGuidance } from '../../../config/fixGuides';
const guidance = getFixGuidance(violation); // pure; also used by the PDF report
<FixGuide guidance={guidance} />
```

`ViolationCard` renders the summary, WCAG / category pills, and the `FixGuide` body inside its existing collapse.

**Architecture**

| Layer | File | Role |
|---|---|---|
| Content | `src/config/fixGuides/{accessibility,bestPractices,seo,performance}.ts` | Curated guide per Lighthouse rule id (families share one object) |
| Standards | `src/config/fixGuides/wcag.ts` | WCAG 2.2 criterion id to name, level, W3C Understanding URL |
| Resolver | `src/config/fixGuides/index.ts` (`getFixGuidance()`) | Merges guide + stored violation into `FixGuidance`; category fallback when uncurated |
| Parsing | `src/utils/lighthouseText.ts` | Markdown links out of descriptions; `Element:` / `Resource:` instance rows |
| Diagnosis | `src/utils/consoleDiagnosis.ts` | Plain reading of common console errors (4xx/5xx, X-Frame-Options, CSP, CORS, mixed content, JS crashes) |
| UI | `FixGuide.tsx`, `GuideSection.tsx`, `CodeSample.tsx`, `InstanceList.tsx` | Presentation only |

Sections, in order: quick facts (`dl`: usually fixed by, effort, who it affects), why it matters, how to fix (ordered steps), code example (before/after), where we found it (instances + diagnosis), learn more (Lighthouse doc, WCAG Understanding, tools).

**Content approach:** Curated, not generated. Deterministic, free, instant, reviewable, and safe to show someone facing a demand letter. Unknown rules fall back to the cleaned Lighthouse description plus category-level steps. Per-site AI analysis (Gemini) is a possible later layer on top, not a replacement.

**Accessibility:** Each section is a `section` labelled by an `h4` eyebrow (card title is `h3`). Quick facts are a `dl`. Code sits in `figure`/`figcaption` + `pre`. External links open in a new tab with visually hidden "(opens in a new tab)" and `rel="noopener noreferrer"`; the arrow icon is `aria-hidden`.

**Styling:** Existing tokens only: `eyebrow` variant, `body2`, the Selector code-well style (`codeBlockSx`), outline `TonePill`. Layout responds to the card via `@container (min-width: 44rem)`.

**Performance:** Static data in the lazily loaded Audit Results chunk (about 10 KB gzipped). `getFixGuidance` is memoized per violation.

**Changelog**
- 2026-11-01: Created.
