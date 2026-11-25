// Builds the scan alert email: one summary per run, HTML and plain text.
// Pure, so it is tested without a network. Everything from the database is
// escaped before it goes into HTML.

export type AlertEventKind = 'detected' | 'reopened' | 'fix_not_confirmed';

export interface AlertEvent {
  kind: AlertEventKind;
  title: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  url: string;
}

export interface AlertPayload {
  site_id: string;
  site_name: string;
  origin: string;
  trigger: 'initial' | 'scheduled' | 'manual';
  completed_at: string | null;
  pages_total: number;
  pages_failed: number;
  open_issues: number;
  resolved_issues: number;
  unsubscribe_token: string;
  events: AlertEvent[];
}

export interface AlertLinks {
  appUrl: string;
  /** The app page that asks before unsubscribing (safe for link scanners). */
  unsubscribePageUrl: string;
  /** The function URL for RFC 8058 one-click unsubscribe. */
  oneClickUrl: string;
}

export interface AlertEmail {
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

export const EVENT_CAP = 15;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

const LABEL: Record<AlertEventKind, string> = {
  detected: 'New',
  reopened: 'Back again',
  fix_not_confirmed: 'Fix not confirmed',
};

function pagePath(url: string, origin: string): string {
  return url.startsWith(origin) ? url.slice(origin.length) || '/' : url;
}

/** Counts per kind, for the subject and the summary line. */
export function countEvents(events: AlertEvent[]): Record<AlertEventKind, number> {
  const counts: Record<AlertEventKind, number> = { detected: 0, reopened: 0, fix_not_confirmed: 0 };
  for (const event of events) counts[event.kind] += 1;
  return counts;
}

function summaryParts(counts: Record<AlertEventKind, number>): string[] {
  const parts: string[] = [];
  if (counts.detected) parts.push(plural(counts.detected, 'new issue', 'new issues'));
  if (counts.reopened) parts.push(plural(counts.reopened, 'issue back again', 'issues back again'));
  if (counts.fix_not_confirmed) parts.push(plural(counts.fix_not_confirmed, 'fix not confirmed', 'fixes not confirmed'));
  return parts;
}

export function buildAlertEmail(payload: AlertPayload, links: AlertLinks): AlertEmail {
  const counts = countEvents(payload.events);
  const parts = summaryParts(counts);
  const site = payload.site_name;
  const subject = payload.trigger === 'initial'
    ? `First scan of ${site}: ${plural(payload.events.length, 'issue', 'issues')} found`
    : `${site}: ${parts.join(', ')}`;

  const intro = payload.trigger === 'initial'
    ? `The first scan of ${payload.origin} finished. It checked ${plural(payload.pages_total, 'page', 'pages')} and found ${plural(payload.events.length, 'issue', 'issues')}.`
    : `This week's scan of ${payload.origin} found ${parts.join(', ')}. ${plural(payload.open_issues, 'issue is', 'issues are')} open in total.`;
  const failedNote = payload.pages_failed
    ? ` ${plural(payload.pages_failed, 'page', 'pages')} could not be scanned this time.`
    : '';

  const shown = payload.events.slice(0, EVENT_CAP);
  const rest = payload.events.length - shown.length;
  const monitorUrl = `${links.appUrl}/monitor?site=${encodeURIComponent(payload.site_id)}`;
  const disclaimer = 'Automated checks find some accessibility issues, not all of them. This is not a legal or compliance determination.';

  const textLines = [
    intro + failedNote,
    '',
    ...shown.map((event) => `- ${LABEL[event.kind]} (${event.severity}): ${event.title} on ${pagePath(event.url, payload.origin)}`),
    ...(rest > 0 ? [`- and ${rest} more`] : []),
    '',
    `See every issue and how to fix it: ${monitorUrl}`,
    '',
    disclaimer,
    '',
    `You get this email because Monitor alerts are on for ${site}. Turn them off: ${links.unsubscribePageUrl}`,
  ];

  const row = (event: AlertEvent): string => `
      <tr>
        <td style="padding:8px 12px 8px 0;vertical-align:top;white-space:nowrap;font-size:13px;color:#555">${escapeHtml(LABEL[event.kind])}<br>${escapeHtml(event.severity)}</td>
        <td style="padding:8px 0;vertical-align:top;font-size:14px;color:#111">${escapeHtml(event.title)}<br><span style="color:#555;font-size:13px">${escapeHtml(pagePath(event.url, payload.origin))}</span></td>
      </tr>`;

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111">
  <main style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e2e2;border-radius:12px;padding:24px">
    <h1 style="font-size:20px;line-height:1.3;margin:0 0 12px">${escapeHtml(subject)}</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">${escapeHtml(intro + failedNote)}</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 16px">${shown.map(row).join('')}
    </table>
    ${rest > 0 ? `<p style="font-size:14px;margin:0 0 16px">And ${rest} more.</p>` : ''}
    <p style="margin:0 0 24px"><a href="${escapeHtml(monitorUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:16px;font-size:15px">See issues and how to fix them</a></p>
    <p style="font-size:13px;line-height:1.5;color:#555;margin:0 0 12px">${escapeHtml(disclaimer)}</p>
    <p style="font-size:13px;line-height:1.5;color:#555;margin:0">You get this email because Monitor alerts are on for ${escapeHtml(site)}. <a href="${escapeHtml(links.unsubscribePageUrl)}" style="color:#555">Turn off alerts</a>.</p>
  </main>
</body>
</html>
`;

  return {
    subject,
    html,
    text: textLines.join('\n') + '\n',
    headers: {
      'List-Unsubscribe': `<${links.oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

/** Narrows the RPC's payload; returns null if it is not shaped as expected. */
export function parseAlertPayload(value: unknown): AlertPayload | null {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Partial<AlertPayload>;
  if (
    typeof payload.site_id !== 'string' ||
    typeof payload.site_name !== 'string' ||
    typeof payload.origin !== 'string' ||
    typeof payload.unsubscribe_token !== 'string' ||
    !Array.isArray(payload.events) ||
    payload.events.length === 0
  ) {
    return null;
  }
  return {
    site_id: payload.site_id,
    site_name: payload.site_name,
    origin: payload.origin,
    trigger: payload.trigger === 'initial' || payload.trigger === 'manual' ? payload.trigger : 'scheduled',
    completed_at: typeof payload.completed_at === 'string' ? payload.completed_at : null,
    pages_total: Number(payload.pages_total) || 0,
    pages_failed: Number(payload.pages_failed) || 0,
    open_issues: Number(payload.open_issues) || 0,
    resolved_issues: Number(payload.resolved_issues) || 0,
    unsubscribe_token: payload.unsubscribe_token,
    events: payload.events.filter(
      (event): event is AlertEvent =>
        Boolean(event) &&
        (event.kind === 'detected' || event.kind === 'reopened' || event.kind === 'fix_not_confirmed') &&
        typeof event.title === 'string' &&
        typeof event.url === 'string' &&
        ['critical', 'serious', 'moderate', 'minor'].includes(event.severity),
    ),
  };
}
