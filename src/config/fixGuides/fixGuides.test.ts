import { describe, expect, it } from 'vitest';
import { getFixGuidance } from '.';
import { accessibilityGuides } from './accessibility';
import { bestPracticeGuides } from './bestPractices';
import { performanceGuides } from './performance';
import { seoGuides } from './seo';
import { wcagRefs } from './wcag';

describe('getFixGuidance', () => {
  it('replaces the raw console text with diagnosed instances', () => {
    const g = getFixGuidance({
      wcag_guideline: 'errors-in-console',
      title: 'Browser errors were logged to the console',
      description: 'Errors logged to the console indicate unresolved problems. [Learn more about this errors in console diagnostic audit](https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/)',
      remediation_steps: [
        'Failed to load resource: the server responded with a status of 403 ()',
        "Refused to display 'https://codepen.io/' in a frame because it set 'X-Frame-Options' to 'sameorigin'.",
      ],
    });
    expect(g.curated).toBe(true);
    expect(g.category).toBe('best-practices');
    expect(g.standards).toEqual([]);
    expect(g.summary).not.toMatch(/\]\(https/);
    expect(g.instances).toHaveLength(2);
    expect(g.instances.every((i) => i.diagnosis)).toBe(true);
    expect(g.resources[0].url).toBe('https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/');
  });

  it('maps accessibility rules to real WCAG criteria', () => {
    const g = getFixGuidance({ wcag_guideline: 'color-contrast', title: 'Contrast', remediation_steps: ['Element: <p class="x">'] });
    expect(g.standards.map((s) => [s.id, s.level])).toEqual([['1.4.3', 'AA']]);
    expect(g.instances[0]).toEqual({ kind: 'element', text: '<p class="x">' });
    expect(g.resources.some((r) => r.url.includes('webaim'))).toBe(true);
  });

  it('falls back to the cleaned Lighthouse description for unknown rules', () => {
    const g = getFixGuidance({ wcag_guideline: 'brand-new-audit', title: 'New thing', description: 'Plain text. [Learn more](https://example.test/doc)' });
    expect(g.curated).toBe(false);
    expect(g.summary).toBe('Plain text.');
    expect(g.steps.length).toBeGreaterThan(0);
  });

  it('only references WCAG criteria that resolve', () => {
    for (const guides of [accessibilityGuides, bestPracticeGuides, seoGuides, performanceGuides]) {
      for (const [id, guide] of Object.entries(guides)) {
        expect(wcagRefs(guide.wcag).length, id).toBe(guide.wcag?.length ?? 0);
        expect(guide.steps.length, id).toBeGreaterThan(0);
      }
    }
  });
});

describe('review fixes', () => {
  it('categorizes uncurated SEO and performance rules', () => {
    expect(getFixGuidance({ wcag_guideline: 'plugins', title: 'x' }).category).toBe('seo');
    expect(getFixGuidance({ wcag_guideline: 'some-new-insight', title: 'x' }).category).toBe('performance');
    expect(getFixGuidance({ wcag_guideline: 'unknown', title: 'x' }, 'seo').category).toBe('seo');
  });

  it('keeps best-practice rules free of WCAG claims and maps meter and duplicate labels correctly', () => {
    for (const id of ['tabindex', 'aria-allowed-role', 'aria-text', 'aria-dialog-name', 'aria-treeitem-name', 'skip-link']) {
      expect(getFixGuidance({ wcag_guideline: id, title: 'x' }).standards, id).toEqual([]);
    }
    expect(getFixGuidance({ wcag_guideline: 'aria-meter-name', title: 'x' }).standards.map((s) => s.id)).toEqual(['1.1.1']);
    expect(getFixGuidance({ wcag_guideline: 'form-field-multiple-labels', title: 'x' }).standards.map((s) => s.id)).toEqual(['3.3.2']);
  });

  it('does not tell SVG or role=img graphics to use alt', () => {
    const g = getFixGuidance({ wcag_guideline: 'svg-img-alt', title: 'x' });
    expect(g.example?.after).toContain('aria-label');
    expect(g.example?.after).not.toContain('alt=');
  });
});
