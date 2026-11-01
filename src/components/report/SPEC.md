# SPEC: PDF report export (Site Audit + Analyze Letter)

## Intent

Both result screens have an export button that did nothing (`AuditResults` "Export PDF Report", `InlineAnalysisResults` "Export PDF"). People need a document they can save, attach to an email, or hand to a developer or attorney. One shared generator produces both reports so they share layout, typography and branding.

## Decision: the browser print engine, not a JS PDF library

| Option | Output | Bundle | Verdict |
|---|---|---|---|
| jsPDF / pdf-lib / @react-pdf | Direct `.pdf` download | +110 to 500 KB gz | Rejected. Untagged PDFs (no reading order, no headings for screen readers). An accessibility product cannot ship an inaccessible report. Variable DM Sans font is not supported, so the brand typeface is lost. |
| Server-side headless Chrome | Direct download, tagged | 0 KB client | Rejected for now. Supabase Edge Functions cannot run Chromium; a Netlify function with Chromium adds cold starts and ops cost. Revisit if emailed/scheduled reports are needed. |
| **Print document in a hidden iframe** | Browser "Save as PDF" (tagged by Chromium, selectable text, live links, DM Sans) | ~8 KB gz, lazy-loaded on click | **Chosen.** |

Trade-off accepted: the user confirms the save in the print dialog ("Save as PDF" is the default destination in Chrome/Edge when no printer is chosen; Safari has "PDF" in the dialog). The suggested file name comes from the document title.

## Usage

```tsx
const { exportReport, status, message } = useReportExport();
<Button onClick={() => exportReport(() => buildAuditReport({ audits, violations }))} disabled={status === 'preparing'}>
  Export PDF Report
</Button>
```

## Architecture

```
src/components/report/
├── reportModel.ts        types: ReportDocument, ReportSection, ReportBlock (discriminated union), ReportIssue, ReportHowToFix
├── inlineMarkdown.ts     "[text](url)" and `code` in AI/Lighthouse text → safe segments (http/https links only)
├── reportStyles.ts       print stylesheet built from theme tokens (light palette, surfaceTokens radii)
├── renderReport.ts       pure DOM renderer: (Document, ReportDocument) → body. createElement + textContent only, never innerHTML
├── printReport.ts        hidden iframe lifecycle: build, await fonts/images, print(), clean up
├── buildAuditReport.ts   audits + violations (both devices) → ReportDocument; `toReportHowToFix` adapter
├── buildLetterReport.ts  DocumentAnalysis → ReportDocument
└── useReportExport.ts    React hook: lazy-imports printReport, exposes status + live-region message
```

Data flow: page state (already loaded) → builder (pure, unit-tested) → renderer (DOM, unit-tested in jsdom) → print. No network calls, no new Supabase queries.

### Audit report content

1. Header: Univia logo, eyebrow "Accessibility Audit Report", scanned URL (link), audit date, generated date, devices.
2. Summary: score table (Performance / Accessibility / Best Practices / SEO × Mobile / Desktop), each score colored by value (SPEC ui-refresh §3.3) with a bar; issues-by-severity table.
3. Issues: grouped by severity (critical → minor). An issue found on both devices is listed once with both device tags (deduped by `wcag_guideline + title`). Each issue: title, severity pill, WCAG rule, level, description (links preserved), selector, **How to fix**.
4. Closing note: automated checks do not find every barrier; pair with manual testing.

### How-to-fix extensibility

`ReportHowToFix` mirrors the `FixGuidance` shape being built in the fix-guidance work (`src/config/fixGuides`): `summary`, `whyItMatters`, `whoIsAffected`, `steps`, `example { before, after, language, note }`, `instances`, `resources`, `standards`. The renderer already draws every field when present. Today `toReportHowToFix` maps `remediation_steps` only; when `getFixGuidance` lands, the adapter is the single function to change.

### Letter report content

Legal disclaimer (top, always), document type + urgency pills, Summary, Key Information, Extracted Details (with AI confidence), Legal Analysis, Recommended Actions, Additional Resources, All Extracted Entities, Analysis Details. Builder takes `DocumentAnalysis`, so a saved letter can reuse it once the full analysis is persisted.

## Accessibility

- Report document: `lang="en"`, `<title>`, one `h1`, `h2` per section, `h3` per issue; `table` with `caption` and `th scope`; `dl` for facts; `ol`/`ul` for steps. Chromium emits a tagged PDF from this structure.
- Contrast: light palette `toneText` shades for colored text (≥ 4.5:1 on white); tone never carries meaning alone (pills carry the word).
- Trigger: the button is disabled while preparing; a polite live region announces "Preparing PDF report…", and errors are shown in an `Alert` and announced.
- Iframe is `aria-hidden` and `tabindex=-1` so it never takes focus.

## Performance

- Report modules are dynamically imported on click; zero cost on page load.
- Rendering is a single DOM build into a detached iframe; images use the existing screenshot URLs; print waits for `document.fonts.ready` and image loads (capped at 4s).

## Implementation checklist

- [x] Shared model, renderer, styles, print lifecycle
- [x] Audit builder with dedupe + how-to-fix adapter
- [x] Letter builder
- [x] `useReportExport` hook with status + live region
- [x] Wire both buttons; no visual change to the buttons
- [x] Unit tests: builders, inline markdown, renderer (no innerHTML; links limited to http/https)

## Known limits

- iOS Safari prints the parent page when asked to print an iframe on some versions. Desktop browsers are the target; verify on iPad before advertising mobile export.
- Page numbers use CSS `@page` margin boxes (Chrome/Edge 131+); other browsers omit them.
- DM Sans ships as a variable TTF, which Chromium embeds as Type 3 glyphs. Text stays selectable and searchable (ToUnicode present); a static DM Sans instance would embed as TrueType if a viewer renders Type 3 poorly.
- Saved-letter export (from a "Your Demand Letters" card) needs the full analysis persisted; `buildLetterReport` takes `DocumentAnalysis`, so it plugs in once that column exists.

## Changelog

- 2026-11-01: Initial spec.
- 2026-11-01: QA pass in Chromium. Issue titles parse inline code; free-text pills (violations cited, entities) keep sentence case; label + pills and fix headings avoid page breaks.
