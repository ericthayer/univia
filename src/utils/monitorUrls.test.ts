import { describe, expect, it } from 'vitest';
import { normalizeSiteOrigin, pagePath, parsePageList } from './monitorUrls';

describe('normalizeSiteOrigin', () => {
  it('accepts a bare domain, an https URL or a page URL', () => {
    expect(normalizeSiteOrigin('Shop.Example.com')).toEqual({ ok: true, origin: 'https://shop.example.com' });
    expect(normalizeSiteOrigin(' https://shop.example.com/about?x=1 ')).toEqual({ ok: true, origin: 'https://shop.example.com' });
  });

  it('refuses what the scanner will not scan', () => {
    for (const input of ['', 'http://shop.example.com', 'https://127.0.0.1', 'shop.localhost', 'xn--bcher-kva.example', 'localhost', 'https://shop.example.com:8443', 'not a site']) {
      expect(normalizeSiteOrigin(input).ok, input).toBe(false);
    }
  });

  it('explains http separately', () => {
    expect(normalizeSiteOrigin('http://shop.example.com')).toEqual({
      ok: false,
      message: 'Use the https:// address. Monitor scans secure sites only.',
    });
  });
});

describe('parsePageList', () => {
  const origin = 'https://shop.example.com';

  it('accepts paths and full URLs, drops duplicates and fragments', () => {
    expect(parsePageList(origin, '/\n/contact#form\nhttps://shop.example.com/contact\n\n  shop.example.com/about  ')).toEqual({
      urls: ['https://shop.example.com/', 'https://shop.example.com/contact', 'https://shop.example.com/about'],
      errors: [],
    });
  });

  it('reports pages on another site', () => {
    const result = parsePageList(origin, 'https://elsewhere.example.com/\nhttp://shop.example.com/');
    expect(result.urls).toEqual([]);
    expect(result.errors).toHaveLength(2);
  });

  it('enforces the 25-page limit including existing pages', () => {
    expect(parsePageList(origin, '/a\n/b', 24).errors).toEqual(['A site can have up to 25 pages.']);
    expect(parsePageList(origin, '/a', 24).errors).toEqual([]);
  });
});

describe('pagePath', () => {
  it('shows the path and query', () => {
    expect(pagePath('https://shop.example.com/')).toBe('/');
    expect(pagePath('https://shop.example.com/a?b=1')).toBe('/a?b=1');
  });
});
