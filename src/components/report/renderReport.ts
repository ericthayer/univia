import type {
  ReportBlock,
  ReportDocument,
  ReportHowToFix,
  ReportIssue,
  ReportLink,
  ReportPill,
  ReportSection,
  RichText,
} from './reportModel';
import { safeHref } from './inlineMarkdown';

/**
 * Pure DOM renderer for a `ReportDocument`. Uses createElement + textContent
 * only, because report text comes from Lighthouse and AI output (untrusted).
 */

type Attrs = Record<string, string | undefined>;

export interface RenderAssets {
  logoUrl?: string;
  generatedAt?: Date;
}

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string | null | undefined> = [],
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(typeof child === 'string' ? doc.createTextNode(child) : child);
  }
  return node;
}

function link(doc: Document, text: string, href: string): Node {
  const url = safeHref(href);
  return url ? el(doc, 'a', { href: url }, [text]) : doc.createTextNode(text);
}

function rich(doc: Document, text: RichText): Node[] {
  if (typeof text === 'string') return [doc.createTextNode(text)];
  return text.map((segment) => {
    if (segment.kind === 'link') return link(doc, segment.text, segment.href);
    if (segment.kind === 'code') return el(doc, 'code', {}, [segment.text]);
    return doc.createTextNode(segment.text);
  });
}

function pill(doc: Document, item: ReportPill, dot = false): HTMLElement {
  return el(
    doc,
    'li',
    { class: 'pill', 'data-tone': item.tone ?? 'neutral', 'data-variant': item.variant ?? 'tonal', 'data-dot': dot ? '' : undefined, 'data-free': item.freeText ? '' : undefined },
    [item.text],
  );
}

function pills(doc: Document, items: ReportPill[], dot = false): HTMLElement {
  return el(doc, 'ul', { class: 'pills' }, items.map((item) => pill(doc, item, dot)));
}

function linkList(doc: Document, items: ReportLink[]): HTMLElement {
  return el(doc, 'ul', { class: 'list' }, items.map((item) => el(doc, 'li', {}, [link(doc, item.label, item.url)])));
}

function howToFix(doc: Document, fix: ReportHowToFix): HTMLElement {
  const box = el(doc, 'div', { class: 'fix' }, [el(doc, 'span', { class: 'eyebrow' }, ['How to fix'])]);
  if (fix.summary) box.append(el(doc, 'p', {}, [fix.summary]));
  if (fix.whyItMatters) box.append(el(doc, 'p', {}, [el(doc, 'strong', {}, ['Why it matters: ']), fix.whyItMatters]));
  if (fix.whoIsAffected?.length) {
    box.append(el(doc, 'p', { class: 'muted' }, [`Who is affected: ${fix.whoIsAffected.join(', ')}`]));
  }
  if (fix.steps.length) {
    box.append(el(doc, 'ol', { class: 'list' }, fix.steps.map((step) => el(doc, 'li', {}, rich(doc, step)))));
  } else if (!fix.summary) {
    const hint = fix.instances?.length
      ? 'Review the guideline linked in the description, then resolve each item found on this page.'
      : 'Review the guideline linked in the description for remediation guidance.';
    box.append(el(doc, 'p', { class: 'muted' }, [hint]));
  }
  if (fix.example) {
    const { before, after, note, language } = fix.example;
    const label = language ? ` (${language})` : '';
    if (before) box.append(el(doc, 'p', { class: 'eyebrow' }, [`Before${label}`]), el(doc, 'pre', { class: 'code' }, [before]));
    box.append(el(doc, 'p', { class: 'eyebrow' }, [`${before ? 'After' : 'Example'}${label}`]), el(doc, 'pre', { class: 'code' }, [after]));
    if (note) box.append(el(doc, 'p', { class: 'muted' }, [note]));
  }
  if (fix.instances?.length) {
    box.append(
      el(doc, 'p', { class: 'eyebrow' }, ['Found on this page']),
      el(doc, 'ul', { class: 'list' }, fix.instances.map((item) => el(doc, 'li', { class: 'code' }, [item]))),
    );
  }
  if (fix.standards?.length) box.append(el(doc, 'p', { class: 'eyebrow' }, ['Standards']), linkList(doc, fix.standards));
  if (fix.resources?.length) box.append(el(doc, 'p', { class: 'eyebrow' }, ['Learn more']), linkList(doc, fix.resources));
  return box;
}

function issue(doc: Document, item: ReportIssue, headingLevel: 3 | 4): HTMLElement {
  const row = el(doc, 'li', { class: 'issue' }, [
    el(doc, 'div', { class: 'issue-head' }, [
      el(doc, headingLevel === 4 ? 'h4' : 'h3', {}, rich(doc, item.title)),
      pills(doc, [{ text: item.severity, tone: item.tone }], true),
    ]),
    pills(doc, item.tags.map((text) => ({ text, variant: 'outline' as const }))),
  ]);
  if (item.description) row.append(el(doc, 'p', { class: 'desc' }, rich(doc, item.description)));
  if (item.selector) row.append(el(doc, 'code', { class: 'selector' }, [`Selector: ${item.selector}`]));
  row.append(howToFix(doc, item.howToFix));
  return row;
}

