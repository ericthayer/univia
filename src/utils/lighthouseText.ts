import type { AuditInstance, ResourceLink } from '../config/fixGuides/types';

export interface ParsedDescription {
  /** Description with markdown links and "Learn more" sentences removed. */
  text: string;
  links: ResourceLink[];
}

const MD_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

/**
 * Lighthouse descriptions are markdown: `Text. [Learn more about X](https://…)`.
 * Pull the links out so the UI can render them as real anchors and keep the
 * prose free of raw URLs. Inline backticks are dropped; the prose stays readable.
 */
export function parseLighthouseDescription(description: string | undefined | null): ParsedDescription {
  if (!description) return { text: '', links: [] };
  const links: ResourceLink[] = [];
  const text = description
    .replace(MD_LINK, (_match, label: string, url: string) => {
      links.push({ label: label.trim(), url });
      return '';
    })
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, links };
}

/** Undo the JSON wrapping some rows were stored with. */
export function toStepText(step: unknown): string {
  if (typeof step === 'string') {
    try {
      const parsed: unknown = JSON.parse(step);
      if (typeof parsed === 'string') return parsed;
      if (parsed && typeof parsed === 'object') return objectText(parsed as Record<string, unknown>);
      return step;
    } catch {
      return step;
    }
  }
  if (typeof step === 'object' && step !== null) return objectText(step as Record<string, unknown>);
  return String(step);
}

function objectText(obj: Record<string, unknown>): string {
  if (typeof obj.value === 'string') return obj.value;
  if (typeof obj.url === 'string') return obj.url;
  return JSON.stringify(obj, null, 2);
}

/**
 * The audit function stores up to five items per rule, prefixed by type:
 * `Element: <img …>`, `Resource: https://…`, or a raw message (console errors).
 */
export function parseInstance(step: unknown): AuditInstance {
  const text = toStepText(step).trim();
  if (text.startsWith('Element: ')) return { kind: 'element', text: text.slice(9) };
  if (text.startsWith('Resource: ')) return { kind: 'resource', text: text.slice(10) };
  return { kind: 'message', text };
}
