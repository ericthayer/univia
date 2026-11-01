import { describe, expect, it } from 'vitest';
import type { AccessibilityAudit, Violation } from '../../types';
import { buildAuditReport, mergeIssues, toStepText } from './buildAuditReport';

const audit = (device: 'mobile' | 'desktop', score: number): AccessibilityAudit => ({
  id: device,
  business_id: 'b',
  url_scanned: 'https://www.example.com/',
  accessibility_score: score,
  performance_score: 55,
  best_practices_score: 92,
  seo_score: 100,
  device_type: device,
  created_at: '2026-10-30T12:00:00Z',
});

const violation = (overrides: Partial<Violation>): Violation => ({
  id: Math.random().toString(36),
  audit_id: 'a',
  wcag_guideline: 'image-alt',
  severity: 'critical',
  title: 'Images lack alt text',
  created_at: '2026-10-30T12:00:00Z',
  ...overrides,
});

describe('toStepText', () => {
  it('unwraps JSON strings and value objects', () => {
    expect(toStepText('"plain"')).toBe('plain');
    expect(toStepText('{"value":"Failed to load resource"}')).toBe('Failed to load resource');
    expect(toStepText({ url: 'https://cdn.example.com/a.js' })).toBe('https://cdn.example.com/a.js');
    expect(toStepText('not json')).toBe('not json');
  });
});

describe('mergeIssues', () => {
  it('lists an issue found on both devices once, tagged with both', () => {
    const issues = mergeIssues({
      mobile: { audit: audit('mobile', 80), violations: [violation({ remediation_steps: ['img.hero'] })] },
      desktop: { audit: audit('desktop', 85), violations: [violation({ remediation_steps: ['img.hero', 'img.logo'] })] },
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].tags).toEqual(['WCAG image-alt', 'Mobile', 'Desktop']);
    expect(issues[0].howToFix.instances).toEqual(['img.hero', 'img.logo']);
  });

  it('keeps the most severe reading of an issue shared by both devices', () => {
    const issues = mergeIssues({
      mobile: { audit: audit('mobile', 80), violations: [violation({ severity: 'moderate' })] },
      desktop: { audit: audit('desktop', 85), violations: [violation({ severity: 'critical' })] },
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('critical');
  });

  it('orders by severity', () => {
    const issues = mergeIssues({
      mobile: {
        audit: audit('mobile', 80),
        violations: [violation({ severity: 'minor', title: 'B' }), violation({ severity: 'critical', title: 'A' })],
      },
    });
    expect(issues.map((issue) => issue.severity)).toEqual(['critical', 'minor']);
  });
});

describe('buildAuditReport', () => {
  it('builds summary tables per present device and a dated file name', () => {
    const report = buildAuditReport(
      { mobile: { audit: audit('mobile', 64), violations: [violation({})] } },
      new Date('2026-11-01T10:00:00Z'),
    );
    expect(report.title).toBe('example.com');
    expect(report.fileName).toBe('univia-audit-example.com-2026-11-01');
    const summary = report.sections[0].blocks[0];
    expect(summary.kind).toBe('table');
    if (summary.kind !== 'table') return;
    expect(summary.columns).toEqual(['Category', 'Mobile']);
    const a11y = summary.rows.find((row) => row.header === 'Accessibility');
    expect(a11y?.cells[0]).toMatchObject({ text: '64', tone: 'error', meter: 64 });
    expect(report.footerNote).toContain('Desktop audit did not complete');
  });
});
