import { describe, expect, it } from 'vitest';
import type { MonitorIssue } from '../../../services/monitor.service';
import { sortIssues } from './sortIssues';

const issue = (id: string, severity: MonitorIssue['severity'], first: string) =>
  ({ id, severity, first_seen_at: first }) as MonitorIssue;

describe('sortIssues', () => {
  it('orders by severity, then oldest first', () => {
    const sorted = sortIssues([
      issue('a', 'minor', '2026-11-01'),
      issue('b', 'critical', '2026-11-10'),
      issue('c', 'critical', '2026-11-02'),
      issue('d', 'serious', '2026-11-01'),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(['c', 'b', 'd', 'a']);
  });
});
