import { describe, expect, it } from 'vitest';
import { extractPageScan, severityFromWeight } from './findings';

function lighthouse(audits: Record<string, unknown>, refs: Array<{ id: string; weight: number }>, score = 0.8) {
  return {
    categories: { accessibility: { score, auditRefs: refs } },
    audits,
  };
}

describe('extractPageScan', () => {
  it('keeps only failing accessibility rules, one finding per rule', () => {
    const scan = extractPageScan(lighthouse(
      {
        'image-alt': {
          title: 'Image elements do not have [alt] attributes',
          score: 0,
          details: {
            items: [
              { node: { selector: 'main > img', snippet: '<img src="a.png">', nodeLabel: 'Hero' } },
              { node: { selector: 'footer img', snippet: '<img src="b.png">' } },
            ],
          },
        },
        'color-contrast': { title: 'Contrast', score: 1 },
        'aria-allowed-role': { title: 'Manual', score: null },
        'largest-contentful-paint': { title: 'LCP', score: 0.2 },
      },
      [
        { id: 'image-alt', weight: 10 },
        { id: 'color-contrast', weight: 7 },
        { id: 'aria-allowed-role', weight: 0 },
      ],
    ));

    expect(scan).toEqual({
      accessibility_score: 80,
      findings: [{
        rule_id: 'image-alt',
        title: 'Image elements do not have [alt] attributes',
        severity: 'critical',
        element_count: 2,
        items: [
          { selector: 'main > img', snippet: '<img src="a.png">', label: 'Hero' },
          { selector: 'footer img', snippet: '<img src="b.png">', label: undefined },
        ],
      }],
    });
  });

  it('caps examples at five and clips long text', () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ node: { selector: `a:nth-child(${i})`, snippet: 'x'.repeat(900) } }));
    const scan = extractPageScan(lighthouse({ 'link-name': { title: 'Links', score: 0, details: { items } } }, [{ id: 'link-name', weight: 7 }]));
    expect(scan?.findings[0].element_count).toBe(9);
    expect(scan?.findings[0].items).toHaveLength(5);
    expect(scan?.findings[0].items[0].snippet).toHaveLength(300);
  });

  it('returns no findings for a clean page', () => {
    expect(extractPageScan(lighthouse({ 'image-alt': { title: 'ok', score: 1 } }, [{ id: 'image-alt', weight: 10 }], 1)))
      .toEqual({ accessibility_score: 100, findings: [] });
  });

  it('rejects unusable results so the page is retried', () => {
    expect(extractPageScan(null)).toBeNull();
    expect(extractPageScan({ runtimeError: { code: 'NO_FCP' }, categories: {}, audits: {} })).toBeNull();
    expect(extractPageScan({ categories: { performance: { score: 1 } }, audits: {} })).toBeNull();
    expect(extractPageScan({ categories: { accessibility: { score: null, auditRefs: [] } }, audits: {} })).toBeNull();
  });
});

describe('severityFromWeight', () => {
  it('maps Lighthouse weights to severities', () => {
    expect([10, 7, 3, 1, 0, undefined].map(severityFromWeight))
      .toEqual(['critical', 'serious', 'moderate', 'minor', 'minor', 'minor']);
  });
});
