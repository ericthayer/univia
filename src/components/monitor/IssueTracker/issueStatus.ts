import type { Tone } from '../../ui/tone';
import type { IssueEvent, IssueEventKind, MonitorIssue } from '../../../services/monitor.service';

/** Tracker filters. "Reopened" is a subset of open; "fixed" is every resolved issue. */
export const ISSUE_FILTERS = ['open', 'marked_fixed', 'reopened', 'fixed'] as const;
export type IssueFilter = (typeof ISSUE_FILTERS)[number];

export const FILTER_LABEL: Record<IssueFilter, string> = {
  open: 'Open',
  marked_fixed: 'Marked fixed',
  reopened: 'Reopened',
  fixed: 'Fixed',
};

export function parseIssueFilter(value: string | null): IssueFilter {
  return ISSUE_FILTERS.find((filter) => filter === value) ?? 'open';
}

export type IssueStatus = 'open' | 'reopened' | 'marked_fixed' | 'fix_confirmed' | 'no_longer_found';

export const STATUS: Record<IssueStatus, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'warning' },
  reopened: { label: 'Reopened', tone: 'error' },
  marked_fixed: { label: 'Marked fixed', tone: 'info' },
  fix_confirmed: { label: 'Fix confirmed', tone: 'success' },
  no_longer_found: { label: 'No longer found', tone: 'success' },
};

/** Groups events by issue, keeping their order (oldest first). */
export function eventsByIssue(events: readonly IssueEvent[]): Map<string, IssueEvent[]> {
  const map = new Map<string, IssueEvent[]>();
  for (const event of events) {
    const list = map.get(event.issue_id);
    if (list) list.push(event);
    else map.set(event.issue_id, [event]);
  }
  return map;
}

/**
 * What the owner sees for an issue. The stored state has three values; the
 * history tells a reopened issue from a new one and a confirmed fix from an
 * issue that simply stopped appearing.
 */
export function issueStatus(issue: MonitorIssue, history: readonly IssueEvent[] = []): IssueStatus {
  const last = history[history.length - 1]?.kind;
  if (issue.state === 'marked_fixed') return 'marked_fixed';
  if (issue.state === 'resolved') return last === 'fix_confirmed' ? 'fix_confirmed' : 'no_longer_found';
  return last === 'reopened' || last === 'fix_not_confirmed' ? 'reopened' : 'open';
}

export function matchesFilter(status: IssueStatus, filter: IssueFilter): boolean {
  switch (filter) {
    case 'open':
      return status === 'open' || status === 'reopened';
    case 'reopened':
      return status === 'reopened';
    case 'marked_fixed':
      return status === 'marked_fixed';
    case 'fixed':
      return status === 'fix_confirmed' || status === 'no_longer_found';
  }
}

export const EVENT_LABEL: Record<IssueEventKind, string> = {
  detected: 'Found by a scan',
  reopened: 'Found again after it was gone',
  resolved: 'No longer found by a scan',
  marked_fixed: 'You marked it fixed',
  unmarked_fixed: 'You took back the fixed mark',
  fix_confirmed: 'Fix confirmed: a scan no longer finds it',
  fix_not_confirmed: 'Fix not confirmed: a scan still finds it',
};
