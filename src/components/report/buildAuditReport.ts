import type { AccessibilityAudit, Violation } from '../../types';
import { SEVERITIES, severityTone } from '../ui/violationSeverity';
import { parseInlineMarkdown } from './inlineMarkdown';
import type { ReportBlock, ReportDocument, ReportHowToFix, ReportIssue, ReportSection, ReportTone } from './reportModel';

export type AuditDevice = 'mobile' | 'desktop';

export interface DeviceAuditInput {
  audit: AccessibilityAudit;
  violations: Violation[];
}

export type AuditReportInput = Partial<Record<AuditDevice, DeviceAuditInput>>;

const DEVICES: ReadonlyArray<{ key: AuditDevice; label: string }> = [
  { key: 'mobile', label: 'Mobile' },
  { key: 'desktop', label: 'Desktop' },
];

const SCORES = [
  { key: 'performance_score', label: 'Performance' },
  { key: 'accessibility_score', label: 'Accessibility' },
  { key: 'best_practices_score', label: 'Best Practices' },
  { key: 'seo_score', label: 'SEO' },
] as const;

/** Scores are colored by value, never by category (ui-refresh SPEC §3.3). */
function scoreTone(score: number): ReportTone {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/** Remediation steps arrive as plain strings, JSON strings, or `{ value | url }` objects. */
export function toStepText(step: unknown): string {
  if (typeof step === 'string') {
    try {
      return toStepText(JSON.parse(step) as unknown);
    } catch {
      return step;
    }
  }
  if (typeof step === 'object' && step !== null) {
    const obj = step as Record<string, unknown>;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.url === 'string') return obj.url;
    return JSON.stringify(obj);
  }
  return String(step);
}

/**
 * Single seam for fix guidance. Today Lighthouse remediation output is a list
 * of findings (failing resources, console messages), so it renders as
 * "Found on this page". Route through `getFixGuidance` once it lands.
 */
export function toReportHowToFix(violation: Violation): ReportHowToFix {
  const instances = (violation.remediation_steps ?? []).map(toStepText).filter((text) => text.trim().length > 0);
  return { steps: [], instances };
}

const issueKey = (violation: Violation): string => `${violation.wcag_guideline}::${violation.title}`;

/** Merge both devices' violations; an issue found on both is listed once with both tags. */
export function mergeIssues(input: AuditReportInput): ReportIssue[] {
  const rank = (severity: string): number => {
    const index = SEVERITIES.indexOf(severity as (typeof SEVERITIES)[number]);
    return index === -1 ? SEVERITIES.length : index;
  };

  const merged = new Map<string, { violation: Violation; devices: string[]; instances: Set<string> }>();
  for (const { key, label } of DEVICES) {
    for (const violation of input[key]?.violations ?? []) {
      const id = issueKey(violation);
      const entry = merged.get(id) ?? { violation, devices: [], instances: new Set<string>() };
      // Severity is derived per device, so keep the most severe reading of a shared issue.
      if (rank(violation.severity) < rank(entry.violation.severity)) entry.violation = violation;
      if (!entry.devices.includes(label)) entry.devices.push(label);
      toReportHowToFix(violation).instances?.forEach((text) => entry.instances.add(text));
      merged.set(id, entry);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => rank(a.violation.severity) - rank(b.violation.severity))
    .map(({ violation, devices, instances }) => {
      const tags = [`WCAG ${violation.wcag_guideline}`];
      if (violation.compliance_level) tags.push(`Level ${violation.compliance_level}`);
      tags.push(...devices);
      return {
        title: parseInlineMarkdown(violation.title),
        severity: violation.severity,
        tone: severityTone(violation.severity),
        tags,
        description: violation.description ? parseInlineMarkdown(violation.description) : undefined,
        selector: violation.affected_selector,
        howToFix: { ...toReportHowToFix(violation), instances: Array.from(instances) },
      };
    });
}

function formatDate(value: string | undefined): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: 'long' });
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'site';
  }
}

