export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  path?: string;
}

export interface FeaturedArticle {
  id: string;
  title: string;
  path?: string;
}

export interface HelpTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  keyboardShortcut?: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Everything you need to know to get started with accessibility compliance testing.',
    icon: 'rocket_launch',
  },
  {
    id: 'running-audits',
    title: 'Running audits',
    description: 'Learn how to run comprehensive accessibility audits and understand the results.',
    icon: 'search',
  },
  {
    id: 'compliance',
    title: 'Understanding compliance',
    description: 'Learn about ADA, WCAG, and other accessibility standards and requirements.',
    icon: 'task_alt',
  },
  {
    id: 'demand-letters',
    title: 'Demand letters',
    description: 'Analyze and respond to accessibility demand letters with confidence.',
    icon: 'gavel',
  },
  {
    id: 'remediation',
    title: 'Fixing issues',
    description: 'Step-by-step guides to remediate common accessibility violations.',
    icon: 'tools',
  },
  {
    id: 'resources',
    title: 'Tools & resources',
    description: 'Access templates, guides, and resources to support your accessibility journey.',
    icon: 'folder_open',
  },
];

export const FEATURED_ARTICLES: FeaturedArticle[] = [
  {
    id: 'wcag-guidelines',
    title: 'Understanding WCAG 2.1 guidelines',
  },
  {
    id: 'common-violations',
    title: 'Most common accessibility violations',
  },
  {
    id: 'keyboard-navigation',
    title: 'How to test keyboard navigation',
  },
  {
    id: 'screen-readers',
    title: 'Testing with screen readers',
  },
  {
    id: 'color-contrast',
    title: 'Meeting color contrast requirements',
  },
  {
    id: 'alt-text',
    title: 'Writing effective alt text',
  },
];

export const HELP_TIPS: HelpTip[] = [
  {
    id: 'quick-audit',
    title: 'Quick Audit',
    description: 'Run a quick accessibility scan by entering any URL in the audit page.',
    icon: 'flash_on',
  },
  {
    id: 'export-reports',
    title: 'Export Reports',
    description: 'Download detailed PDF reports of your audits to share with your team.',
    icon: 'download',
  },
  {
    id: 'track-progress',
    title: 'Track Progress',
    description: 'Monitor your compliance score over time in the Performance Metrics dashboard.',
    icon: 'trending_up',
  },
];

export const COMMON_TOPICS = [
  'WCAG compliance',
  'demand letters',
  'accessibility testing',
  'color contrast',
  'keyboard navigation',
  'screen readers',
];
