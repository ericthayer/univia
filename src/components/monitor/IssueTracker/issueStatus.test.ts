import { describe, expect, it } from 'vitest';
import type { IssueEvent, IssueEventKind, MonitorIssue } from '../../../services/monitor.service';
import { eventsByIssue, issueStatus, matchesFilter, parseIssueFilter } from './issueStatus';

const issue = (state: MonitorIssue['state']) => ({ id: 'i1', state }) as MonitorIssue;
const history = (...kinds: IssueEventKind[]): IssueEvent[] =>
  kinds.map((kind, index) => ({ id: index, issue_id: 'i1', run_id: null, kind, note: null, created_at: '' }));

describe('issueStatus', () => {
  it('tells a reopened issue from a new one', () => {
    expect(issueStatus(issue('open'), history('detected'))).toBe('open');
    expect(issueStatus(issue('open'), history('detected', 'resolved', 'reopened'))).toBe('reopened');
    expect(issueStatus(issue('open'), history('detected', 'marked_fixed', 'fix_not_confirmed'))).toBe('reopened');
    expect(issueStatus(issue('open'), history('detected', 'marked_fixed', 'unmarked_fixed'))).toBe('open');
  });

  it('tells a confirmed fix from an issue that stopped appearing', () => {
    expect(issueStatus(issue('resolved'), history('detected', 'marked_fixed', 'fix_confirmed'))).toBe('fix_confirmed');
    expect(issueStatus(issue('resolved'), history('detected', 'resolved'))).toBe('no_longer_found');
  });

  it('follows the stored state when history is missing', () => {
    expect(issueStatus(issue('marked_fixed'))).toBe('marked_fixed');
    expect(issueStatus(issue('resolved'))).toBe('no_longer_found');
  });
});

describe('filters', () => {
  it('open includes reopened issues; fixed includes every resolved issue', () => {
    expect(matchesFilter('reopened', 'open')).toBe(true);
    expect(matchesFilter('open', 'reopened')).toBe(false);
    expect(matchesFilter('no_longer_found', 'fixed')).toBe(true);
    expect(matchesFilter('marked_fixed', 'open')).toBe(false);
  });

  it('reads the filter from the URL, defaulting to open', () => {
    expect(parseIssueFilter('fixed')).toBe('fixed');
    expect(parseIssueFilter('bogus')).toBe('open');
    expect(parseIssueFilter(null)).toBe('open');
  });

  it('groups events by issue in order', () => {
    const grouped = eventsByIssue([...history('detected', 'resolved'), { ...history('detected')[0], issue_id: 'i2' }]);
    expect(grouped.get('i1')?.map((event) => event.kind)).toEqual(['detected', 'resolved']);
    expect(grouped.get('i2')).toHaveLength(1);
  });
});
