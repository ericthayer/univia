// Turns a PageSpeed Lighthouse result into the findings a scan stores.
// Only rules in the accessibility category count. One finding per failing
// rule; element examples are for display and never part of an issue's identity
// (see 20261108140000_monitor_sites_and_scans.sql).

export type FindingSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface FindingItem {
  selector?: string;
  snippet?: string;
  label?: string;
}

export interface ScanFinding {
  rule_id: string;
  title: string;
  severity: FindingSeverity;
  element_count: number;
  items: FindingItem[];
}

export interface PageScan {
  accessibility_score: number;
  findings: ScanFinding[];
}

const MAX_ITEMS = 5;
const MAX_FINDINGS = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clip(value: unknown, max: number): string | undefined {
  return typeof value === 'string' && value ? value.slice(0, max) : undefined;
}

// Lighthouse weights accessibility rules by axe impact: 10, 7, 3, then 1 or 0.
export function severityFromWeight(weight: unknown): FindingSeverity {
  const value = typeof weight === 'number' ? weight : 0;
  if (value >= 10) return 'critical';
  if (value >= 7) return 'serious';
  if (value >= 3) return 'moderate';
  return 'minor';
}

function toItem(raw: unknown): FindingItem | null {
  if (!isRecord(raw)) return null;
  const node = isRecord(raw.node) ? raw.node : raw;
  const item: FindingItem = {
    selector: clip(node.selector, 300),
    snippet: clip(node.snippet, 300),
    label: clip(node.nodeLabel, 200),
  };
  return item.selector || item.snippet || item.label ? item : null;
}

// Returns null when the result is unusable, so the caller can retry the page.
export function extractPageScan(lighthouseResult: unknown): PageScan | null {
  if (!isRecord(lighthouseResult) || lighthouseResult.runtimeError) return null;
  const { categories, audits } = lighthouseResult;
  if (!isRecord(categories) || !isRecord(audits)) return null;

  const category = categories.accessibility;
  if (!isRecord(category) || !Array.isArray(category.auditRefs)) return null;
  const score = category.score;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) return null;

  const findings: ScanFinding[] = [];
  for (const ref of category.auditRefs) {
    if (!isRecord(ref) || typeof ref.id !== 'string') continue;
    const audit = audits[ref.id];
    if (!isRecord(audit)) continue;
    // Manual, informative and not-applicable rules have a null score.
    if (typeof audit.score !== 'number' || audit.score >= 1) continue;

    const details = isRecord(audit.details) ? audit.details : undefined;
    const rawItems = Array.isArray(details?.items) ? details.items : [];
    findings.push({
      rule_id: ref.id.slice(0, 100),
      title: clip(audit.title, 500) ?? ref.id,
      severity: severityFromWeight(ref.weight),
      element_count: rawItems.length,
      items: rawItems
        .slice(0, MAX_ITEMS)
        .map(toItem)
        .filter((item): item is FindingItem => item !== null),
    });
    if (findings.length >= MAX_FINDINGS) break;
  }

  return { accessibility_score: Math.round(score * 100), findings };
}
