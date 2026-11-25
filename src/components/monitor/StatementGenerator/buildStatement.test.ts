import { describe, expect, it } from 'vitest';
import {
  buildStatement,
  escapeHtml,
  LIMITATION_CAP,
  statementToHtmlDocument,
  statementToHtmlFragment,
  statementToText,
  type StatementInput,
} from './buildStatement';

const base: StatementInput = {
  organization: 'Corner Bakery',
  siteName: 'Corner Bakery',
  origin: 'https://bakery.example.com',
  standard: '2.2',
  pagesMonitored: 12,
  weeklyScans: true,
  measures: '',
  contactEmail: 'help@bakery.example.com',
  contactPhone: '',
  responseDays: 5,
  lastScan: { completedAt: '2026-11-20T15:00:00Z', pagesChecked: 12, pagesTotal: 12 },
  includeLimitations: true,
  limitations: [{ ruleId: 'color-contrast', title: 'Background and foreground colors do not have a sufficient contrast ratio.', pages: 3 }],
  reviewedOn: '2026-11-25',
};

const headings = (input: StatementInput) => buildStatement(input).sections.map((section) => section.heading);

describe('buildStatement', () => {
  it('builds every section in order with the facts filled in', () => {
    const text = statementToText(buildStatement(base));
    expect(headings(base)).toEqual(['Our commitment', 'How we check', 'Known limitations', 'Feedback and contact', 'About this statement']);
    expect(text).toContain('Accessibility statement for Corner Bakery');
    expect(text).toContain('WCAG) 2.2 at Level AA');
    expect(text).toContain('on 12 pages of this site every week');
    expect(text).toContain('Our most recent automated check, on November 20, 2026, checked 12 pages.');
    expect(text).toContain('issues our automated checks know about that are not yet fixed');
    expect(text).toContain('- Background and foreground colors do not have a sufficient contrast ratio (3 pages)');
    expect(text).toContain('- Email: help@bakery.example.com');
    expect(text).toContain('within 5 business days');
    expect(text).toContain('last reviewed on November 25, 2026');
  });

  it('never claims compliance or conformance', () => {
    const text = statementToText(buildStatement({ ...base, measures: 'We test with a keyboard.' })).toLowerCase();
    expect(text).not.toMatch(/complian|conform|certif|guarantee|fully accessible/);
  });

  it('omits known limitations when switched off or before any scan completes', () => {
    expect(headings({ ...base, includeLimitations: false })).not.toContain('Known limitations');
    expect(headings({ ...base, lastScan: null })).not.toContain('Known limitations');
  });

  it('says no issues were found without calling the site accessible', () => {
    const text = statementToText(buildStatement({ ...base, limitations: [] }));
    expect(text).toContain('have found no open issues on the pages we monitor');
    expect(text).toContain('cannot find every problem');
  });

  it('says how many pages the latest check could reach', () => {
    const text = statementToText(buildStatement({ ...base, limitations: [], lastScan: { completedAt: '2026-11-20T15:00:00Z', pagesChecked: 1, pagesTotal: 25 } }));
    expect(text).toContain('could check 1 of 25 pages.');
  });

  it('does not promise weekly checks while scans are paused', () => {
    const text = statementToText(buildStatement({ ...base, weeklyScans: false }));
    expect(text).not.toContain('every week');
    expect(text).toContain('We check 12 pages of this site with automated accessibility tools');
  });

  it('caps the list and counts the rest', () => {
    const limitations = Array.from({ length: LIMITATION_CAP + 3 }, (_, index) => ({ ruleId: `r${index}`, title: `Rule ${index}`, pages: 1 }));
    const text = statementToText(buildStatement({ ...base, limitations }));
    expect(text).toContain('- Rule 9 (1 page)');
    expect(text).not.toContain('Rule 10 ');
    expect(text).toContain('- 3 other issues');
  });

  it('adds optional measures and phone only when given', () => {
    expect(statementToText(buildStatement(base))).not.toContain('Phone:');
    const text = statementToText(buildStatement({ ...base, measures: '  We test with a keyboard.  ', contactPhone: '(555) 010-2000' }));
    expect(text).toContain('\n\nWe test with a keyboard.\n\n');
    expect(text).toContain('- Phone: (555) 010-2000');
  });
});

describe('HTML output', () => {
  it('escapes everything the owner typed', () => {
    const html = statementToHtmlFragment(
      buildStatement({ ...base, organization: '<script>alert(1)</script>', measures: 'A & "B"', contactPhone: '+1 (555) 010' }),
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('<p>A &amp; &quot;B&quot;</p>');
    expect(html).toContain('<a href="tel:+1555010">+1 (555) 010</a>');
    expect(html).toContain('<a href="mailto:help@bakery.example.com">');
  });

  it('wraps the fragment in a complete document', () => {
    const doc = statementToHtmlDocument(buildStatement(base));
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain('<html lang="en">');
    expect(doc).toContain('<title>Accessibility statement for Corner Bakery</title>');
    expect(doc).toContain('<main>\n<h1>');
  });

  it('escapes quotes and angle brackets', () => {
    expect(escapeHtml(`<a href='x'>"&"</a>`)).toBe('&lt;a href=&#39;x&#39;&gt;&quot;&amp;&quot;&lt;/a&gt;');
  });
});
