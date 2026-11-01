import type { StandardRef, WcagLevel } from './types';

const CRITERIA: Record<string, { name: string; level: WcagLevel; slug: string }> = {
  '1.1.1': { name: 'Non-text Content', level: 'A', slug: 'non-text-content' },
  '1.2.2': { name: 'Captions (Prerecorded)', level: 'A', slug: 'captions-prerecorded' },
  '1.3.1': { name: 'Info and Relationships', level: 'A', slug: 'info-and-relationships' },
  '1.4.1': { name: 'Use of Color', level: 'A', slug: 'use-of-color' },
  '1.4.3': { name: 'Contrast (Minimum)', level: 'AA', slug: 'contrast-minimum' },
  '1.4.4': { name: 'Resize Text', level: 'AA', slug: 'resize-text' },
  '2.1.1': { name: 'Keyboard', level: 'A', slug: 'keyboard' },
  '2.2.1': { name: 'Timing Adjustable', level: 'A', slug: 'timing-adjustable' },
  '2.4.1': { name: 'Bypass Blocks', level: 'A', slug: 'bypass-blocks' },
  '2.4.2': { name: 'Page Titled', level: 'A', slug: 'page-titled' },
  '2.4.3': { name: 'Focus Order', level: 'A', slug: 'focus-order' },
  '2.4.4': { name: 'Link Purpose (In Context)', level: 'A', slug: 'link-purpose-in-context' },
  '2.4.9': { name: 'Link Purpose (Link Only)', level: 'AAA', slug: 'link-purpose-link-only' },
  '2.5.3': { name: 'Label in Name', level: 'A', slug: 'label-in-name' },
  '2.5.8': { name: 'Target Size (Minimum)', level: 'AA', slug: 'target-size-minimum' },
  '3.1.1': { name: 'Language of Page', level: 'A', slug: 'language-of-page' },
  '3.1.2': { name: 'Language of Parts', level: 'AA', slug: 'language-of-parts' },
  '4.1.2': { name: 'Name, Role, Value', level: 'A', slug: 'name-role-value' },
};

/** Resolve WCAG 2.2 criterion ids to names, levels, and W3C "Understanding" links. */
export function wcagRefs(ids: readonly string[] = []): StandardRef[] {
  return ids.flatMap((id) => {
    const c = CRITERIA[id];
    if (!c) return [];
    return [{ id, name: c.name, level: c.level, url: `https://www.w3.org/WAI/WCAG22/Understanding/${c.slug}.html` }];
  });
}
