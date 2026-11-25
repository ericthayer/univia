import type { RecordContents, RecordEvent, RecordIssue } from '../../services/remediationRecord.service';
import type { IssueEventKind, IssueSeverity, ScanTrigger } from '../../services/monitor.service';
import type { ReportBlock, ReportDocument, ReportTableRow, ReportTone } from './reportModel';

/** Working title until the attorney review (SPEC Decision 6). */
export const RECORD_NAME = 'Accessibility Remediation Record';

export const RECORD_DISCLAIMER =
  'This record lists what Univia’s automated scans found and what the site owner reported doing about it. It is not a legal opinion, a conformance audit, or a determination that the site complies with any law or standard.';

export const SCAN_LIMITS: readonly string[] = [
  'Automated checks find only part of the barriers people meet. Many WCAG success criteria need a person to judge them.',
  'Keyboard use, focus order, and how a screen reader announces content were not tested by these scans.',
  'Only the pages listed in Monitor were scanned, one mobile view each. Pages behind a sign-in, forms after submission, and content that loads after interaction may not have been reached.',
  'Videos, audio, PDFs and other documents linked from the pages were not checked.',
  '“Marked fixed” is the owner’s own report. “Fix confirmed” means a later scan no longer found the issue on that page.',
];

const TRIGGER: Record<ScanTrigger, string> = {
  initial: 'First scan',
  scheduled: 'Weekly',
  manual: 'On request',
  recheck: 'Page re-check',
};
const SEVERITY_LABEL: Record<IssueSeverity, string> = { critical: 'Critical', serious: 'Serious', moderate: 'Moderate', minor: 'Minor' };
const SEVERITY_TONE: Record<IssueSeverity, ReportTone> = { critical: 'error', serious: 'error', moderate: 'warning', minor: 'info' };
const SEVERITY_ORDER: Record<IssueSeverity, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

/** Where an issue stood after a given event. */
type EndState = 'open' | 'marked_fixed' | 'resolved';
const STATE_AFTER: Record<IssueEventKind, EndState> = {
  detected: 'open',
  reopened: 'open',
  fix_not_confirmed: 'open',
  unmarked_fixed: 'open',
  marked_fixed: 'marked_fixed',
  resolved: 'resolved',
  fix_confirmed: 'resolved',
};

export interface RecordOptions {
  verifyUrl: string;
  locale?: string;
  timeZone?: string;
}

function path(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || '/';
  } catch {
    return url;
  }
}

/** Per-issue facts for the period, derived from the fingerprinted history. */
export interface IssueSummary {
  issue: RecordIssue;
  endState: EndState;
  firstFound: string | undefined;
  markedFixed: RecordEvent | undefined;
  outcome: RecordEvent | undefined;
  touchedInPeriod: boolean;
}

export function summarizeIssues(contents: RecordContents): IssueSummary[] {
  const start = Date.parse(contents.record.period_start);
  const byIssue = new Map<string, RecordEvent[]>();
  for (const event of contents.events) {
    const list = byIssue.get(event.issue_id);
    if (list) list.push(event);
    else byIssue.set(event.issue_id, [event]);
  }
  return contents.issues
    .map((issue) => {
      const history = byIssue.get(issue.id) ?? [];
      const inPeriod = history.filter((event) => Date.parse(event.created_at) >= start);
      const last = history[history.length - 1];
      const markedFixed = [...inPeriod].reverse().find((event) => event.kind === 'marked_fixed');
      const outcome = [...inPeriod]
        .reverse()
        .find((event) => event.kind === 'fix_confirmed' || event.kind === 'fix_not_confirmed' || event.kind === 'resolved');
      return {
        issue,
        endState: last ? STATE_AFTER[last.kind] : 'open',
        firstFound: history.find((event) => event.kind === 'detected')?.created_at,
        markedFixed,
        outcome,
        touchedInPeriod: inPeriod.length > 0,
      } satisfies IssueSummary;
    })
    .sort((a, b) => SEVERITY_ORDER[a.issue.severity] - SEVERITY_ORDER[b.issue.severity] || a.issue.title.localeCompare(b.issue.title));
}

const OUTCOME_LABEL: Partial<Record<IssueEventKind, { text: string; tone: ReportTone }>> = {
  fix_confirmed: { text: 'Fix confirmed', tone: 'success' },
  fix_not_confirmed: { text: 'Still found', tone: 'warning' },
  resolved: { text: 'No longer found', tone: 'success' },
};

/**
 * Builds the printable record. Every number comes from the runs and events
 * the server fingerprinted, so the printout matches what the verify link checks.
 */
