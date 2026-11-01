import type { Violation } from '../../types';
import { diagnoseConsoleMessage } from '../../utils/consoleDiagnosis';
import { parseInstance, parseLighthouseDescription } from '../../utils/lighthouseText';
import { accessibilityGuides } from './accessibility';
import { bestPracticeGuides } from './bestPractices';
import { performanceGuides } from './performance';
import { seoGuides } from './seo';
import type { AuditCategory, FixEffort, FixGuidance, FixGuide, FixOwner, ResourceLink } from './types';
import { wcagRefs } from './wcag';

export type * from './types';

/** Accessibility first: `image-alt` and `document-title` also appear under SEO. */
const BY_CATEGORY: ReadonlyArray<[AuditCategory, Record<string, FixGuide>]> = [
  ['accessibility', accessibilityGuides],
  ['best-practices', bestPracticeGuides],
  ['seo', seoGuides],
  ['performance', performanceGuides],
];

export const CATEGORY_LABEL: Record<AuditCategory, string> = {
  accessibility: 'Accessibility',
  'best-practices': 'Best practices',
  seo: 'SEO',
  performance: 'Performance',
};

const OWNER_LABEL: Record<FixOwner, string> = {
  content: 'Content editor',
  developer: 'Web developer',
  designer: 'Designer',
  hosting: 'Hosting or IT',
};

const EFFORT_LABEL: Record<FixEffort, string> = {
  quick: 'Quick fix',
  moderate: 'A few hours',
  involved: 'Larger project',
};

const FALLBACK_STEPS: Record<AuditCategory, string[]> = {
  accessibility: [
    'Review the elements under "Where we found it"; each is a place this rule failed.',
    'Read the linked guidance below, then fix one instance and re-run the audit to confirm the approach before fixing the rest.',
    'Test the fixed area with only a keyboard (Tab, Shift+Tab, Enter, Space) and, if possible, a screen reader.',
  ],
  'best-practices': [
    'Review the items under "Where we found it".',
    'Share this issue with your web developer along with the linked guidance; most best-practice fixes are code or server settings.',
    'Re-run the audit to confirm.',
  ],
  seo: [
    'Review the items under "Where we found it".',
    'Most SEO fixes are made in your CMS page settings or SEO plugin. Use the linked guidance to find the right setting.',
    'Re-run the audit, then request re-indexing in Google Search Console.',
  ],
  performance: [
    'Review the files under "Where we found it"; the largest ones usually matter most.',
    'Share this issue with your web developer along with the linked guidance.',
    'Re-run the audit on mobile, where speed problems are most visible.',
  ],
};

function categoryFor(ruleId: string): AuditCategory {
  for (const [category, guides] of BY_CATEGORY) if (ruleId in guides) return category;
  return ruleId.startsWith('aria-') ? 'accessibility' : 'best-practices';
}

function lookupGuide(ruleId: string): FixGuide | undefined {
  for (const [, guides] of BY_CATEGORY) {
    if (Object.prototype.hasOwnProperty.call(guides, ruleId)) return guides[ruleId];
  }
  return undefined;
}

function dedupeLinks(links: ResourceLink[]): ResourceLink[] {
  const seen = new Set<string>();
  return links.filter((link) => (seen.has(link.url) ? false : (seen.add(link.url), true)));
}

export type FixGuidanceInput = Pick<Violation, 'wcag_guideline' | 'title' | 'description' | 'remediation_steps'>;

/**
 * Resolve plain-language guidance for one stored violation. Pure; shared by
 * the Issues list (`ViolationCard`) and the PDF report.
 *
 * `wcag_guideline` holds the Lighthouse audit id (e.g. `color-contrast`), not a
 * WCAG criterion; the real criteria come from the curated guide.
 */
export function getFixGuidance(violation: FixGuidanceInput): FixGuidance {
  const ruleId = violation.wcag_guideline;
  const category = categoryFor(ruleId);
  const guide = lookupGuide(ruleId);
  const lighthouse = parseLighthouseDescription(violation.description);
  const standards = wcagRefs(guide?.wcag);

  const instances = (violation.remediation_steps ?? []).map(parseInstance).map((instance) =>
    ruleId === 'errors-in-console' && instance.kind === 'message'
      ? { ...instance, diagnosis: diagnoseConsoleMessage(instance.text) }
      : instance,
  );

  const resources = dedupeLinks([
    ...lighthouse.links.map((link) => ({ url: link.url, label: `Lighthouse guide: ${violation.title}` })),
    ...standards.map((s) => ({ label: `Understanding WCAG ${s.id} ${s.name}`, url: s.url })),
    ...(ruleId === 'color-contrast' ? [{ label: 'WebAIM Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/' }] : []),
  ]);

  return {
    ruleId,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    curated: Boolean(guide),
    summary: guide?.summary ?? (lighthouse.text || violation.title),
    whyItMatters: guide?.whyItMatters,
    whoIsAffected: guide?.whoIsAffected ?? [],
    fixedBy: guide ? OWNER_LABEL[guide.owner] : undefined,
    effort: guide ? EFFORT_LABEL[guide.effort] : undefined,
    steps: guide?.steps ?? FALLBACK_STEPS[category],
    example: guide?.example,
    standards,
    instances,
    resources,
  };
}
