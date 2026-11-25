import type { KnownLimitation } from './knownLimitations';

export type StatementStandard = '2.2' | '2.1';
export type ResponseDays = 2 | 5 | 10;

export interface StatementInput {
  organization: string;
  siteName: string;
  origin: string;
  standard: StatementStandard;
  pagesChecked: number;
  measures: string;
  contactEmail: string;
  contactPhone: string;
  responseDays: ResponseDays;
  /** ISO timestamp of the latest completed scan, or null if none completed. */
  lastScanAt: string | null;
  includeLimitations: boolean;
  limitations: KnownLimitation[];
  /** ISO date (YYYY-MM-DD) the owner reviewed the statement. */
  reviewedOn: string;
}

export type StatementBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'contact'; email: string; phone: string };

export interface StatementSection {
  heading: string;
  blocks: StatementBlock[];
}

export interface Statement {
  title: string;
  sections: StatementSection[];
}

export const LIMITATION_CAP = 10;

/** Long, locale-neutral date for public text, e.g. "November 25, 2026". */
export function formatStatementDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

function limitationsSection(input: StatementInput): StatementSection | null {
  if (!input.includeLimitations || !input.lastScanAt) return null;
  const when = formatStatementDate(input.lastScanAt);
  if (!input.limitations.length) {
    return {
      heading: 'Known limitations',
      blocks: [
        {
          kind: 'paragraph',
          text: `Our most recent automated check, on ${when}, found no issues on the pages it covers. Automated checks cannot find every problem, so please tell us about anything that gets in your way.`,
        },
      ],
    };
  }
  const shown = input.limitations.slice(0, LIMITATION_CAP);
  const items = shown.map((item) => `${item.title.replace(/\.$/, '')} (${plural(item.pages, 'page', 'pages')})`);
  const rest = input.limitations.length - shown.length;
  if (rest > 0) items.push(`${plural(rest, 'other issue', 'other issues')}`);
  return {
    heading: 'Known limitations',
    blocks: [
      { kind: 'paragraph', text: `Our most recent automated check, on ${when}, found these issues. We are working on them:` },
      { kind: 'list', items },
    ],
  };
}

/**
 * Drafts the statement from the owner's answers and Monitor data. Worded as
 * aims and facts about checking, never as a compliance or conformance claim.
 */
export function buildStatement(input: StatementInput): Statement {
  const organization = input.organization.trim();
  const measures = input.measures.trim();
  const sections: StatementSection[] = [
    {
      heading: 'Our commitment',
      blocks: [
        {
          kind: 'paragraph',
          text: `${organization} wants ${input.origin} to be usable by everyone, including people who use assistive technology. We aim to meet the Web Content Accessibility Guidelines (WCAG) ${input.standard} at Level AA.`,
        },
      ],
    },
    {
      heading: 'How we check',
      blocks: [
        {
          kind: 'paragraph',
          text: `We run automated accessibility checks on ${plural(input.pagesChecked, 'page', 'pages')} of this site every week and fix the issues they find. Automated checks find some accessibility problems, not all of them, so we also welcome reports from people who use the site.`,
        },
        ...(measures ? [{ kind: 'paragraph' as const, text: measures }] : []),
      ],
    },
  ];

  const limitations = limitationsSection(input);
  if (limitations) sections.push(limitations);

  sections.push(
    {
      heading: 'Feedback and contact',
      blocks: [
        { kind: 'paragraph', text: 'If you have trouble using any part of this site, contact us and we will help:' },
        { kind: 'contact', email: input.contactEmail.trim(), phone: input.contactPhone.trim() },
        { kind: 'paragraph', text: `We aim to reply within ${input.responseDays} business days.` },
      ],
    },
    {
      heading: 'About this statement',
      blocks: [{ kind: 'paragraph', text: `This statement was last reviewed on ${formatStatementDate(input.reviewedOn)}.` }],
    },
  );

  return { title: `Accessibility statement for ${input.siteName.trim()}`, sections };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ESCAPES[char]);

function blockToHtml(block: StatementBlock): string {
  if (block.kind === 'paragraph') return `<p>${escapeHtml(block.text)}</p>`;
  if (block.kind === 'list') return `<ul>\n${block.items.map((item) => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ul>`;
  const email = escapeHtml(block.email);
  const lines = [`  <li>Email: <a href="mailto:${email}">${email}</a></li>`];
  if (block.phone) {
    const phone = escapeHtml(block.phone);
    lines.push(`  <li>Phone: <a href="tel:${escapeHtml(block.phone.replace(/[^\d+]/g, ''))}">${phone}</a></li>`);
  }
  return `<ul>\n${lines.join('\n')}\n</ul>`;
}

/** The statement as an HTML fragment to paste into a page body. */
export function statementToHtmlFragment(statement: Statement): string {
  const body = statement.sections
    .map((section) => [`<h2>${escapeHtml(section.heading)}</h2>`, ...section.blocks.map(blockToHtml)].join('\n'))
    .join('\n\n');
  return `<h1>${escapeHtml(statement.title)}</h1>\n\n${body}\n`;
}

/** A complete, standalone HTML document for download. */
export function statementToHtmlDocument(statement: Statement): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(statement.title)}</title>
</head>
<body>
<main>
${statementToHtmlFragment(statement)}</main>
</body>
</html>
`;
}

/** Plain text for email or a CMS without HTML. */
export function statementToText(statement: Statement): string {
  const blockText = (block: StatementBlock): string => {
    if (block.kind === 'paragraph') return block.text;
    if (block.kind === 'list') return block.items.map((item) => `- ${item}`).join('\n');
    return [`- Email: ${block.email}`, ...(block.phone ? [`- Phone: ${block.phone}`] : [])].join('\n');
  };
  const sections = statement.sections.map((section) => [section.heading, ...section.blocks.map(blockText)].join('\n\n'));
  return `${statement.title}\n\n${sections.join('\n\n')}\n`;
}
