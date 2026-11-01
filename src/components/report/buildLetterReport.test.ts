import { describe, expect, it } from 'vitest';
import type { DocumentAnalysis } from '../documents/DocumentUploadDialog';
import { buildLetterReport, LETTER_DISCLAIMER } from './buildLetterReport';

const analysis: DocumentAnalysis = {
  success: true,
  analysis: {
    documentSummary: 'Demand letter alleging ADA website violations.',
    documentType: 'Legal Demand Letter',
    keyPoints: ['Alleges missing alt text'],
    recommendedActions: ['Consult an attorney', 'Preserve records'],
    urgencyLevel: 'high',
    additionalResources: ['ADA.gov'],
    extractedData: { attorneyName: 'Jane Doe', responseDeadline: '2026-11-20', settlementAmount: 15000 },
    confidenceScores: { attorneyName: 0.95 },
    legalAnalysis: { claimType: 'ADA Title III', riskAssessment: 'Moderate', potentialDefenses: ['Remediation underway'] },
  },
  debug: { analysisMethod: 'gemini', aiModel: 'gemini-x', hasGeminiKey: true, fileType: 'pdf', timestamp: '2026-11-01T10:00:00Z' },
};

describe('buildLetterReport', () => {
  it('leads with the legal disclaimer and keeps the action order', () => {
    const report = buildLetterReport(analysis, { now: new Date('2026-11-01T10:00:00Z') });
    const first = report.sections[0].blocks[0];
    expect(first).toMatchObject({ kind: 'callout', text: LETTER_DISCLAIMER });
    const actions = report.sections.find((section) => section.id === 'actions')?.blocks[0];
    expect(actions).toMatchObject({ kind: 'list', ordered: true });
    expect(report.fileName).toBe('univia-letter-analysis-legal-demand-letter-2026-11-01');
  });

  it('formats extracted facts with confidence and deadline tone', () => {
    const report = buildLetterReport(analysis);
    const facts = report.sections.find((section) => section.id === 'details')?.blocks[0];
    expect(facts?.kind).toBe('facts');
    if (facts?.kind !== 'facts') return;
    expect(facts.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Attorney', value: 'Jane Doe', note: 'High confidence' }),
        expect.objectContaining({ label: 'Response Deadline', tone: 'error' }),
        expect.objectContaining({ label: 'Settlement Amount', value: '$15,000' }),
      ]),
    );
  });

  it('skips sections with no data', () => {
    const report = buildLetterReport({ ...analysis, analysis: { ...analysis.analysis, legalAnalysis: undefined, extractedEntities: undefined } });
    expect(report.sections.map((section) => section.id)).not.toContain('legal');
    expect(report.sections.map((section) => section.id)).not.toContain('entities');
  });
});
