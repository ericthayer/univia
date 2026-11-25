import { supabase } from './supabaseClient';

/**
 * Monitor sites, scans and issues. Reads go through owner-only RLS; every write
 * is a SECURITY DEFINER function (supabase/migrations/20261108140000_monitor_sites_and_scans.sql).
 */

export type ScanRunStatus = 'queued' | 'running' | 'completed' | 'failed';
export type ScanTrigger = 'initial' | 'scheduled' | 'manual' | 'recheck';
export type PageResultStatus = 'pending' | 'running' | 'succeeded' | 'failed';
export type IssueState = 'open' | 'marked_fixed' | 'resolved';
export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface MonitorSite {
  id: string;
  name: string;
  origin: string;
  paused: boolean;
  created_at: string;
}

export interface MonitorPage {
  id: string;
  url: string;
  created_at: string;
}

export interface ScanRun {
  id: string;
  trigger: ScanTrigger;
  status: ScanRunStatus;
  pages_total: number;
  pages_succeeded: number;
  pages_failed: number;
  new_issues: number;
  resolved_issues: number;
  open_issues: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface PageResult {
  id: string;
  page_id: string;
  url: string;
  status: PageResultStatus;
  error_code: string | null;
  accessibility_score: number | null;
}

export interface IssueSample {
  selector?: string;
  snippet?: string;
  label?: string;
}

export interface MonitorIssue {
  id: string;
  page_id: string;
  rule_id: string;
  title: string;
  severity: IssueSeverity;
  element_count: number;
  sample_items: IssueSample[];
  state: IssueState;
  first_seen_at: string;
  last_seen_at: string;
}

export type IssueEventKind =
  | 'detected'
  | 'reopened'
  | 'resolved'
  | 'marked_fixed'
  | 'unmarked_fixed'
  | 'fix_confirmed'
  | 'fix_not_confirmed';

export interface IssueEvent {
  id: number;
  issue_id: string;
  run_id: string | null;
  kind: IssueEventKind;
  note: string | null;
  created_at: string;
}

export interface SiteDetail {
  pages: MonitorPage[];
  runs: ScanRun[];
  /** The newest result for each active page, from any recent run. */
  latestResults: PageResult[];
  /** Every issue on an active page, resolved ones included. */
  issues: MonitorIssue[];
  /** Issue history for the site, oldest first. */
  events: IssueEvent[];
}

export type MonitorResult<T> = { ok: true; value: T } | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  MONITOR_NOT_ENABLED: 'Monitor is not turned on for this account yet.',
  SITE_LIMIT: 'Your plan includes one site.',
  SITE_EXISTS: 'You already monitor this site.',
  INVALID_SITE: 'Enter a public https website address, like example.com.',
  INVALID_URL: 'Every page must be an https address on this site.',
  PAGE_LIMIT: 'A site can have up to 25 pages.',
  SCAN_IN_PROGRESS: 'A scan is already running for this site.',
  SCAN_RATE_LIMIT: 'You can ask for one extra scan a day. Weekly scans still run on schedule.',
  NO_PAGES: 'Add at least one page before scanning.',
  NOT_FOUND: 'We could not find that in your account.',
  INVALID_STATE: 'That issue changed since the page loaded. Refresh and try again.',
  NOTE_TOO_LONG: 'Notes can be up to 1,000 characters.',
  RECHECK_RATE_LIMIT: 'You can re-check pages 10 times a day per site. Weekly scans still run on schedule.',
  INVALID_PERIOD: 'Choose a start date before the end date, no more than a year apart, and not in the future.',
  RECORD_RATE_LIMIT: 'You can create 20 records a day per site.',
};

export function monitorErrorMessage(error: { message?: string } | null | undefined): string {
  const message = error?.message ?? '';
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  return code ? ERROR_MESSAGES[code] : 'Something went wrong. Please try again.';
}

export async function call<T>(promise: PromiseLike<{ data: unknown; error: { message?: string } | null }>, map: (data: unknown) => T): Promise<MonitorResult<T>> {
  const { data, error } = await promise;
  if (error) return { ok: false, message: monitorErrorMessage(error) };
  return { ok: true, value: map(data) };
}

export function getMonitorAccess(): Promise<MonitorResult<boolean>> {
  return call(supabase.rpc('my_monitor_access'), (data) => data === true);
}

export function listSites(): Promise<MonitorResult<MonitorSite[]>> {
  return call(
    supabase.from('sites').select('id, name, origin, paused, created_at').order('created_at', { ascending: true }),
    (data) => (data ?? []) as MonitorSite[],
  );
}

type Page<T> = PromiseLike<{ data: T[] | null; error: { message?: string } | null }>;
const PAGE_SIZE = 1000;

