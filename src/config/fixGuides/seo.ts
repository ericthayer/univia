import type { FixGuide } from './types';

const SEARCHERS = 'People finding you through Google and other search engines';

const metaDescription: FixGuide = {
  summary: 'The page has no meta description, the short summary search engines often show under your link.',
  whyItMatters: 'Without one, Google picks random text from the page. A clear description gets more clicks from search results.',
  whoIsAffected: [SEARCHERS],
  steps: [
    'In your CMS, fill in the "Meta description" or "SEO description" field for this page.',
    'Write one or two sentences (about 150 characters) saying what the page offers and why to click.',
  ],
  example: { language: 'html', after: '<meta name="description" content="Licensed Denver plumbers. Same-day drain cleaning and water heater repair. Call or book online.">' },
  owner: 'content',
  effort: 'quick',
};

const linkText: FixGuide = {
  summary: 'Some links use vague text such as "click here" or "learn more".',
  whyItMatters: 'Search engines and screen reader users both rely on link text to understand where a link goes.',
  whoIsAffected: [SEARCHERS, 'People using screen readers'],
  steps: ['Rewrite each link under "Where we found it" to name its destination ("See our pricing" instead of "Click here").'],
  owner: 'content',
  effort: 'quick',
};

const crawlableAnchors: FixGuide = {
  summary: 'Some links cannot be followed by search engines because they have no real address (href).',
  whyItMatters: 'Pages reachable only through these links may never be indexed. They also often fail for keyboard users.',
  whoIsAffected: [SEARCHERS, 'People who navigate with a keyboard'],
  steps: [
    'Give every link a real href pointing at a URL.',
    'If the element runs a script instead of navigating, make it a <button> rather than a link.',
  ],
  example: { language: 'html', before: '<a onclick="goTo(\'pricing\')">Pricing</a>', after: '<a href="/pricing">Pricing</a>' },
  owner: 'developer',
  effort: 'quick',
};

const indexing: FixGuide = {
  summary: 'Search engines are blocked from indexing this page, or cannot read the site\'s indexing rules.',
  whyItMatters: 'A blocked page will not appear in search results at all. This is often a leftover setting from when the site was in development.',
  whoIsAffected: [SEARCHERS],
  steps: [
    'Check for a "Discourage search engines" or "Hide from search" setting in your CMS and turn it off.',
    'Remove any <meta name="robots" content="noindex"> tag from pages that should be public.',
    'Make sure /robots.txt loads and does not contain "Disallow: /" for all user agents.',
  ],
  owner: 'developer',
  effort: 'quick',
};

const statusCode: FixGuide = {
  summary: 'The page returned an error status code instead of loading normally.',
  whyItMatters: 'Search engines drop pages that return errors, and visitors may see an error page.',
  whoIsAffected: [SEARCHERS, 'All visitors'],
  steps: ['Open the URL and confirm it loads.', 'If the page moved, set up a 301 redirect to the new address. If it should exist, ask your host to check the server logs.'],
  owner: 'hosting',
  effort: 'moderate',
};

const canonical: FixGuide = {
  summary: 'The page\'s canonical link (which tells search engines the "official" address) is broken or conflicting.',
  whyItMatters: 'Search engines may index the wrong version of the page or split ranking between duplicates.',
  whoIsAffected: [SEARCHERS],
  steps: ['Set one <link rel="canonical"> per page with the full https URL of that page.', 'Make sure it does not point at a redirect, a 404, or a different page.'],
  owner: 'developer',
  effort: 'quick',
};

const fontSize: FixGuide = {
  summary: 'Much of the text is too small to read on a phone without zooming.',
  whyItMatters: 'Google ranks mobile-friendly pages higher, and small text is hard to read for everyone, especially older visitors.',
  whoIsAffected: ['Everyone on a phone', 'Older visitors and people with low vision'],
  steps: ['Set body text to at least 16px on mobile.', 'Check footers, captions, and fine print, which are usually the smallest.'],
  example: { language: 'css', before: 'body { font-size: 12px; }', after: 'body { font-size: 1rem; /* 16px */ }' },
  owner: 'designer',
  effort: 'quick',
};

export const seoGuides: Record<string, FixGuide> = {
  'meta-description': metaDescription,
  'link-text': linkText,
  'crawlable-anchors': crawlableAnchors,
  'is-crawlable': indexing,
  'robots-txt': indexing,
  'http-status-code': statusCode,
  canonical,
  hreflang: {
    ...canonical,
    summary: 'The page\'s alternate-language links (hreflang) are invalid.',
    steps: ['Use valid language codes ("en", "es-MX") in each <link rel="alternate" hreflang>.', 'Point each one at a full https URL that exists.'],
  },
  'font-size': fontSize,
  'tap-targets': {
    ...fontSize,
    summary: 'Some links or buttons are too small or too close together to tap on a phone.',
    steps: ['Give each tap target at least 44×44 pixels of clickable area with padding.', 'Add spacing between neighboring links.'],
    example: undefined,
  },
  'structured-data': {
    ...canonical,
    summary: 'The page\'s structured data (the code that powers rich search results) has errors.',
    steps: ['Test the page in Google\'s Rich Results Test.', 'Fix the fields it reports, usually in your SEO plugin settings.'],
  },
};
