# SPEC: Accessibility statement generator

**Status:** Built (slice D of the remaining Monitor plan)
**Route:** `/monitor/statement?site=<id>` (lazy, behind `RegisteredRoute` and server-side Monitor access)

## Intent

Monitor customers need a public accessibility statement. Writing one from scratch is the step most small businesses skip. This drafts one from the site's own Monitor data, for the owner to review and publish on their own site.

Product rules: no compliance, conformance or legal claims. The statement says what the owner aims for, how they check, what is known to be wrong, and how to reach them. Univia never hosts the statement: a page on univia.help describing a customer's accessibility would make us the publisher of their claim.

## Usage

```tsx
<StatementGenerator site={site} detail={detail} />
```

The page loads the site with `useMonitorSite`, the same hook as `/monitor`. Monitor gets one link card into this page.

## Statement content

Structure follows the W3C statement outline, minus a conformance status (we do not determine conformance).

1. Title: "Accessibility statement for {site name}"
2. Our commitment: organization, site address, target (WCAG 2.2 or 2.1, Level AA), worded as an aim.
3. How we check: weekly automated checks of N pages, that automated checks find some problems but not all, plus the owner's own optional measures.
4. Known limitations (optional, on by default): issues from the latest data that are not resolved, grouped by rule, with page counts. Top 10, then "and N more". Omitted when no scan has completed. When none are open, says so without implying the site is accessible.
5. Feedback and contact: email (required), phone (optional), reply time (2, 5 or 10 business days).
6. About this statement: review date (today).

## Architecture

- `buildStatement.ts`: pure. `StatementInput` → `StatementSection[]`, then `statementToHtml` (escaped, full HTML document) and `statementToText`. One source for preview, copy and download.
- `knownLimitations.ts`: pure. Groups `MonitorIssue[]` by `rule_id`, counts distinct pages, excludes `resolved`.
- `StatementForm.tsx`: controlled fields, inline validation, first invalid field focused.
- `StatementPreview.tsx`: renders sections as semantic HTML.
- `StatementActions.tsx`: Copy HTML, Copy text, Download .html. Validates first. Status in `aria-live="polite"`. Clipboard failure explained.
- `StatementGenerator.tsx`: composes the three, holds form state.
- No database writes, no new tables, no Edge Function.

## Accessibility

- Every field has a visible label; email uses `type="email"` and `autoComplete="email"`, phone `type="tel"`.
- Errors inline under the field, with `aria-invalid`; the first invalid field is focused on an action.
- Preview is a `<article>` with its own heading levels starting at h2 under the page h1.
- Action results announced politely.

## Performance

New lazy route; nothing added to the main chunk. Builder is O(issues).

## Checklist

- [x] Builder + limitation grouping with unit tests (escaping, optional fields, no-scan and no-issue cases)
- [x] Form validation and focus test
- [x] Copy and download
- [x] Link from Monitor
- [x] No "compliant"/"conformance" wording in output (test)

## Changelog

- 2026-11-25: Created.
