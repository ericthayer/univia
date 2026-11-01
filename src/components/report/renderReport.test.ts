import { describe, expect, it } from 'vitest';
import { renderReport } from './renderReport';
import type { ReportDocument } from './reportModel';

const report: ReportDocument = {
  eyebrow: 'Accessibility Audit Report',
  title: 'example.com',
  subject: { label: 'https://example.com', url: 'https://example.com' },
  meta: [{ label: 'Devices', value: 'Mobile' }],
  fileName: 'univia-audit-example.com-2026-11-01',
  sections: [
    {
      id: 'summary',
      title: 'Summary',
      blocks: [
        { kind: 'table', caption: 'Scores', columns: ['Category', 'Mobile'], rows: [{ header: 'SEO', cells: [{ text: '91', tone: 'success', meter: 91 }] }] },
      ],
    },
    {
      id: 'issues',
      title: 'Issues',
      blocks: [
        { kind: 'subheading', text: 'Critical' },
        {
          kind: 'issues',
          headingLevel: 4,
          items: [
            {
              title: '<img src=x onerror=alert(1)>',
              severity: 'critical',
              tone: 'error',
              tags: ['WCAG image-alt'],
              description: [
                { kind: 'text', text: 'See ' },
                { kind: 'link', text: 'bad', href: 'javascript:alert(1)' },
              ],
              howToFix: { steps: ['Add alt text'], instances: ['img.hero'] },
            },
          ],
        },
      ],
    },
  ],
};

describe('renderReport', () => {
  it('renders semantic structure and sets the document title', () => {
    renderReport(document, report, { generatedAt: new Date('2026-11-01T10:00:00Z') });
    expect(document.title).toBe('univia-audit-example.com-2026-11-01');
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(Array.from(document.querySelectorAll('h2')).map((h) => h.textContent)).toEqual(['Summary', 'Issues']);
    expect(document.querySelector('th[scope="row"]')?.textContent).toBe('SEO');
    expect(document.querySelector('section')?.getAttribute('aria-labelledby')).toBe('section-summary');
    // Issues nest under their severity group: h2 section > h3 severity > h4 issue.
    expect(document.querySelector('.subheading h3')?.textContent).toBe('Critical');
    expect(document.querySelector('.issue h3')).toBeNull();
  });

  it('treats untrusted text as text and drops unsafe links', () => {
    renderReport(document, report);
    expect(document.querySelector('img[onerror]')).toBeNull();
    expect(document.querySelector('.issue h4')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
    expect(document.querySelector('.issue .fix ol li')?.textContent).toBe('Add alt text');
  });
});
