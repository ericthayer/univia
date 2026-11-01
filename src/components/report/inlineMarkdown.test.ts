import { describe, expect, it } from 'vitest';
import { parseInlineMarkdown, richTextToString, safeHref } from './inlineMarkdown';

describe('parseInlineMarkdown', () => {
  it('turns Lighthouse "Learn more" links into link segments', () => {
    const segments = parseInlineMarkdown('Errors indicate problems. [Learn more](https://developer.chrome.com/docs/x/).');
    expect(segments).toEqual([
      { kind: 'text', text: 'Errors indicate problems. ' },
      { kind: 'link', text: 'Learn more', href: 'https://developer.chrome.com/docs/x/' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('keeps unsafe link targets as plain text', () => {
    const segments = parseInlineMarkdown('[click](javascript:alert(1))');
    expect(segments.every((segment) => segment.kind === 'text')).toBe(true);
    expect(richTextToString(segments)).toContain('click');
  });

  it('parses inline code', () => {
    expect(parseInlineMarkdown('Add `alt` text')).toEqual([
      { kind: 'text', text: 'Add ' },
      { kind: 'code', text: 'alt' },
      { kind: 'text', text: ' text' },
    ]);
  });
});

describe('safeHref', () => {
  it('allows http(s) only', () => {
    expect(safeHref('https://univia.app')).toBe('https://univia.app/');
    expect(safeHref('data:text/html,hi')).toBeNull();
    expect(safeHref('/relative')).toBeNull();
  });
});
