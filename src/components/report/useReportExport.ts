import { useCallback, useRef, useState } from 'react';
import type { ReportRequest } from './reportExport';

export type ReportExportStatus = 'idle' | 'preparing' | 'error';

export interface UseReportExportResult {
  status: ReportExportStatus;
  /** Text for a polite live region; empty when there is nothing to announce. */
  message: string;
  exportReport: (request: ReportRequest) => Promise<void>;
}

const PREPARING = 'Preparing PDF report. Choose "Save as PDF" in the print dialog.';
const FAILED = 'The PDF report could not be prepared. Please try again.';

/**
 * Builds and prints a report on demand. The generator is dynamically imported
 * so pages pay nothing until someone exports.
 */
export function useReportExport(): UseReportExportResult {
  const [status, setStatus] = useState<ReportExportStatus>('idle');
  const [message, setMessage] = useState('');
  const busy = useRef(false);

  const exportReport = useCallback(async (request: ReportRequest): Promise<void> => {
    if (busy.current) return;
    busy.current = true;
    setStatus('preparing');
    setMessage(PREPARING);
    try {
      const { exportReport: run } = await import('./reportExport');
      await run(request);
      setStatus('idle');
      setMessage('');
    } catch (error) {
      console.error('Report export failed:', error);
      setStatus('error');
      setMessage(FAILED);
    } finally {
      busy.current = false;
    }
  }, []);

  return { status, message, exportReport };
}
