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
    questionsForAttorney: ['Does the deadline run from the letter date or receipt?'],
    legalAnalysis: { claimType: 'ADA Title III' },
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

  it('shows claim facts and attorney questions without legal opinions', () => {
    // Letters saved before the guardrail change still carry these in stored JSON.
    const legacy = {
      ...analysis,
      analysis: {
        ...analysis.analysis,
        legalAnalysis: { claimType: 'ADA Title III', riskAssessment: 'Moderate', potentialDefenses: ['Remediation underway'] },
      },
    } as DocumentAnalysis;
    const report = buildLetterReport(legacy);
    const legal = report.sections.find((section) => section.id === 'legal');
    expect(legal?.title).toBe('Claim Details');
    expect(legal?.blocks).toEqual([{ kind: 'facts', items: [{ label: 'Claim Type', value: 'ADA Title III' }] }]);
    expect(JSON.stringify(report)).not.toMatch(/Remediation underway|Risk Assessment|Defenses/);
    expect(report.sections.find((section) => section.id === 'questions')?.blocks[0]).toMatchObject({ kind: 'list', ordered: false });
  });

  it('skips sections with no data', () => {
    const report = buildLetterReport({ ...analysis, analysis: { ...analysis.analysis, legalAnalysis: undefined, extractedEntities: undefined } });
    expect(report.sections.map((section) => section.id)).not.toContain('legal');
    expect(report.sections.map((section) => section.id)).not.toContain('entities');
  });
});
