import type { DocumentAnalysis } from '../documents/DocumentUploadDialog';
import { buildAuditReport, type AuditReportInput } from './buildAuditReport';
import { buildLetterReport, type LetterReportOptions } from './buildLetterReport';
import { printReport } from './printReport';

/** Lazy-loaded entry point: everything behind this module stays out of page chunks. */
export type ReportRequest =
  | { kind: 'audit'; input: AuditReportInput }
  | { kind: 'letter'; analysis: DocumentAnalysis; options?: LetterReportOptions };

export async function exportReport(request: ReportRequest): Promise<void> {
  const report = request.kind === 'audit' ? buildAuditReport(request.input) : buildLetterReport(request.analysis, request.options);
  await printReport(report);
}
