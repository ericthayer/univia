/**
 * Curated public references for the Professional Resources page.
 * Every URL was checked live on 2026-11-01; re-verify when editing.
 */

export interface ReferenceLink {
  id: string;
  title: string;
  publisher: string;
  description: string;
  href: string;
  icon: string;
}

export interface ReferenceGroup {
  id: string;
  title: string;
  links: ReadonlyArray<ReferenceLink>;
}

export const REFERENCE_GROUPS: ReadonlyArray<ReferenceGroup> = [
  {
    id: 'law',
    title: 'Law & regulation',
    links: [
      {
        id: 'doj-web-guidance',
        title: 'Guidance on Web Accessibility and the ADA',
        publisher: 'U.S. Department of Justice',
        description: 'How the ADA applies to websites of businesses and state and local governments.',
        href: 'https://www.ada.gov/resources/web-guidance/',
        icon: 'gavel',
      },
      {
        id: 'doj-title-ii-rule',
        title: 'Fact sheet: 2024 web and mobile app rule',
        publisher: 'U.S. Department of Justice',
        description: 'The Title II rule that sets WCAG 2.1 AA as the standard for public entities, with deadlines.',
        href: 'https://www.ada.gov/resources/2024-03-08-web-rule/',
        icon: 'event',
      },
      {
        id: 'section-508',
        title: 'Section508.gov',
        publisher: 'U.S. General Services Administration',
        description: 'Federal ICT accessibility requirements, procurement guidance, and testing methods.',
        href: 'https://www.section508.gov/',
        icon: 'verified_user',
      },
    ],
  },
  {
    id: 'standards',
    title: 'Standards & testing',
    links: [
      {
        id: 'wcag-22',
        title: 'WCAG 2.2',
        publisher: 'W3C',
        description: 'The normative Web Content Accessibility Guidelines most demand letters cite.',
        href: 'https://www.w3.org/TR/WCAG22/',
        icon: 'accessibility_new',
      },
      {
        id: 'wcag-quickref',
        title: 'How to Meet WCAG (Quick Reference)',
        publisher: 'W3C WAI',
        description: 'Filterable checklist of every success criterion with techniques and failures.',
        href: 'https://www.w3.org/WAI/WCAG22/quickref/',
        icon: 'playlist_add_check',
      },
      {
        id: 'wai-evaluate',
        title: 'Evaluating Web Accessibility',
        publisher: 'W3C WAI',
        description: 'How to scope an evaluation, choose tools, and when to bring in an expert.',
        href: 'https://www.w3.org/WAI/test-evaluate/',
        icon: 'fact_check',
      },
    ],
  },
  {
    id: 'help',
    title: 'Free & low-cost help',
    links: [
      {
        id: 'ada-national-network',
        title: 'ADA National Network',
        publisher: 'Regional ADA Centers',
        description: 'Free, confidential ADA guidance by phone or email: 1‑800‑949‑4232.',
        href: 'https://adata.org/',
        icon: 'people',
      },
      {
        id: 'lsc-legal-help',
        title: 'Find legal aid',
        publisher: 'Legal Services Corporation',
        description: 'Locate free civil legal aid for qualifying individuals and small organizations.',
        href: 'https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help',
        icon: 'balance',
      },
      {
        id: 'iaap-certification',
        title: 'IAAP certified professionals',
        publisher: 'International Association of Accessibility Professionals',
        description: 'What CPACC, WAS, and CPWA credentials mean when you hire an auditor or developer.',
        href: 'https://www.accessibilityassociation.org/s/certification',
        icon: 'task_alt',
      },
    ],
  },
];

export interface SituationPath {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** Who to bring in after the self-serve step. */
  professional: string;
  action: { label: string; to: string };
}

export const SITUATION_PATHS: ReadonlyArray<SituationPath> = [
  {
    id: 'demand-letter',
    icon: 'gavel',
    title: 'I received a demand letter',
    description: 'Understand the claims and deadlines first, then take the analysis to counsel.',
    professional: 'ADA defense attorney',
    action: { label: 'Analyze Letter', to: '/letters' },
  },
  {
    id: 'fix-issues',
    icon: 'tools',
    title: 'I need to fix my site',
    description: 'Find the violations and prioritize them before you scope remediation work.',
    professional: 'Accessibility developer',
    action: { label: 'Run Site Audit', to: '/audit' },
  },
  {
    id: 'prove-conformance',
    icon: 'fact_check',
    title: 'I need proof of conformance',
    description: 'Track criteria yourself, then have an independent audit confirm the result.',
    professional: 'Independent auditor',
    action: { label: 'Open Checklist', to: '/checklist' },
  },
];
