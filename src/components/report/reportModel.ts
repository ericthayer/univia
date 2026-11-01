/**
 * Report document model shared by every exported report. Builders produce a
 * `ReportDocument`; `renderReport` turns it into print-ready DOM. Keeping the
 * model framework-free lets both run outside React (and in unit tests).
 */

export type ReportTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

/** One run of inline text. Links are restricted to http(s) by `inlineMarkdown`. */
export type InlineSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'code'; text: string };

/** Plain string, or pre-parsed segments when the text carries links or code. */
export type RichText = string | InlineSegment[];

export interface ReportLink {
  label: string;
  url: string;
}

export interface ReportPill {
  text: string;
  tone?: ReportTone;
  variant?: 'tonal' | 'outline' | 'solid';
  /** Free-form text (AI output): sentence case, wraps. Status labels stay uppercase. */
  freeText?: boolean;
}

export interface ReportFact {
  label: string;
  value: RichText;
  tone?: ReportTone;
  /** Small trailing qualifier, e.g. "High confidence". */
  note?: string;
  /** Span the full row of the facts grid. */
  wide?: boolean;
}

export interface ReportTableCell {
  text: string;
  tone?: ReportTone;
  /** 0 to 100. Draws a thin meter under the value. */
  meter?: number;
}

export interface ReportTableRow {
  header: string;
  cells: ReportTableCell[];
}

/**
 * Fix guidance for one issue. Mirrors the `FixGuidance` shape from the
 * fix-guidance work so richer content only needs an adapter change.
 */
export interface ReportHowToFix {
  summary?: string;
  whyItMatters?: string;
  whoIsAffected?: string[];
  steps: RichText[];
  example?: { language?: string; before?: string; after: string; note?: string };
  /** Concrete findings from the scan: elements, resources, console messages. */
  instances?: string[];
  standards?: ReportLink[];
  resources?: ReportLink[];
}

export interface ReportIssue {
  title: RichText;
  severity: string;
  tone: ReportTone;
  tags: string[];
  description?: RichText;
  selector?: string;
  howToFix: ReportHowToFix;
}

export type ReportBlock =
  | { kind: 'paragraph'; text: RichText; muted?: boolean }
  | { kind: 'facts'; items: ReportFact[] }
  | { kind: 'list'; ordered: boolean; items: RichText[] }
  | { kind: 'pills'; label?: string; items: ReportPill[] }
  | { kind: 'table'; caption: string; columns: string[]; rows: ReportTableRow[] }
  | { kind: 'callout'; title: string; text: string; tone: ReportTone }
  | { kind: 'image'; src: string; alt: string; caption?: string }
  | { kind: 'subheading'; text: string; meta?: string }
  /** `headingLevel` 4 when the list sits under a `subheading` (h3). */
  | { kind: 'issues'; items: ReportIssue[]; headingLevel?: 3 | 4 };

export interface ReportSection {
  id: string;
  title: string;
  meta?: string;
  blocks: ReportBlock[];
  /** Start this section on a new page. */
  pageBreakBefore?: boolean;
}

export interface ReportDocument {
  /** Shown above the title, e.g. "Accessibility Audit Report". */
  eyebrow: string;
  title: string;
  subject?: ReportLink | string;
  meta: Array<{ label: string; value: string }>;
  badges?: ReportPill[];
  sections: ReportSection[];
  footerNote?: string;
  /** Suggested file name without extension. Becomes the print document title. */
  fileName: string;
}
