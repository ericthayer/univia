/** Date-input helpers for the record period. Dates are the viewer's local days. */

export const DEFAULT_PERIOD_DAYS = 90;
export const MAX_PERIOD_DAYS = 366;

export function toDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight at the start of a YYYY-MM-DD day, or null when invalid. */
export function fromDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getMonth() === Number(match[2]) - 1 ? date : null;
}

export function defaultPeriod(now: Date = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - DEFAULT_PERIOD_DAYS);
  return { from: toDateInput(from), to: toDateInput(now) };
}

export type PeriodResult = { ok: true; start: Date; end: Date } | { ok: false; message: string };

/**
 * The period covers whole days: from the start of "from" to the end of "to".
 * The server also caps the end at the moment the record is made.
 */
export function parsePeriod(from: string, to: string, now: Date = new Date()): PeriodResult {
  const start = fromDateInput(from);
  const lastDay = fromDateInput(to);
  if (!start || !lastDay) return { ok: false, message: 'Enter both dates.' };
  const end = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1);
  if (start >= end) return { ok: false, message: 'The start date must be on or before the end date.' };
  if (start > now) return { ok: false, message: 'The period cannot start in the future.' };
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (days > MAX_PERIOD_DAYS) return { ok: false, message: 'A record can cover up to one year.' };
  return { ok: true, start, end };
}
