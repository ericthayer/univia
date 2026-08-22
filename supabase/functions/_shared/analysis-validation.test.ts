import { describe, expect, it } from 'vitest';
import { validateDocumentAnalysis } from './analysis-validation';

const validAnalysis = {
  documentSummary: 'A concise summary.',
  documentType: 'Legal Demand Letter',
  keyPoints: ['A finding'],
  recommendedActions: ['Review the deadline'],
  urgencyLevel: 'high',
  additionalResources: ['ADA.gov'],
  plaintiffName: 'Alex Example',
  responseDeadline: '2026-08-30',
  settlementAmount: 5000,
  violationsCited: ['WCAG 2.2 AA'],
  confidenceScores: { plaintiffName: 0.9 },
  extractedEntities: {
    persons: ['Alex Example'],
    organizations: [],
    dates: [],
    amounts: ['$5,000'],
    legalCitations: [],
  },
  legalAnalysis: {
    claimType: 'ADA Website Accessibility',
    potentialDefenses: ['Review notice requirements'],
    riskAssessment: 'Review with counsel.',
  },
};

describe('validateDocumentAnalysis', () => {
  it('maps and bounds a valid model response', () => {
    expect(validateDocumentAnalysis(validAnalysis)).toMatchObject({
      documentSummary: 'A concise summary.',
      urgencyLevel: 'high',
      extractedData: {
        plaintiffName: 'Alex Example',
        settlementAmount: 5000,
        violationsCited: ['WCAG 2.2 AA'],
      },
    });
  });

  it('rejects missing required fields and invalid enum/number values', () => {
    expect(validateDocumentAnalysis({ ...validAnalysis, keyPoints: 'not an array' })).toBeNull();
    expect(validateDocumentAnalysis({ ...validAnalysis, urgencyLevel: 'emergency' })).toBeNull();
    expect(validateDocumentAnalysis({ ...validAnalysis, settlementAmount: Number.NaN })).toBeNull();
    expect(validateDocumentAnalysis({
      ...validAnalysis,
      confidenceScores: { plaintiffName: 1.1 },
    })).toBeNull();
  });

  it('rejects oversized or non-string model output fields', () => {
    expect(validateDocumentAnalysis({
      ...validAnalysis,
      documentSummary: 'x'.repeat(10_001),
    })).toBeNull();
    expect(validateDocumentAnalysis({
      ...validAnalysis,
      recommendedActions: ['x'.repeat(2_001)],
    })).toBeNull();
    expect(validateDocumentAnalysis({
      ...validAnalysis,
      extractedEntities: { ...validAnalysis.extractedEntities, persons: [42] },
    })).toBeNull();
  });
});
