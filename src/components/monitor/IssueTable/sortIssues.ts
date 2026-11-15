import type { IssueSeverity, MonitorIssue } from '../../../services/monitor.service';

const SEVERITY_ORDER: Record<IssueSeverity, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

/** Most severe first, then oldest first so long-standing issues surface. */
export function sortIssues(issues: readonly MonitorIssue[]): MonitorIssue[] {
  return [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.first_seen_at.localeCompare(b.first_seen_at),
  );
}
