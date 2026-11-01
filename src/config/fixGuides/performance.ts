import type { FixGuide } from './types';

const MOBILE = 'Visitors on phones and slower connections';
const ALL = 'All visitors';

const slowMainContent: FixGuide = {
  summary: 'The main content of the page (usually the hero image or headline) takes too long to appear.',
  whyItMatters: 'Visitors judge a site in the first few seconds. Slow pages lose visitors and sales, and Google uses this speed in search rankings.',
  whoIsAffected: [MOBILE, ALL],
  steps: [
    'Shrink the largest image at the top of the page: resize it to the size it is displayed and save it as WebP or AVIF.',
    'Do not lazy-load the top image; mark it fetchpriority="high" instead.',
    'Remove or defer scripts in the <head> that the first screen does not need (chat widgets, extra analytics).',
    'If the server is slow to respond, turn on page caching or a CDN with your host.',
  ],
  example: { language: 'html', after: '<img src="/hero.webp" width="1200" height="600" fetchpriority="high" alt="…">' },
  owner: 'developer',
  effort: 'moderate',
};

const layoutShift: FixGuide = {
  summary: 'Content jumps around while the page loads, which makes people tap the wrong thing.',
  whyItMatters: 'Shifting layouts cause accidental clicks and are disorienting, especially for people using magnification. Google counts this in search rankings.',
  whoIsAffected: [ALL, 'People using screen magnification'],
  steps: [
    'Give every image and video a width and height (or a CSS aspect-ratio) so space is reserved before it loads.',
    'Reserve space for ads, embeds, and cookie banners instead of letting them push content down.',
    'Use font-display: swap with a similar fallback font so text does not reflow.',
  ],
  example: { language: 'html', before: '<img src="/team.jpg" alt="Our team">', after: '<img src="/team.jpg" width="800" height="533" alt="Our team">' },
  owner: 'developer',
  effort: 'moderate',
};

const heavyScripts: FixGuide = {
  summary: 'Scripts keep the browser busy for too long, so the page feels frozen when visitors try to tap or scroll.',
  whyItMatters: 'Unresponsive pages feel broken. Third-party scripts (chat, tracking, ads, page builders) are the usual cause.',
  whoIsAffected: [MOBILE],
  steps: [
    'List the third-party tools on the site and remove any you no longer use.',
    'Load the rest with defer or async, or only after the visitor interacts.',
    'Ask your developer to split large scripts so each page loads only what it needs.',
  ],
  example: { language: 'html', before: '<script src="/widget.js"></script>', after: '<script src="/widget.js" defer></script>' },
  owner: 'developer',
  effort: 'involved',
};

const renderBlocking: FixGuide = {
  ...heavyScripts,
  summary: 'Stylesheets or scripts in the page head delay the first paint, so visitors stare at a blank screen.',
  steps: [
    'Add defer to scripts that do not need to run before the page shows.',
    'Inline the small amount of CSS the first screen needs, and load the rest without blocking.',
    'Remove unused CSS and JavaScript files from the template.',
  ],
  effort: 'moderate',
};

const images: FixGuide = {
  summary: 'Images are larger than they need to be, which slows the page and uses visitors\' mobile data.',
  whyItMatters: 'Images are usually most of a page\'s weight. Shrinking them is the cheapest speed win.',
  whoIsAffected: [MOBILE],
  steps: [
    'Resize each image under "Where we found it" to roughly twice the size it is displayed at.',
    'Save as WebP or AVIF (most CMSs and image CDNs can do this automatically).',
    'Add loading="lazy" to images below the first screen.',
  ],
  example: { language: 'html', after: '<img src="/gallery-1.webp" width="600" height="400" loading="lazy" alt="…">' },
  owner: 'content',
  effort: 'quick',
};

const unusedCode: FixGuide = {
  ...heavyScripts,
  summary: 'The page downloads CSS or JavaScript it never uses.',
  steps: [
    'Remove plugins, themes, and libraries you no longer use.',
    'Ask your developer to load page-specific code only on the pages that need it.',
    'Turn on minification and tree-shaking in the build or your optimization plugin.',
  ],
  effort: 'moderate',
};

