import fontUrl from '../../assets/fonts/dmsans-variablefont_opsz,wght.ttf?url';
import logoUrl from '../../assets/images/logo-univia.svg';
import type { ReportDocument } from './reportModel';
import { renderReport } from './renderReport';
import { buildReportStyles } from './reportStyles';

const ASSET_TIMEOUT_MS = 4000;
/** Safety net for browsers that never fire `afterprint`; long enough to outlast an open dialog. */
const CLEANUP_FALLBACK_MS = 5 * 60_000;

function withTimeout(promise: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    promise.finally(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
}

function imagesSettled(doc: Document): Promise<unknown> {
  const pending = Array.from(doc.images)
    .filter((image) => !image.complete)
    .map(
      (image) =>
        new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        }),
    );
  return Promise.all(pending);
}

function createFrame(): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.title = 'Report print preview';
  // Off-screen but laid out: display:none frames cannot print in every browser.
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0', visibility: 'hidden' });
  document.body.appendChild(frame);
  return frame;
}

/**
 * Render the report into a hidden iframe and open the browser print dialog,
 * where "Save as PDF" produces a tagged PDF with selectable text and links.
 * Resolves once the dialog has been opened (or the frame failed).
 */
export async function printReport(report: ReportDocument): Promise<void> {
  const frame = createFrame();
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc) {
    frame.remove();
    throw new Error('Unable to prepare the report for printing.');
  }

  const style = doc.createElement('style');
  style.textContent = buildReportStyles(fontUrl);
  doc.head.replaceChildren(doc.createElement('meta'), style);
  doc.head.firstElementChild?.setAttribute('charset', 'utf-8');
  renderReport(doc, report, { logoUrl });

  await withTimeout(Promise.all([doc.fonts?.ready, imagesSettled(doc)]), ASSET_TIMEOUT_MS);

  // Chromium names the PDF after the top-level title in some versions, so mirror it there too.
  const previousTitle = document.title;
  document.title = report.fileName;

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.title = previousTitle;
    frame.remove();
  };
  win.addEventListener('afterprint', () => window.setTimeout(cleanup, 0), { once: true });
  window.setTimeout(cleanup, CLEANUP_FALLBACK_MS);

  win.focus();
  win.print();
}