export function buildAuditReport(input: AuditReportInput, now: Date = new Date()): ReportDocument {
  const present = DEVICES.filter(({ key }) => input[key]);
  const first = input[present[0]?.key ?? 'mobile']?.audit;
  const url = first?.url_scanned ?? '';
  const issues = mergeIssues(input);

  const scoreRows = SCORES.map(({ key, label }) => ({
    header: label,
    cells: present.map(({ key: device }) => {
      const score = Math.round(input[device]?.audit[key] ?? 0);
      return { text: String(score), tone: scoreTone(score), meter: score };
    }),
  }));

  const severityRows = SEVERITIES.map((severity) => ({
    header: titleCase(severity),
    cells: present.map(({ key: device }) => {
      const count = (input[device]?.violations ?? []).filter((v) => v.severity === severity).length;
      return { text: String(count), tone: count > 0 ? severityTone(severity) : undefined };
    }),
  }));

  const deviceColumns = present.map(({ label }) => label);
  const summaryBlocks: ReportBlock[] = [
    { kind: 'table', caption: 'Lighthouse scores (0 to 100)', columns: ['Category', ...deviceColumns], rows: scoreRows },
    { kind: 'table', caption: 'Issues by severity', columns: ['Severity', ...deviceColumns], rows: severityRows },
  ];
  const screenshot = present.map(({ key }) => input[key]?.audit).find((audit) => audit?.screenshot_url);
  if (screenshot?.screenshot_url) {
    summaryBlocks.push({
      kind: 'image',
      src: screenshot.screenshot_url,
      alt: `Screenshot of ${url}`,
      caption: `Captured during the ${screenshot.device_type ?? ''} audit.`.replace('  ', ' '),
    });
  }

  const issueBlocks: ReportBlock[] = [];
  for (const severity of SEVERITIES) {
    const group = issues.filter((issue) => issue.severity === severity);
    if (group.length === 0) continue;
    issueBlocks.push({ kind: 'subheading', text: titleCase(severity), meta: `${group.length} ${group.length === 1 ? 'issue' : 'issues'}` });
    issueBlocks.push({ kind: 'issues', items: group, headingLevel: 4 });
  }
  const other = issues.filter((issue) => !SEVERITIES.includes(issue.severity as (typeof SEVERITIES)[number]));
  if (other.length) issueBlocks.push({ kind: 'subheading', text: 'Other' }, { kind: 'issues', items: other, headingLevel: 4 });
  if (issueBlocks.length === 0) issueBlocks.push({ kind: 'paragraph', text: 'No issues were found by the automated checks.' });

  const sections: ReportSection[] = [
    { id: 'summary', title: 'Summary', blocks: summaryBlocks },
    { id: 'issues', title: 'Issues', meta: `${issues.length} unique`, blocks: issueBlocks, pageBreakBefore: true },
  ];

  const missing = DEVICES.filter(({ key }) => !input[key]).map(({ label }) => label);

  return {
    eyebrow: 'Accessibility Audit Report',
    title: hostname(url) === 'site' ? 'Site audit' : hostname(url),
    subject: url ? { label: url, url } : undefined,
    meta: [
      { label: 'Audited', value: formatDate(first?.created_at) },
      { label: 'Devices', value: deviceColumns.join(', ') || 'None' },
      { label: 'Unique issues', value: String(issues.length) },
      { label: 'Engine', value: 'Google Lighthouse' },
    ],
    sections,
    footerNote: [
      missing.length ? `The ${missing.join(' and ')} audit did not complete and is not included.` : '',
      'Automated checks cannot detect every accessibility barrier. Pair this report with manual keyboard and screen reader testing before claiming conformance.',
    ]
      .filter(Boolean)
      .join(' '),
    fileName: `univia-audit-${hostname(url)}-${now.toISOString().slice(0, 10)}`,
  };
}