const serverSetup: FixGuide = {
  summary: 'The server responds slowly or does not compress and cache files.',
  whyItMatters: 'Every visit waits on the server first. Compression and caching are usually one setting with your host.',
  whoIsAffected: [ALL],
  steps: [
    'Turn on text compression (gzip or Brotli) with your host or CDN.',
    'Set long cache lifetimes (up to a year) only for files whose name changes when their content changes, such as app.3f9c2.js. Most build tools and CMSs do this automatically.',
    'For files that keep the same name when updated, use a short cache lifetime or revalidation (no-cache), or visitors may keep old versions after you publish.',
    'Turn on page caching or a CDN if the server itself is slow.',
  ],
  example: {
    language: 'http',
    after: '# /assets/app.3f9c2.js (versioned file name)\nCache-Control: public, max-age=31536000, immutable\n\n# /logo.png (same name on every update)\nCache-Control: public, max-age=86400, must-revalidate',
  },
  owner: 'hosting',
  effort: 'quick',
};

const domSize: FixGuide = {
  ...heavyScripts,
  summary: 'The page is built from a very large number of elements, which makes it slow to render and update.',
  steps: ['Simplify sections built with many nested page-builder blocks.', 'Paginate or load long lists on demand.'],
};

const fonts: FixGuide = {
  ...layoutShift,
  summary: 'Text stays invisible while custom fonts download.',
  steps: ['Add font-display: swap to your @font-face rules (or the "display=swap" option for Google Fonts).', 'Preload the one or two fonts used above the fold.'],
  example: { language: 'css', after: '@font-face { font-family: "Brand"; src: url(/brand.woff2) format("woff2"); font-display: swap; }' },
  effort: 'quick',
};

export const performanceGuides: Record<string, FixGuide> = {
  'largest-contentful-paint': slowMainContent,
  'first-contentful-paint': slowMainContent,
  'speed-index': slowMainContent,
  'largest-contentful-paint-element': slowMainContent,
  'lcp-lazy-loaded': slowMainContent,
  'prioritize-lcp-image': slowMainContent,
  'lcp-discovery-insight': slowMainContent,
  'lcp-phases-insight': slowMainContent,
  'cumulative-layout-shift': layoutShift,
  'layout-shifts': layoutShift,
  'layout-shift-elements': layoutShift,
  'unsized-images': layoutShift,
  'cls-culprits-insight': layoutShift,
  'total-blocking-time': heavyScripts,
  interactive: heavyScripts,
  'max-potential-fid': heavyScripts,
  'bootup-time': heavyScripts,
  'mainthread-work-breakdown': heavyScripts,
  'long-tasks': heavyScripts,
  'third-party-summary': heavyScripts,
  'third-parties-insight': heavyScripts,
  'forced-reflow-insight': heavyScripts,
  'render-blocking-resources': renderBlocking,
  'render-blocking-insight': renderBlocking,
  'network-dependency-tree-insight': renderBlocking,
  'critical-request-chains': renderBlocking,
  'uses-responsive-images': images,
  'offscreen-images': images,
  'uses-optimized-images': images,
  'modern-image-formats': images,
  'efficient-animated-content': images,
  'image-delivery-insight': images,
  'total-byte-weight': {
    ...images,
    summary: 'The page downloads too much data in total: images, scripts, styles, fonts, and video combined.',
    steps: [
      'Look at the files under "Where we found it"; they are the largest downloads. Start with the biggest, whatever type it is.',
      'Images: resize and convert to WebP or AVIF. Video: do not autoplay large files; use a poster image and load on click.',
      'Scripts and styles: remove unused plugins and third-party tools, and turn on minification.',
      'Fonts: use fewer weights and the woff2 format.',
    ],
    example: undefined,
    owner: 'developer',
    effort: 'moderate',
  },
  'unused-javascript': unusedCode,
  'unused-css-rules': unusedCode,
  'unminified-javascript': unusedCode,
  'unminified-css': unusedCode,
  'duplicated-javascript': unusedCode,
  'duplicated-javascript-insight': unusedCode,
  'legacy-javascript': unusedCode,
  'legacy-javascript-insight': unusedCode,
  'server-response-time': serverSetup,
  'document-latency-insight': serverSetup,
  'uses-text-compression': serverSetup,
  'uses-long-cache-ttl': serverSetup,
  'cache-insight': serverSetup,
  redirects: { ...serverSetup, summary: 'The page goes through one or more redirects before loading, adding delay.', steps: ['Link directly to the final URL.', 'Collapse redirect chains into a single 301 redirect.'] },
  'dom-size': domSize,
  'dom-size-insight': domSize,
  'font-display': fonts,
  'font-display-insight': fonts,
};
