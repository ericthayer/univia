import type { MonitorIssue } from '../../../services/monitor.service';

export interface KnownLimitation {
  ruleId: string;
  title: string;
  pages: number;
}

/**
 * Groups unresolved issues by rule, counting the distinct pages each affects.
 * Most widespread first, then by title for a stable order.
 */
export function knownLimitations(issues: MonitorIssue[]): KnownLimitation[] {
  const byRule = new Map<string, { title: string; pages: Set<string> }>();
  for (const issue of issues) {
    if (issue.state === 'resolved') continue;
    const entry = byRule.get(issue.rule_id) ?? { title: issue.title, pages: new Set<string>() };
    entry.pages.add(issue.page_id);
    byRule.set(issue.rule_id, entry);
  }
  return [...byRule.entries()]
    .map(([ruleId, entry]) => ({ ruleId, title: entry.title, pages: entry.pages.size }))
    .sort((a, b) => b.pages - a.pages || a.title.localeCompare(b.title));
}
