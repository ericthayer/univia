# Professional Resources page

**Intent:** `/resources` was an empty page: the `professional_resources` table has no rows, so every visitor saw "No resources found matching your criteria", and the page was only reachable from the signed-out home screen. The page now earns its place without directory data, and stays correct once vetted listings are added.

**Sections (top to bottom)**

1. **Where to start**: three `SituationCard`s mapping a situation to the Univia tool that handles it and the professional to bring in next (demand letter → Analyze Letter + attorney; fix issues → Site Audit + developer; prove conformance → Checklist + independent auditor).
2. **Trusted references**: curated public sources (`config/resourceLinks.ts`) grouped into Law & regulation, Standards & testing, Free & low-cost help. Rendered as `ReferenceLinkCard`s; every URL was checked live on 2026-11-01.
3. **Professional directory**: the existing Supabase-backed list (`useProfessionalResources`). Search and filters render only when listings exist. Two empty states are distinct: no listings yet ("directory in review") vs. no matches ("clear filters").
4. **Non-endorsement note**: listings and links are not endorsements; Univia is not a law firm.

**Global access:** `Footer` shows a "Professional Resources" link for registered (signed-in, non-anonymous) users, because the home-screen quick action disappears once signed in.

**Architecture**

- `hooks/useProfessionalResources.ts`: fetch once, derive filtered/pro-bono/paid lists with `useMemo` (replaces the effect-driven `filteredResources` state).
- `components/resources/ResourceCard`: extracted from the page. Contact is a `mailto:` link and Website an external link; each renders only when the listing has that field (they were dead buttons).
- `components/resources/ReferenceLinkCard`, `SituationCard`: presentational, data from config.
- Surfaces: `BezelCard`, `SectionHeader`, `TonePill`, `EmptyState` from the UI refresh (docs/specs/ui-refresh/SPEC.md). Interactive controls on this page use a 16px radius; cards and chips keep their radius.

**Accessibility**

- Each section is a `<section>` labelled by its `SectionHeader` heading (h2); cards use h3.
- External links open in a new tab, carry `rel="noopener noreferrer"`, and announce "(opens in a new tab)" via visually hidden text.
- Contact/Website names include the listing name for screen readers.
- Loading uses `aria-busy`; result count is announced with `aria-live="polite"`.

**Non-goals:** seeding directory rows (real listings need vetting; no placeholder people), the "More Filters" control (removed: it did nothing).

**Changelog**
- 2026-11-01: Created. Situation paths, trusted references (three per group), directory empty states, footer link.
