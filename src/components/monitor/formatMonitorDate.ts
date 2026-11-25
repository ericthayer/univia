/** Short local date and time for scan timestamps, e.g. "Nov 15, 10:28 AM". */
export function formatMonitorDate(value: string, locale?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
