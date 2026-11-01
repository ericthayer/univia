import type { FixGuide } from './types';

const ALL = 'All visitors';

const consoleErrors: FixGuide = {
  summary: 'The browser reported errors while loading the page. Something on the page failed: a file, a script, or an embedded widget.',
  whyItMatters:
    'Each error usually means a visible problem: a missing image, a broken form, a blank embed, or a script that stopped running. Broken scripts often take menus, cookie banners, and accessibility widgets down with them.',
  whoIsAffected: [ALL, 'Assistive technology users, when the failing script powers keyboard or screen reader support'],
  steps: [
    'Read the plain-language explanation next to each error under "Where we found it". It names the most likely cause.',
    'Open the page in Chrome, press F12 (or Cmd+Option+J on Mac), and open the Console tab to see the same errors with the file that caused each one.',
    'Fix or remove what the error points to: restore missing files, update or remove broken third-party widgets, replace embeds that refuse to load.',
    'Reload the page and confirm the Console is clean, then run the audit again.',
  ],
  owner: 'developer',
  effort: 'moderate',
};

const https: FixGuide = {
  summary: 'The page, or something it loads, is not served over a secure (https) connection.',
  whyItMatters: 'Browsers mark http pages as "Not secure", block some features, and may block insecure images and scripts on secure pages. Visitors lose trust, and search rankings drop.',
  whoIsAffected: [ALL],
  steps: [
    'Turn on HTTPS with your host. Most hosts (Netlify, Shopify, Squarespace, WordPress hosts) offer a free certificate with one switch.',
    'Redirect every http address to https.',
    'Change any http:// links to images, scripts, and fonts in your pages and theme to https://.',
  ],
  owner: 'hosting',
  effort: 'quick',
};

const securityHeaders: FixGuide = {
  summary: 'The site is missing a recommended security header that protects visitors against common attacks.',
  whyItMatters: 'Headers such as Content-Security-Policy, Strict-Transport-Security, and frame protection stop injected scripts, downgrade attacks, and clickjacking. They are invisible to visitors but expected by security reviews.',
  whoIsAffected: [ALL],
  steps: [
    'Ask your developer or host to add the header named in this issue. Most hosts let you set headers in a config file (netlify.toml, _headers, .htaccess, or nginx config).',
    'Start a Content-Security-Policy in report-only mode first, so nothing breaks while you tune it.',
    'Re-run the audit to confirm.',
  ],
  example: {
    language: 'http',
    after: 'Strict-Transport-Security: max-age=31536000; includeSubDomains\nX-Frame-Options: SAMEORIGIN\nContent-Security-Policy-Report-Only: default-src \'self\'',
  },
  owner: 'hosting',
  effort: 'moderate',
};

const deprecations: FixGuide = {
  summary: 'The page uses browser features that are being removed. They work today but will break in a future browser update.',
  whyItMatters: 'When the browser drops the feature, whatever depends on it stops working, often without warning.',
  whoIsAffected: [ALL],
  steps: [
    'Look at the messages under "Where we found it"; each names the feature and usually the replacement.',
    'Update the plugin, theme, or library that uses it. Most deprecations come from outdated third-party code.',
  ],
  owner: 'developer',
  effort: 'moderate',
};

const imageSizing: FixGuide = {
  summary: 'Some images are stretched, squashed, or blurry because they are shown at a different size or shape than the file.',
  whyItMatters: 'Distorted or blurry product and team photos look unprofessional and can hide details.',
  whoIsAffected: [ALL],
  steps: [
    'Find the images under "Where we found it".',
    'Upload images at roughly twice the size they are shown (for sharp screens) and in the same shape (aspect ratio).',
    'If the shape must differ, crop the image, or use object-fit: cover in CSS instead of stretching it.',
  ],
  example: { language: 'css', after: '.card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }' },
  owner: 'content',
  effort: 'quick',
};

const pasteBlocked: FixGuide = {
  summary: 'Some fields stop visitors from pasting into them.',
  whyItMatters: 'Blocking paste breaks password managers and forces people with motor or memory disabilities to type long values by hand. It also weakens security.',
  whoIsAffected: ['People who use password managers', 'People with motor or cognitive disabilities'],
  steps: ['Find the fields under "Where we found it".', 'Remove the script that cancels the paste event.'],
  owner: 'developer',
  effort: 'quick',
};

const doctype: FixGuide = {
  summary: 'The page is missing basic declarations (doctype or character encoding), so browsers fall back to old "quirks" behavior.',
  whyItMatters: 'Layout and text can render inconsistently between browsers, and special characters may show as garbage.',
  whoIsAffected: [ALL],
  steps: ['Make sure the first line of the HTML is <!doctype html>.', 'Add <meta charset="utf-8"> as the first element inside <head>.'],
  example: { language: 'html', after: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">' },
  owner: 'developer',
  effort: 'quick',
};

const thirdPartyCookies: FixGuide = {
  summary: 'The page relies on third-party cookies, which browsers are restricting.',
  whyItMatters: 'Embeds, chat widgets, or analytics that depend on them may stop working or stop tracking.',
  whoIsAffected: [ALL],
  steps: ['Identify which service sets each cookie (listed under "Where we found it").', 'Update that service to its latest version or ask the vendor about their cookie-less option.'],
  owner: 'developer',
  effort: 'moderate',
};

const browserIssues: FixGuide = {
  ...deprecations,
  summary: 'The browser flagged issues with how the page is built (security, cookies, or mixed content).',
  steps: ['Open Chrome DevTools (F12) and the Issues tab to see each issue with an explanation.', 'Fix the code or update the plugin each one points to.'],
};

export const bestPracticeGuides: Record<string, FixGuide> = {
  'errors-in-console': consoleErrors,
  'is-on-https': https,
  'redirects-http': https,
  'csp-xss': securityHeaders,
  'has-hsts': securityHeaders,
  'origin-isolation': securityHeaders,
  'clickjacking-mitigation': securityHeaders,
  deprecations,
  'image-aspect-ratio': imageSizing,
  'image-size-responsive': imageSizing,
  'paste-preventing-inputs': pasteBlocked,
  doctype,
  charset: doctype,
  'third-party-cookies': thirdPartyCookies,
  'inspector-issues': browserIssues,
  'valid-source-maps': {
    ...deprecations,
    summary: 'Large scripts are shipped without source maps, which makes errors harder for your developer to trace.',
    steps: ['Ask your developer to enable source maps in the build settings.'],
    effort: 'quick',
  },
  'geolocation-on-start': {
    ...pasteBlocked,
    summary: 'The page asks for the visitor\'s location as soon as it loads.',
    whyItMatters: 'Unexpected permission pop-ups feel intrusive and are often denied. Ask only after the visitor chooses a feature that needs it.',
    whoIsAffected: [ALL],
    steps: ['Only request location after a visitor clicks something like "Find a store near me".'],
  },
  'notification-on-start': {
    ...pasteBlocked,
    summary: 'The page asks to send notifications as soon as it loads.',
    whyItMatters: 'Unprompted requests are usually denied and annoy visitors.',
    whoIsAffected: [ALL],
    steps: ['Ask only after a visitor opts in, for example from a "Get updates" button.'],
  },
};
