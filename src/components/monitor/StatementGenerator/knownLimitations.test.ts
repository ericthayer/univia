import { describe, expect, it } from 'vitest';
import type { MonitorIssue } from '../../../services/monitor.service';
import { knownLimitations } from './knownLimitations';

const issue = (rule: string, page: string, state: MonitorIssue['state'] = 'open', title = rule): MonitorIssue => ({
  id: `${rule}-${page}`,
  page_id: page,
  rule_id: rule,
  title,
  severity: 'serious',
  element_count: 1,
  sample_items: [],
  state,
  first_seen_at: '2026-11-01T00:00:00Z',
  last_seen_at: '2026-11-20T00:00:00Z',
});

describe('knownLimitations', () => {
  it('groups by rule, counts distinct pages, most widespread first', () => {
    const result = knownLimitations([
      issue('label', 'p1'),
      issue('color-contrast', 'p1'),
      issue('color-contrast', 'p2'),
      issue('color-contrast', 'p2'),
    ]);
    expect(result).toEqual([
      { ruleId: 'color-contrast', title: 'color-contrast', pages: 2 },
      { ruleId: 'label', title: 'label', pages: 1 },
    ]);
  });

  it('keeps issues marked fixed but not yet confirmed, and drops resolved ones', () => {
    const result = knownLimitations([issue('a', 'p1', 'marked_fixed'), issue('b', 'p1', 'resolved')]);
    expect(result.map((entry) => entry.ruleId)).toEqual(['a']);
  });

  it('breaks ties by title', () => {
    const result = knownLimitations([issue('z', 'p1', 'open', 'Beta'), issue('y', 'p1', 'open', 'Alpha')]);
    expect(result.map((entry) => entry.title)).toEqual(['Alpha', 'Beta']);
  });
});
