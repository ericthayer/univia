import { describe, expect, it } from 'vitest';
import { buildRemediationRecord, RECORD_DISCLAIMER, summarizeIssues } from './buildRemediationRecord';
import type { RecordContents, RecordEvent } from '../../services/remediationRecord.service';

const ev = (id: number, issue: string, kind: RecordEvent['kind'], at: string, note: string | null = null): RecordEvent => ({
  id,
  issue_id: issue,
  run_id: null,
  kind,
  note,
  created_at: at,
});

const CONTENTS: RecordContents = {
  record: {
    id: '11111111-2222-3333-4444-555555555555',
    site_id: 's1',
    period_start: '2026-10-01T00:00:00Z',
    period_end: '2026-11-01T00:00:00Z',
    run_count: 3,
    event_count: 7,
    fingerprint: 'a'.repeat(64),
    created_at: '2026-11-02T00:00:00Z',
  },
  site: { name: 'Shop', origin: 'https://shop.example.com' },
  runs: [
    { id: 'r0', trigger: 'initial', status: 'completed', pages_total: 2, pages_succeeded: 2, pages_failed: 0, new_issues: 2, resolved_issues: 0, created_at: '2026-09-20T00:00:00Z', completed_at: '2026-09-20T00:05:00Z' },
    { id: 'r1', trigger: 'scheduled', status: 'completed', pages_total: 2, pages_succeeded: 1, pages_failed: 1, new_issues: 1, resolved_issues: 0, created_at: '2026-10-05T00:00:00Z', completed_at: '2026-10-05T00:05:00Z' },
    { id: 'r2', trigger: 'recheck', status: 'completed', pages_total: 1, pages_succeeded: 1, pages_failed: 0, new_issues: 0, resolved_issues: 1, created_at: '2026-10-10T00:00:00Z', completed_at: '2026-10-10T00:05:00Z' },
  ],
  events: [
    ev(1, 'a', 'detected', '2026-09-20T00:05:00Z'),
    ev(2, 'b', 'detected', '2026-09-20T00:05:00Z'),
    ev(3, 'c', 'detected', '2026-10-05T00:05:00Z'),
    ev(4, 'a', 'marked_fixed', '2026-10-08T00:00:00Z', 'Added alt text'),
    ev(5, 'a', 'fix_confirmed', '2026-10-10T00:05:00Z'),
    ev(6, 'b', 'marked_fixed', '2026-10-20T00:00:00Z'),
    ev(7, 'c', 'marked_fixed', '2026-09-01T00:00:00Z'),
  ],
  issues: [
    { id: 'a', rule_id: 'image-alt', title: 'Images need text', severity: 'critical', page_url: 'https://shop.example.com/' },
    { id: 'b', rule_id: 'link-name', title: 'Links need names', severity: 'serious', page_url: 'https://shop.example.com/cart' },
    { id: 'c', rule_id: 'label', title: 'Labels missing', severity: 'moderate', page_url: 'https://shop.example.com/cart' },
  ],
};

const OPTIONS = { verifyUrl: 'https://univia.help/verify/record/1111', locale: 'en-US', timeZone: 'UTC' };

describe('buildRemediationRecord', () => {
  it('counts only the period for scans and events, from the fingerprinted history', () => {
    const report = buildRemediationRecord(CONTENTS, OPTIONS);
    const summary = report.sections.find((section) => section.id === 'summary');
    const facts = summary?.blocks[0];
    expect(facts?.kind).toBe('facts');
    const values = facts?.kind === 'facts' ? Object.fromEntries(facts.items.map((item) => [item.label, item.value])) : {};
    expect(values).toMatchObject({
      'Scans finished': '2',
      'Pages scanned': '2',
      'Issues found or found again': '1',
      'Marked fixed by the owner': '2',
      'Fixes confirmed by a scan': '1',
    });
  });

  it('lists fixes with the owner note and the scan result', () => {
    const report = buildRemediationRecord(CONTENTS, OPTIONS);
    const table = report.sections.find((section) => section.id === 'fixes')?.blocks[0];
    expect(table?.kind).toBe('table');
    if (table?.kind !== 'table') return;
    expect(table.rows.map((row) => row.header)).toEqual(['Images need text', 'Links need names']);
    expect(table.rows[0].cells.map((cell) => cell.text)).toEqual(['/', 'Critical', 'Oct 8, 2026', 'Fix confirmed Oct 10, 2026', 'Added alt text']);
    expect(table.rows[1].cells[3].text).toBe('Waiting for a scan');
  });

  it('carries the fingerprint, verify link and limits, with no compliance claim', () => {
    const report = buildRemediationRecord(CONTENTS, OPTIONS);
    const text = JSON.stringify(report);
    expect(text).toContain('a'.repeat(64));
    expect(text).toContain(OPTIONS.verifyUrl);
    expect(report.sections.map((section) => section.id)).toContain('limits');
    expect(report.footerNote).toBe(RECORD_DISCLAIMER);
    expect(text).not.toMatch(/\b(compliant|certif|immun|guarantee)/i);
  });

  it('works out where each issue stood at the end of the period', () => {
    const states = Object.fromEntries(summarizeIssues(CONTENTS).map((summary) => [summary.issue.id, summary.endState]));
    expect(states).toEqual({ a: 'resolved', b: 'marked_fixed', c: 'marked_fixed' });
  });
});
