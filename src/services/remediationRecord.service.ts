import { supabase } from './supabaseClient';
import { ROUTE_PATHS } from '../config/navigation';
import { call, type IssueEventKind, type IssueSeverity, type MonitorResult, type ScanRunStatus, type ScanTrigger } from './monitor.service';

/** A saved record: the period it covers and the fingerprint of that history. */
export interface RemediationRecord {
  id: string;
  site_id: string;
  period_start: string;
  period_end: string;
  run_count: number;
  event_count: number;
  fingerprint: string;
  created_at: string;
}

export interface RecordRun {
  id: string;
  trigger: ScanTrigger;
  status: Extract<ScanRunStatus, 'completed' | 'failed'>;
  pages_total: number;
  pages_succeeded: number;
  pages_failed: number;
  new_issues: number;
  resolved_issues: number;
  created_at: string;
  completed_at: string;
}

export interface RecordEvent {
  id: number;
  issue_id: string;
  run_id: string | null;
  kind: IssueEventKind;
  note: string | null;
  created_at: string;
}

export interface RecordIssue {
  id: string;
  rule_id: string;
  title: string;
  severity: IssueSeverity;
  page_url: string;
}

/** Everything a record's fingerprint covers, as returned by the server. */
export interface RecordContents {
  record: RemediationRecord;
  site: { name: string; origin: string };
  runs: RecordRun[];
  events: RecordEvent[];
  issues: RecordIssue[];
}

export interface RecordVerification {
  site_name: string;
  site_origin: string;
  period_start: string;
  period_end: string;
  created_at: string;
  fingerprint: string;
  matches: boolean;
}

const RECORD_COLUMNS = 'id, site_id, period_start, period_end, run_count, event_count, fingerprint, created_at';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRecordId(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}

export function recordVerifyUrl(recordId: string, origin: string = window.location.origin): string {
  return `${origin}${ROUTE_PATHS.VERIFY_RECORD.replace(':id', recordId)}`;
}

export function listRecords(siteId: string): Promise<MonitorResult<RemediationRecord[]>> {
  return call(
    supabase.from('remediation_records').select(RECORD_COLUMNS).eq('site_id', siteId).order('created_at', { ascending: false }).limit(50),
    (data) => (data ?? []) as RemediationRecord[],
  );
}

export function createRecord(siteId: string, periodStart: Date, periodEnd: Date): Promise<MonitorResult<RecordContents>> {
  return call(
    supabase.rpc('create_remediation_record', {
      p_site_id: siteId,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
    }),
    (data) => data as RecordContents,
  );
}

export function loadRecordContents(recordId: string): Promise<MonitorResult<RecordContents>> {
  return call(supabase.rpc('remediation_record_contents', { p_record_id: recordId }), (data) => data as RecordContents);
}

/** Null when no record has that id. */
export function verifyRecord(recordId: string): Promise<MonitorResult<RecordVerification | null>> {
  return call(supabase.rpc('verify_remediation_record', { p_record_id: recordId }), (data) => {
    const rows = (data ?? []) as RecordVerification[];
    return rows[0] ?? null;
  });
}