function block(doc: Document, item: ReportBlock): HTMLElement {
  switch (item.kind) {
    case 'paragraph':
      return el(doc, 'p', { class: item.muted ? 'para muted' : 'para' }, rich(doc, item.text));
    case 'subheading':
      return el(doc, 'div', { class: 'subheading' }, [
        el(doc, 'h3', {}, [item.text]),
        item.meta ? el(doc, 'span', { class: 'muted num' }, [item.meta]) : null,
      ]);
    case 'facts':
      return el(
        doc,
        'dl',
        { class: 'facts' },
        item.items.map((fact) =>
          el(doc, 'div', { class: fact.wide ? 'wide' : undefined }, [
            el(doc, 'dt', {}, [
              el(doc, 'span', { class: 'eyebrow' }, [fact.label]),
              fact.note ? el(doc, 'span', { class: 'pill', 'data-variant': 'outline' }, [fact.note]) : null,
            ]),
            el(doc, 'dd', { class: 'value', 'data-tone': fact.tone }, rich(doc, fact.value)),
          ]),
        ),
      );
    case 'list':
      return el(doc, item.ordered ? 'ol' : 'ul', { class: 'list' }, item.items.map((entry) => el(doc, 'li', {}, rich(doc, entry))));
    case 'pills':
      return el(doc, 'div', { class: 'pill-group' }, [
        item.label ? el(doc, 'p', { class: 'eyebrow pills-label' }, [item.label]) : null,
        pills(doc, item.items),
      ]);
    case 'table':
      return el(doc, 'table', {}, [
        el(doc, 'caption', { class: 'eyebrow' }, [item.caption]),
        el(doc, 'thead', {}, [el(doc, 'tr', {}, item.columns.map((column, index) => el(doc, 'th', { scope: index === 0 ? undefined : 'col' }, [column])))]),
        el(
          doc,
          'tbody',
          {},
          item.rows.map((row) =>
            el(doc, 'tr', {}, [
              el(doc, 'th', { scope: 'row' }, [row.header]),
              ...row.cells.map((cell) =>
                el(doc, 'td', { 'data-tone': cell.tone }, [
                  el(doc, 'span', { class: 'value num', 'data-tone': cell.tone }, [cell.text]),
                  cell.meter === undefined
                    ? null
                    : el(doc, 'span', { class: 'meter', 'aria-hidden': 'true' }, [
                        el(doc, 'span', { style: `width:${Math.max(0, Math.min(100, cell.meter))}%` }),
                      ]),
                ]),
              ),
            ]),
          ),
        ),
      ]);
    case 'callout':
      return el(doc, 'aside', { class: 'callout', role: 'note' }, [
        el(doc, 'span', { class: 'mark', 'data-tone': item.tone, 'aria-hidden': 'true' }),
        el(doc, 'div', {}, [el(doc, 'p', {}, [el(doc, 'strong', {}, [item.title])]), el(doc, 'p', { class: 'muted' }, [item.text])]),
      ]);
    case 'image': {
      const src = safeHref(item.src) ?? (item.src.startsWith('data:image/') ? item.src : null);
      return el(doc, 'figure', {}, [
        src ? el(doc, 'img', { src, alt: item.alt }) : null,
        item.caption ? el(doc, 'figcaption', { class: 'muted' }, [item.caption]) : null,
      ]);
    }
    case 'issues':
      return el(doc, 'ul', { class: 'issues' }, item.items.map((entry) => issue(doc, entry, item.headingLevel ?? 3)));
  }
}

function section(doc: Document, item: ReportSection): HTMLElement {
  const headingId = `section-${item.id}`;
  return el(doc, 'section', { class: item.pageBreakBefore ? 'card break' : 'card', 'aria-labelledby': headingId }, [
    el(doc, 'header', {}, [
      el(doc, 'h2', { id: headingId }, [item.title]),
      item.meta ? el(doc, 'span', { class: 'muted num' }, [item.meta]) : null,
    ]),
    ...item.blocks.map((entry) => el(doc, 'div', { class: 'block' }, [block(doc, entry)])),
  ]);
}

/** Replace `doc.body` content with the rendered report and set the document title. */
export function renderReport(doc: Document, report: ReportDocument, assets: RenderAssets = {}): void {
  const generatedAt = assets.generatedAt ?? new Date();
  doc.title = report.fileName;
  doc.documentElement.lang = 'en';

  const subject =
    typeof report.subject === 'string'
      ? doc.createTextNode(report.subject)
      : report.subject
        ? link(doc, report.subject.label, report.subject.url)
        : null;

  const main = el(doc, 'main', {}, [
    el(doc, 'header', { class: 'masthead' }, [
      assets.logoUrl ? el(doc, 'img', { src: assets.logoUrl, alt: 'Univia' }) : el(doc, 'strong', {}, ['Univia']),
      el(doc, 'p', { class: 'stamp muted' }, [`Generated ${generatedAt.toLocaleString()}`]),
    ]),
    el(doc, 'div', { class: 'title-block' }, [
      el(doc, 'p', { class: 'eyebrow' }, [report.eyebrow]),
      el(doc, 'h1', {}, [report.title]),
      subject ? el(doc, 'p', { class: 'subject' }, [subject]) : null,
      report.badges?.length ? pills(doc, report.badges, true) : null,
      report.meta.length
        ? el(
            doc,
            'dl',
            { class: 'meta' },
            report.meta.map((entry) =>
              el(doc, 'div', {}, [el(doc, 'dt', { class: 'eyebrow' }, [entry.label]), el(doc, 'dd', { class: 'num' }, [entry.value])]),
            ),
          )
        : null,
    ]),
    ...report.sections.map((entry) => section(doc, entry)),
    report.footerNote ? el(doc, 'footer', { class: 'closing muted' }, [report.footerNote]) : null,
  ]);

  doc.body.replaceChildren(main);
}
