/**
 * Browser-side checks for Monitor sites and pages. They mirror the database
 * (sites.origin check, monitor_page_url_valid) and the worker's
 * validateAuditUrl, so a site that passes here can be saved and scanned.
 */

export const MONITOR_PAGE_LIMIT = 25;
const MAX_URL_LENGTH = 2048;
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export type OriginResult = { ok: true; origin: string } | { ok: false; message: string };

/**
 * Accepts "shop.com", "https://shop.com" or a full page URL and returns the
 * lower-case https origin, or a message saying what is wrong.
 */
export function normalizeSiteOrigin(input: string): OriginResult {
  const raw = input.trim();
  if (!raw) return { ok: false, message: 'Enter your website address.' };
  if (/^http:\/\//i.test(raw)) {
    return { ok: false, message: 'Use the https:// address. Monitor scans secure sites only.' };
  }

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, message: 'That does not look like a website address.' };
  }

  const host = url.hostname.toLowerCase();
  const labels = host.split('.');
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    labels.length < 2 ||
    host.length > 253 ||
    labels.some((label) => !LABEL.test(label)) ||
    !/[a-z]/.test(labels[labels.length - 1]) ||
    host.endsWith('.localhost') ||
    host.includes('xn--')
  ) {
    return { ok: false, message: 'Enter a public website address, like example.com.' };
  }

  return { ok: true, origin: `https://${host}` };
}

export interface PageListResult {
  urls: string[];
  /** One message per line that could not be used, in input order. */
  errors: string[];
}

/**
 * Turns one-per-line input into page URLs on `origin`. Lines may be full URLs
 * or paths ("/pricing"). Duplicates are dropped; fragments are removed.
 */
export function parsePageList(origin: string, text: string, existingCount = 0): PageListResult {
  const urls: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry) continue;

    let url: URL;
    try {
      url = new URL(entry.startsWith('/') ? `${origin}${entry}` : /^[a-z]+:\/\//i.test(entry) ? entry : `https://${entry}`);
    } catch {
      errors.push(`"${entry}" is not a page address.`);
      continue;
    }

    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    const value = url.toString();
    if (url.protocol !== 'https:' || url.origin !== origin) {
      errors.push(`"${entry}" is not on ${origin}.`);
      continue;
    }
    if (value.length > MAX_URL_LENGTH || /\s/.test(value)) {
      errors.push(`"${entry}" is too long.`);
      continue;
    }
    if (seen.has(value)) continue;
    seen.add(value);
    urls.push(value);
  }

  if (existingCount + urls.length > MONITOR_PAGE_LIMIT) {
    errors.push(`A site can have up to ${MONITOR_PAGE_LIMIT} pages.`);
  }

  return { urls, errors };
}

/** Path shown in tables: "/" for the home page, otherwise path and query. */
export function pagePath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || '/';
  } catch {
    return url;
  }
}
