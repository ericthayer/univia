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
    'After these fixes your website will be compliant.',
    'Your website is WCAG 2.1 AA compliant.',
    'The site is now Section 508 conformant.',
  ])('flags %s', (text) => {
    expect(containsAdvice(text)).toBe(true);
  });

  it.each([
    'Consult an ADA defense attorney before the deadline.',
    'The letter demands a settlement of $8,000.',
    'The letter alleges the site is not compliant with WCAG 2.1 AA.',
    'Ask your attorney whether the demand amount is negotiable.',
    'Run an accessibility audit and record what you fix.',
    'The letter alleges the website is not WCAG 2.1 AA compliant.',
  ])('allows %s', (text) => {
    expect(containsAdvice(text)).toBe(false);
  });

  it.each([
    'Pay the requested $8,000 to resolve the claim',
    'Settle the demand before the deadline',
    'Ignore the demand because no lawsuit has been filed',
    'Do not respond to the letter',
    '2. Accept the settlement offer',
  ])('flags the imperative recommended action %s', (text) => {
    expect(containsAdvice(text, 'action')).toBe(true);
  });

  it.each([
    'Calendar the response deadline of November 20',
    'Share the letter with an attorney before the deadline',
    'Do not ignore the response deadline',
    'Preserve records of payment requests',
  ])('allows the practical recommended action %s', (text) => {
    expect(containsAdvice(text, 'action')).toBe(false);
  });

  it('only checks imperatives in recommended actions', () => {
    expect(containsAdvice('Pay the requested $8,000 to resolve the claim', 'keyPoint')).toBe(false);
  });

  it('keeps neutral attorney questions that mention defenses or settlement', () => {
    expect(containsAdvice('Are there any potential defenses I should discuss with my attorney?', 'question')).toBe(false);
    expect(containsAdvice('Is the demanded amount a typical settlement for this kind of claim?', 'question')).toBe(false);
  });

  it('still flags advice or compliance claims phrased in the questions field', () => {
    expect(containsAdvice('You have strong defenses here.', 'question')).toBe(true);
    expect(containsAdvice('Once fixed, will the site be ADA compliant? It will be compliant.', 'question')).toBe(true);
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

  it('strips a versioned compliance claim from the summary without splitting "2.1"', () => {
    const tainted: DocumentAnalysis = {
      ...baseAnalysis,
      documentSummary: 'The letter cites WCAG 2.1 AA. Your website is WCAG 2.1 AA compliant. It demands $8,000.00 by Nov. 20.',
    };
    expect(findAdviceViolations(tainted)).toEqual(['documentSummary']);
    expect(stripAdvice(tainted).documentSummary).toBe('The letter cites WCAG 2.1 AA. It demands $8,000.00 by Nov. 20.');
  });

  it('flags and strips imperative actions but keeps neutral questions', () => {
    const tainted: DocumentAnalysis = {
      ...baseAnalysis,
      recommendedActions: ['Pay the requested $8,000 to resolve the claim', 'Share the letter with an attorney'],
      questionsForAttorney: ['Are there any potential defenses I should discuss with my attorney?'],
    };
    expect(findAdviceViolations(tainted)).toEqual(['recommendedActions[0]']);
    const cleaned = stripAdvice(tainted);
    expect(cleaned.recommendedActions).toEqual(['Share the letter with an attorney']);
    expect(cleaned.questionsForAttorney).toEqual(tainted.questionsForAttorney);
  });
});
