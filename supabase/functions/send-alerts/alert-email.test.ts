import { describe, expect, it } from 'vitest';
import { buildAlertEmail, EVENT_CAP, parseAlertPayload, type AlertPayload } from './alert-email';

const links = {
  appUrl: 'https://univia.help',
  unsubscribePageUrl: 'https://univia.help/unsubscribe?token=t',
  oneClickUrl: 'https://x.supabase.co/functions/v1/email-unsubscribe?token=t',
};

const payload = (overrides: Partial<AlertPayload> = {}): AlertPayload => ({
  site_id: 's1',
  site_name: 'Corner Bakery',
  origin: 'https://bakery.example.com',
  trigger: 'scheduled',
  completed_at: '2026-11-20T15:00:00Z',
  pages_total: 4,
  pages_failed: 0,
  open_issues: 6,
  resolved_issues: 1,
  unsubscribe_token: 't',
  events: [
    { kind: 'detected', title: 'Images need alt text', severity: 'critical', url: 'https://bakery.example.com/menu' },
    { kind: 'detected', title: 'Low contrast', severity: 'serious', url: 'https://bakery.example.com/' },
    { kind: 'reopened', title: 'Missing labels', severity: 'critical', url: 'https://bakery.example.com/order' },
    { kind: 'fix_not_confirmed', title: 'Empty links', severity: 'moderate', url: 'https://bakery.example.com/' },
  ],
  ...overrides,
});

describe('buildAlertEmail', () => {
  it('summarizes a weekly run by kind in the subject and body', () => {
    const email = buildAlertEmail(payload(), links);
    expect(email.subject).toBe('Corner Bakery: 2 new issues, 1 issue back again, 1 fix not confirmed');
    expect(email.text).toContain("This week's scan of https://bakery.example.com found 2 new issues");
    expect(email.text).toContain('6 issues are open in total.');
    expect(email.text).toContain('- New (critical): Images need alt text on /menu');
    expect(email.text).toContain('- Fix not confirmed (moderate): Empty links on /');
    expect(email.text).toContain('https://univia.help/monitor?site=s1');
    expect(email.text).toContain('Turn them off: https://univia.help/unsubscribe?token=t');
  });

  it('words the first scan differently', () => {
    const email = buildAlertEmail(payload({ trigger: 'initial' }), links);
    expect(email.subject).toBe('First scan of Corner Bakery: 4 issues found');
    expect(email.text).toContain('checked 4 pages and found 4 issues');
  });

  it('mentions pages that could not be scanned', () => {
    expect(buildAlertEmail(payload({ pages_failed: 1 }), links).text).toContain('1 page could not be scanned this time.');
  });

  it('caps the list and counts the rest', () => {
    const events = Array.from({ length: EVENT_CAP + 2 }, (_, index) => ({
      kind: 'detected' as const, title: `Rule ${index}`, severity: 'minor' as const, url: 'https://bakery.example.com/',
    }));
    const email = buildAlertEmail(payload({ events }), links);
    expect(email.text).toContain('- and 2 more');
    expect(email.html).toContain('And 2 more.');
  });

  it('escapes database text in HTML and sets one-click unsubscribe headers', () => {
    const email = buildAlertEmail(payload({ site_name: '<b>Shop</b>', events: [
      { kind: 'detected', title: '<script>x</script>', severity: 'serious', url: 'https://bakery.example.com/' },
    ] }), links);
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(email.html).toContain('&lt;b&gt;Shop&lt;/b&gt;');
    expect(email.headers['List-Unsubscribe']).toBe(`<${links.oneClickUrl}>`);
    expect(email.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });

  it('makes no compliance claims', () => {
    const text = buildAlertEmail(payload(), links).text.toLowerCase();
    expect(text).toContain('not a legal or compliance determination');
    expect(text.replace('not a legal or compliance determination', '')).not.toMatch(/complian|conform/);
  });
});

describe('parseAlertPayload', () => {
  it('accepts the RPC shape and drops malformed events', () => {
    const parsed = parseAlertPayload({ ...payload(), events: [...payload().events, { kind: 'other', title: 'x', severity: 'minor', url: 'u' }] });
    expect(parsed?.events).toHaveLength(4);
  });

  it('rejects payloads with no events or missing fields', () => {
    expect(parseAlertPayload({ ...payload(), events: [] })).toBeNull();
    expect(parseAlertPayload({ ...payload(), site_id: undefined })).toBeNull();
    expect(parseAlertPayload(null)).toBeNull();
  });
});
