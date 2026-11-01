import type { DocumentAnalysis } from '../documents/DocumentUploadDialog';
import { confidenceLabel, urgencyTone } from '../documents/urgency';
import { parseInlineMarkdown } from './inlineMarkdown';
import type { ReportBlock, ReportDocument, ReportFact, ReportSection } from './reportModel';

/** Same copy as `LegalDisclaimer` (compact). Kept in sync by hand; the component is locked. */
export const LETTER_DISCLAIMER =
  'Univia is not a law firm and does not provide legal advice. This analysis is for informational purposes only and may contain errors. Results are AI-generated and should not be relied upon without consulting a licensed attorney.';

export interface LetterReportOptions {
  /** Original upload name, when known. */
  fileName?: string;
  now?: Date;
}

function confidenceNote(score: number | undefined): string | undefined {
  const label = confidenceLabel(score);
  return label ? `${label} confidence` : undefined;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

export function buildLetterReport(analysis: DocumentAnalysis, options: LetterReportOptions = {}): ReportDocument {
  const now = options.now ?? new Date();
  const result = analysis.analysis;
  const data = result.extractedData ?? {};
  const scores = result.confidenceScores ?? {};
  const sections: ReportSection[] = [];

  sections.push({
    id: 'summary',
    title: 'Summary',
    blocks: [
      { kind: 'callout', title: 'Legal disclaimer', text: LETTER_DISCLAIMER, tone: 'warning' },
      { kind: 'paragraph', text: parseInlineMarkdown(result.documentSummary) },
    ],
  });

  if (result.keyPoints?.length) {
    sections.push({ id: 'key', title: 'Key Information', blocks: [{ kind: 'list', ordered: false, items: result.keyPoints.map(parseInlineMarkdown) }] });
  }

  const facts: ReportFact[] = [];
  const add = (label: string, value: string | undefined, extra: Partial<ReportFact> = {}) => {
    if (value) facts.push({ label, value, ...extra });
  };
  add('Plaintiff', data.plaintiffName, { note: confidenceNote(scores.plaintiffName) });
  add('Attorney', data.attorneyName, { note: confidenceNote(scores.attorneyName) });
  add('Law Firm', data.attorneyFirm, { note: confidenceNote(scores.attorneyFirm) });
  add('Case Number', data.caseNumber);
  add('Court', data.courtName);
  add('Filing Date', data.filingDate);
  add('Response Deadline', data.responseDeadline, { tone: 'error', note: confidenceNote(scores.responseDeadline) });
  add('Settlement Amount', data.settlementAmount ? `$${data.settlementAmount.toLocaleString()}` : undefined, {
    note: confidenceNote(scores.settlementAmount),
  });
  const detailBlocks: ReportBlock[] = [];
  if (facts.length) detailBlocks.push({ kind: 'facts', items: facts });
  if (data.violationsCited?.length) {
    detailBlocks.push({ kind: 'pills', label: 'Violations cited', items: data.violationsCited.map((text) => ({ text, tone: 'error', freeText: true })) });
  }
  if (detailBlocks.length) sections.push({ id: 'details', title: 'Extracted Details', blocks: detailBlocks });

  const legal = result.legalAnalysis;
  if (legal) {
    const legalFacts: ReportFact[] = [{ label: 'Claim Type', value: legal.claimType }];
    if (legal.jurisdiction) legalFacts.push({ label: 'Jurisdiction', value: legal.jurisdiction });
    if (legal.statuteOfLimitations) legalFacts.push({ label: 'Statute of Limitations', value: legal.statuteOfLimitations });
    const blocks: ReportBlock[] = [
      { kind: 'facts', items: legalFacts },
      { kind: 'subheading', text: 'Risk Assessment' },
      { kind: 'paragraph', text: parseInlineMarkdown(legal.riskAssessment) },
    ];
    if (legal.potentialDefenses?.length) {
      blocks.push({ kind: 'subheading', text: 'Potential Defenses to Consider' }, { kind: 'list', ordered: false, items: legal.potentialDefenses.map(parseInlineMarkdown) });
    }
    sections.push({ id: 'legal', title: 'Legal Analysis', blocks });
  }

  if (result.recommendedActions?.length) {
    sections.push({ id: 'actions', title: 'Recommended Actions', blocks: [{ kind: 'list', ordered: true, items: result.recommendedActions.map(parseInlineMarkdown) }] });
  }

  if (result.additionalResources?.length) {
    sections.push({ id: 'resources', title: 'Additional Resources', blocks: [{ kind: 'list', ordered: false, items: result.additionalResources.map(parseInlineMarkdown) }] });
  }

  const entities = result.extractedEntities;
  if (entities) {
    const groups: Array<[string, string[] | undefined]> = [
      ['Persons', entities.persons],
      ['Organizations', entities.organizations],
      ['Dates', entities.dates],
      ['Amounts', entities.amounts?.map((amount) => `$${amount}`)],
      ['Legal Citations', entities.legalCitations],
    ];
    const blocks: ReportBlock[] = groups
      .filter((group): group is [string, string[]] => Boolean(group[1]?.length))
      .map(([label, items]) => ({ kind: 'pills', label: `${label} (${items.length})`, items: items.map((text) => ({ text, variant: 'outline', freeText: true })) }));
    if (blocks.length) sections.push({ id: 'entities', title: 'All Extracted Entities', blocks });
  }

  const debug = analysis.debug;
  const meta: ReportDocument['meta'] = [{ label: 'Document type', value: result.documentType }];
  if (data.responseDeadline) meta.push({ label: 'Response deadline', value: data.responseDeadline });
  if (debug?.aiModel) meta.push({ label: 'Model', value: debug.aiModel });
  if (debug?.timestamp) meta.push({ label: 'Analyzed', value: formatTimestamp(debug.timestamp) });

  return {
    eyebrow: 'Demand Letter Analysis',
    title: options.fileName ?? result.documentType ?? 'Demand letter',
    subject: options.fileName ? result.documentType : undefined,
    badges: [
      { text: result.documentType, variant: 'solid' },
      { text: `${result.urgencyLevel} urgency`, tone: urgencyTone(result.urgencyLevel) },
    ],
    meta,
    sections,
    footerNote: `${LETTER_DISCLAIMER} Share this report only with people you trust; it may contain names, amounts and case details from the letter.`,
    fileName: `univia-letter-analysis-${slug(options.fileName ?? result.documentType ?? 'letter') || 'letter'}-${now.toISOString().slice(0, 10)}`,
  };
}