/**
 * Reads every row of an ordered query, PAGE_SIZE at a time, so long histories
 * are never cut off by the API's row cap.
 */
export async function fetchAllRows<T>(page: (from: number, to: number) => Page<T>): Promise<{ data: T[]; error: { message?: string } | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null };
  }
}

export async function loadSiteDetail(siteId: string): Promise<MonitorResult<SiteDetail>> {
  const pages = await supabase.from('site_pages').select('id, url, created_at').eq('site_id', siteId).is('removed_at', null).order('created_at');
  if (pages.error) return { ok: false, message: monitorErrorMessage(pages.error) };
  // Removed pages keep their issue history, but are no longer scanned, so
  // their issues and results are not current. finalize_scan_run counts the same way.
  const pageRows = (pages.data ?? []) as MonitorPage[];
  const activePageIds = pageRows.map((page) => page.id);

  const [runs, issues, events, ...results] = await Promise.all([
    supabase
      .from('scan_runs')
      .select('id, trigger, status, pages_total, pages_succeeded, pages_failed, new_issues, resolved_issues, open_issues, created_at, started_at, completed_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(10),
    activePageIds.length
      ? fetchAllRows<MonitorIssue>((from, to) =>
          supabase
            .from('issues')
            .select('id, page_id, rule_id, title, severity, element_count, sample_items, state, first_seen_at, last_seen_at')
            .eq('site_id', siteId)
            .in('page_id', activePageIds)
            .order('first_seen_at', { ascending: false })
            .order('id')
            .range(from, to) as unknown as Page<MonitorIssue>,
        )
      : Promise.resolve({ data: [] as MonitorIssue[], error: null }),
    fetchAllRows<IssueEvent>((from, to) =>
      supabase
        .from('issue_events')
        .select('id, issue_id, run_id, kind, note, created_at')
        .eq('site_id', siteId)
        .order('id', { ascending: true })
        .range(from, to) as unknown as Page<IssueEvent>,
    ),
    // A one-page re-check covers one page, so read each active page's newest
    // result directly rather than only the latest runs' rows.
    ...activePageIds.map((pageId) =>
      supabase
        .from('scan_page_results')
        .select('id, page_id, url, status, error_code, accessibility_score, created_at')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false })
        .limit(1),
    ),
  ]);

  const failed = [runs, issues, events, ...results].find((result) => result.error);
  if (failed) return { ok: false, message: monitorErrorMessage(failed.error) };

  const latestResults = results.flatMap((result) => (result.data ?? []) as PageResult[]);
  const issueRows = issues.data;
  const issueIds = new Set(issueRows.map((issue) => issue.id));
  const eventRows = events.data.filter((event) => issueIds.has(event.issue_id));

  return {
    ok: true,
    value: { pages: pageRows, runs: (runs.data ?? []) as ScanRun[], latestResults, issues: issueRows, events: eventRows },
  };
}

export function createSite(name: string, origin: string, urls: string[]): Promise<MonitorResult<string>> {
  return call(supabase.rpc('create_site', { p_name: name, p_origin: origin, p_urls: urls }), (data) => String(data));
}

export function addSitePages(siteId: string, urls: string[]): Promise<MonitorResult<number>> {
  return call(supabase.rpc('add_site_pages', { p_site_id: siteId, p_urls: urls }), (data) => Number(data) || 0);
}

export function removeSitePage(pageId: string): Promise<MonitorResult<null>> {
  return call(supabase.rpc('remove_site_page', { p_page_id: pageId }), () => null);
}

export function setSitePaused(siteId: string, paused: boolean): Promise<MonitorResult<null>> {
  return call(supabase.rpc('set_site_paused', { p_site_id: siteId, p_paused: paused }), () => null);
}

export function requestSiteScan(siteId: string): Promise<MonitorResult<string>> {
  return call(supabase.rpc('request_site_scan', { p_site_id: siteId }), (data) => String(data));
}

export function markIssueFixed(issueId: string, note: string): Promise<MonitorResult<null>> {
  return call(supabase.rpc('mark_issue_fixed', { p_issue_id: issueId, p_note: note.trim() || null }), () => null);
}

export function undoMarkFixed(issueId: string): Promise<MonitorResult<null>> {
  return call(supabase.rpc('undo_mark_fixed', { p_issue_id: issueId }), () => null);
}

export function requestPageRecheck(pageId: string): Promise<MonitorResult<string>> {
  return call(supabase.rpc('request_page_recheck', { p_page_id: pageId }), (data) => String(data));
}

export function isRunActive(run: ScanRun | undefined): boolean {
  return run?.status === 'queued' || run?.status === 'running';
}
