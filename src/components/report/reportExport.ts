import type { DocumentAnalysis } from '../documents/DocumentUploadDialog';
import { buildAuditReport, type AuditReportInput } from './buildAuditReport';
import { buildLetterReport, type LetterReportOptions } from './buildLetterReport';
import { buildRemediationRecord, type RecordOptions } from './buildRemediationRecord';
import type { RecordContents } from '../../services/remediationRecord.service';
import { printReport } from './printReport';

/** Lazy-loaded entry point: everything behind this module stays out of page chunks. */
export type ReportRequest =
  | { kind: 'audit'; input: AuditReportInput }
  | { kind: 'letter'; analysis: DocumentAnalysis; options?: LetterReportOptions }
  | { kind: 'record'; contents: RecordContents; options: RecordOptions };

export async function exportReport(request: ReportRequest): Promise<void> {
  const report =
    request.kind === 'audit'
      ? buildAuditReport(request.input)
      : request.kind === 'letter'
        ? buildLetterReport(request.analysis, request.options)
        : buildRemediationRecord(request.contents, request.options);
  await printReport(report);
}
