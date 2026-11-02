import { describe, expect, it } from 'vitest';
import type { DocumentAnalysis } from './analysis-validation';
import {
  containsAdvice,
  findAdviceViolations,
  resolveAnalysisOptions,
  stripAdvice,
} from './analysis-policy';

const baseAnalysis: DocumentAnalysis = {
  documentSummary: 'A law firm alleges the website has missing alt text. It demands $8,000 within 14 days.',
  documentType: 'Legal Demand Letter',
  keyPoints: ['Cites WCAG 2.1 AA criterion 1.1.1', 'Demands $8,000'],
  recommendedActions: ['Share the letter with an attorney', 'Run an accessibility audit of the cited pages'],
  urgencyLevel: 'high',
  additionalResources: ['ADA.gov'],
  extractedData: { settlementAmount: 8000 },
  confidenceScores: {},
  extractedEntities: { persons: [], organizations: [], dates: [], amounts: [], legalCitations: [] },
  questionsForAttorney: ['Does the deadline run from the letter date or the date received?'],
  legalAnalysis: { claimType: 'ADA Title III website accessibility' },
};

describe('resolveAnalysisOptions', () => {
  it('serves Flash + standard to users without premium analysis, whatever they asked for', () => {
    expect(resolveAnalysisOptions({ modelPreference: 'pro', analysisDepth: 'detailed' }, { premiumAnalysis: false }))
      .toEqual({ modelPreference: 'flash', analysisDepth: 'standard', downgraded: true });
    expect(resolveAnalysisOptions({ modelPreference: 'flash', analysisDepth: 'standard' }, { premiumAnalysis: false }))
      .toEqual({ modelPreference: 'flash', analysisDepth: 'standard', downgraded: false });
  });

  it('honours the request for entitled users', () => {
    expect(resolveAnalysisOptions({ modelPreference: 'pro', analysisDepth: 'detailed' }, { premiumAnalysis: true }))
      .toEqual({ modelPreference: 'pro', analysisDepth: 'detailed', downgraded: false });
  });
});

describe('containsAdvice', () => {
  it.each([
    'You may have a strong defense under the notice requirements.',
    'Potential defenses to consider include mootness.',
    'You should settle quickly to avoid litigation costs.',
    'The amount is above the typical settlement for similar claims.',
    'The claim appears weak because no pages are named.',
    'The letter has procedural defects.',
    'The sender shows serial litigant indicators.',
    'Legal risk is moderate.',
    'After remediation the website is fully compliant.',
    'Monitoring makes you lawsuit-proof.',
  ])('flags %s', (text) => {
    expect(containsAdvice(text)).toBe(true);
  });

  it.each([
    'Consult an ADA defense attorney before the deadline.',
    'The letter demands a settlement of $8,000.',
    'The letter alleges the site is not compliant with WCAG 2.1 AA.',
    'Ask your attorney whether the demand amount is negotiable.',
    'Run an accessibility audit and record what you fix.',
  ])('allows %s', (text) => {
    expect(containsAdvice(text)).toBe(false);
  });
});

describe('findAdviceViolations / stripAdvice', () => {
  it('reports nothing for a neutral analysis and leaves it unchanged', () => {
    expect(findAdviceViolations(baseAnalysis)).toEqual([]);
    expect(stripAdvice(baseAnalysis)).toEqual(baseAnalysis);
  });

  it('names offending fields and removes them', () => {
    const tainted: DocumentAnalysis = {
      ...baseAnalysis,
      documentSummary: 'A firm alleges missing alt text. The claim appears weak. It demands $8,000.',
      keyPoints: [...baseAnalysis.keyPoints, 'Potential defenses include mootness'],
      recommendedActions: ['You should settle within a week', 'Share the letter with an attorney'],
    };

    expect(findAdviceViolations(tainted)).toEqual(['documentSummary', 'keyPoints[2]', 'recommendedActions[0]']);

    const cleaned = stripAdvice(tainted);
    expect(cleaned.documentSummary).toBe('A firm alleges missing alt text. It demands $8,000.');
    expect(cleaned.keyPoints).toEqual(baseAnalysis.keyPoints);
    expect(cleaned.recommendedActions).toEqual(['Share the letter with an attorney']);
    expect(findAdviceViolations(cleaned)).toEqual([]);
  });
});
