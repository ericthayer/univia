import { describe, expect, it } from 'vitest';
import { parseInstance, parseLighthouseDescription, toStepText } from './lighthouseText';

describe('parseLighthouseDescription', () => {
  it('pulls markdown links out of the prose', () => {
    const parsed = parseLighthouseDescription(
      'Errors logged to the console indicate unresolved problems. [Learn more about this audit](https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/)',
    );
    expect(parsed.text).toBe('Errors logged to the console indicate unresolved problems.');
    expect(parsed.links).toEqual([
      { label: 'Learn more about this audit', url: 'https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/' },
    ]);
  });

  it('drops inline code backticks and handles empty input', () => {
    expect(parseLighthouseDescription('Add a `<title>` element.').text).toBe('Add a <title> element.');
    expect(parseLighthouseDescription(undefined)).toEqual({ text: '', links: [] });
  });
});

describe('parseInstance', () => {
  it('classifies the stored prefixes', () => {
    expect(parseInstance('Element: <img src="a.png">')).toEqual({ kind: 'element', text: '<img src="a.png">' });
    expect(parseInstance('Resource: https://x.test/a.js')).toEqual({ kind: 'resource', text: 'https://x.test/a.js' });
    expect(parseInstance('Failed to load resource')).toEqual({ kind: 'message', text: 'Failed to load resource' });
  });

  it('unwraps JSON-encoded rows', () => {
    expect(toStepText(JSON.stringify({ value: 'hello' }))).toBe('hello');
    expect(toStepText('"quoted"')).toBe('quoted');
  });
});

describe('inline links', () => {
  it('keeps inline link text while extracting the URL', () => {
    const parsed = parseLighthouseDescription('Use [semantic HTML](https://example.test/html) for structure. [Learn more](https://example.test/more).');
    expect(parsed.text).toBe('Use semantic HTML for structure.');
    expect(parsed.links.map((l) => l.url)).toEqual(['https://example.test/html', 'https://example.test/more']);
  });
});