export function buildRemediationRecord(contents: RecordContents, options: RecordOptions): ReportDocument {
  const { record, site } = contents;
  const date = (value: string | undefined): string =>
    value
      ? new Date(value).toLocaleDateString(options.locale ?? 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: options.timeZone })
      : '–';
  const start = Date.parse(record.period_start);
  const inPeriod = (value: string): boolean => Date.parse(value) >= start;

  const runs = contents.runs.filter((run) => inPeriod(run.completed_at));
  const events = contents.events.filter((event) => inPeriod(event.created_at));
  const count = (...kinds: IssueEventKind[]): number => events.filter((event) => kinds.includes(event.kind)).length;
  const issues = summarizeIssues(contents);
  const stillOpen = issues.filter((summary) => summary.endState === 'open');
  const awaiting = issues.filter((summary) => summary.endState === 'marked_fixed');
  const fixes = issues.filter((summary) => summary.touchedInPeriod && (summary.markedFixed || summary.outcome));

  const scanRows: ReportTableRow[] = runs.map((run) => ({
    header: date(run.completed_at),
    cells: [
      { text: TRIGGER[run.trigger] },
      { text: run.status === 'completed' ? 'Completed' : 'Failed', tone: run.status === 'completed' ? 'success' : 'error' },
      { text: String(run.pages_succeeded) },
      { text: String(run.pages_failed), tone: run.pages_failed ? 'warning' : undefined },
      { text: String(run.new_issues) },
      { text: String(run.resolved_issues) },
    ],
  }));

  const fixRows: ReportTableRow[] = fixes.map(({ issue, markedFixed, outcome }) => ({
    header: issue.title,
    cells: [
      { text: path(issue.page_url) },
      { text: SEVERITY_LABEL[issue.severity], tone: SEVERITY_TONE[issue.severity] },
      { text: markedFixed ? date(markedFixed.created_at) : '–' },
      outcome && OUTCOME_LABEL[outcome.kind]
        ? { text: `${OUTCOME_LABEL[outcome.kind]?.text} ${date(outcome.created_at)}`, tone: OUTCOME_LABEL[outcome.kind]?.tone }
        : { text: 'Waiting for a scan' },
      { text: markedFixed?.note ?? '' },
    ],
  }));

  const openRows: ReportTableRow[] = [...stillOpen, ...awaiting].map(({ issue, endState, firstFound }) => ({
    header: issue.title,
    cells: [
      { text: path(issue.page_url) },
      { text: SEVERITY_LABEL[issue.severity], tone: SEVERITY_TONE[issue.severity] },
      { text: date(firstFound) },
      endState === 'marked_fixed' ? { text: 'Marked fixed', tone: 'info' } : { text: 'Open', tone: 'warning' },
    ],
  }));

  const empty = (text: string): ReportBlock => ({ kind: 'paragraph', text, muted: true });

  return {
    eyebrow: RECORD_NAME,
    title: site.name,
    subject: { label: site.origin, url: site.origin },
    meta: [
      { label: 'Period', value: `${date(record.period_start)} to ${date(record.period_end)}` },
      { label: 'Created', value: date(record.created_at) },
      { label: 'Scans', value: String(runs.length) },
      { label: 'Record ID', value: record.id },
    ],
    sections: [
      {
        id: 'summary',
        title: 'Summary',
        meta: 'During the period',
        blocks: [
          {
            kind: 'facts',
            items: [
              { label: 'Scans finished', value: String(runs.length) },
              { label: 'Pages scanned', value: String(runs.reduce((sum, run) => sum + run.pages_succeeded, 0)) },
              { label: 'Issues found or found again', value: String(count('detected', 'reopened')) },
              { label: 'Marked fixed by the owner', value: String(count('marked_fixed')) },
              { label: 'Fixes confirmed by a scan', value: String(count('fix_confirmed')), tone: 'success' },
              { label: 'Open at the end of the period', value: String(stillOpen.length), tone: stillOpen.length ? 'warning' : 'success' },
            ],
          },
        ],
      },
      {
        id: 'scans',
        title: 'Scans',
        meta: `${runs.length}`,
        blocks: runs.length
          ? [{ kind: 'table', caption: 'Scans that finished during the period, oldest first', columns: ['Finished', 'Type', 'Result', 'Pages scanned', 'Pages failed', 'New issues', 'Resolved'], rows: scanRows }]
          : [empty('No scans finished during this period.')],
      },
      {
        id: 'fixes',
        title: 'Fixes',
        meta: `${fixRows.length}`,
        blocks: fixRows.length
          ? [{ kind: 'table', caption: 'Issues marked fixed or no longer found during the period', columns: ['Issue', 'Page', 'Severity', 'Marked fixed', 'Scan result', 'Owner’s note'], rows: fixRows }]
          : [empty('No issues were marked fixed or stopped appearing during this period.')],
      },
      {
        id: 'open',
        title: 'Open at the end of the period',
        meta: `${openRows.length}`,
        blocks: openRows.length
          ? [{ kind: 'table', caption: 'Issues still open or waiting for a scan when the period ended', columns: ['Issue', 'Page', 'Severity', 'First found', 'Status'], rows: openRows }]
          : [empty('The scans found no open issues at the end of this period.')],
      },
      {
        id: 'limits',
        title: 'What automated scans do not cover',
        pageBreakBefore: true,
        blocks: [{ kind: 'list', ordered: false, items: [...SCAN_LIMITS] }],
      },
      {
        id: 'verify',
        title: 'Check this record',
        blocks: [
          {
            kind: 'paragraph',
            text: [
              { kind: 'text', text: 'Univia saved a fingerprint of this site’s scan and fix history up to the end of the period when the record was created. Anyone can confirm that history has not changed since at ' },
              { kind: 'link', text: options.verifyUrl, href: options.verifyUrl },
              { kind: 'text', text: '.' },
            ],
          },
          {
            kind: 'facts',
            items: [
              { label: 'SHA-256 fingerprint', value: [{ kind: 'code', text: record.fingerprint }], wide: true },
              { label: 'History covered', value: `${record.run_count} scans and ${record.event_count} issue events`, wide: true },
            ],
          },
        ],
      },
    ],
    footerNote: RECORD_DISCLAIMER,
    fileName: `univia-remediation-record-${record.period_end.slice(0, 10)}`,
  };
}
