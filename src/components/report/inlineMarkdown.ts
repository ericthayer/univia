import type { InlineSegment, RichText } from './reportModel';

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;

/** Only absolute web links survive; anything else (javascript:, data:, relative) stays text. */
export function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Parse the small markdown subset Lighthouse and the AI models emit
 * (`[text](url)` and `code`) into inline segments. Everything else is text.
 */
export function parseInlineMarkdown(input: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let last = 0;
  for (const match of input.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ kind: 'text', text: input.slice(last, index) });
    const [whole, linkText, linkUrl, code] = match;
    if (code !== undefined) {
      segments.push({ kind: 'code', text: code });
    } else {
      const href = safeHref(linkUrl);
      segments.push(href ? { kind: 'link', text: linkText, href } : { kind: 'text', text: whole });
    }
    last = index + whole.length;
  }
  if (last < input.length) segments.push({ kind: 'text', text: input.slice(last) });
  return segments;
}

/** Flatten rich text to a plain string (used for titles and tests). */
export function richTextToString(text: RichText): string {
  if (typeof text === 'string') return text;
  return text.map((segment) => segment.text).join('');
}
