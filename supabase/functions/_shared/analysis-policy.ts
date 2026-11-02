import type { DocumentAnalysis } from './analysis-validation.ts';

/**
 * Guardrails for demand-letter analysis.
 *
 * Univia is not a law firm. Analysis describes what a letter says and what to
 * do next in practical terms; it never judges the legal merit of a claim,
 * suggests defenses or settlement positions, or says a site is compliant.
 * See the Demand Letter Response Kit spec (Guardrails) for the reasoning.
 */

export type ModelPreference = 'flash' | 'pro';
export type AnalysisDepth = 'standard' | 'detailed';

export interface AnalysisOptions {
  modelPreference: ModelPreference;
  analysisDepth: AnalysisDepth;
}

export interface ResolvedAnalysisOptions extends AnalysisOptions {
  /** True when the caller asked for more than they are entitled to. */
  downgraded: boolean;
}

/**
 * Pro model and detailed depth are a paid feature (the planned Response Kit).
 * Until purchases exist, only administrators get them; everyone else is
 * served Flash + standard regardless of what the client sent.
 */
export function resolveAnalysisOptions(
  requested: AnalysisOptions,
  entitlement: { premiumAnalysis: boolean },
): ResolvedAnalysisOptions {
  if (entitlement.premiumAnalysis) {
    return { ...requested, downgraded: false };
  }
  return {
    modelPreference: 'flash',
    analysisDepth: 'standard',
    downgraded: requested.modelPreference !== 'flash' || requested.analysisDepth !== 'standard',
  };
}

/**
 * Phrases that turn a factual summary into legal advice or a compliance claim.
 * Kept narrow on purpose: "consult a defense attorney" or "the letter demands
 * a settlement of $X" are fine; "you have a strong defense" is not.
 */
const ADVICE_PATTERNS: readonly RegExp[] = [
  /\b(potential|possible|viable|strong|available|likely)\s+(legal\s+)?defen[cs]es?\b/i,
  /\bdefen[cs]es?\s+(to\s+consider|you\s+(could|can|may|might)\s+raise|available)\b/i,
  /\b(you|the\s+business)\s+should\s+(not\s+)?(settle|pay|refuse|ignore)\b/i,
  /\b(typical|average|reasonable|fair)\s+settlement\b/i,
  /\bsettlement\s+range\b/i,
  /\b(claim|case|letter|demand)\s+(is|appears|seems|looks)\s+(to\s+be\s+)?(frivolous|weak|strong|invalid|meritless|baseless|without\s+merit|defective)\b/i,
  /\bprocedural\s+defects?\b/i,
  /\bserial\s+(litigant|plaintiff|filer)s?\b/i,
  /\blikel(y|ihood)\s+(to|of)\s+(win|lose|prevail|succeed)/i,
  /\b(legal\s+)?risk\s+(is|level\s+is|appears)\s+(low|moderate|medium|high|minimal)\b/i,
  /\b(site|website|business|you)\s+(is|are)\s+(now\s+)?(fully\s+)?(ada[-\s]|wcag[-\s])?compliant\b/i,
  /\b(immunity\s+from|lawsuit[-\s]proof|protected\s+from\s+(lawsuits|claims))\b/i,
];

export function containsAdvice(text: string): boolean {
  return ADVICE_PATTERNS.some((pattern) => pattern.test(text));
}

function textFields(analysis: DocumentAnalysis): Array<[string, string]> {
  const fields: Array<[string, string]> = [['documentSummary', analysis.documentSummary]];
  analysis.keyPoints.forEach((item, i) => fields.push([`keyPoints[${i}]`, item]));
  analysis.recommendedActions.forEach((item, i) => fields.push([`recommendedActions[${i}]`, item]));
  (analysis.questionsForAttorney ?? []).forEach((item, i) => fields.push([`questionsForAttorney[${i}]`, item]));
  if (analysis.legalAnalysis) fields.push(['legalAnalysis.claimType', analysis.legalAnalysis.claimType]);
  return fields;
}

/** Paths of fields that contain advice-like language; empty when clean. */
export function findAdviceViolations(analysis: DocumentAnalysis): string[] {
  return textFields(analysis)
    .filter(([, text]) => containsAdvice(text))
    .map(([path]) => path);
}

function stripSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  return sentences.filter((sentence) => !containsAdvice(sentence)).join('').trim();
}

/**
 * Last line of defence after one regeneration: drop list items and summary
 * sentences that still contain advice-like language.
 */
export function stripAdvice(analysis: DocumentAnalysis): DocumentAnalysis {
  const clean = (items: string[]) => items.filter((item) => !containsAdvice(item));
  const summary = stripSentences(analysis.documentSummary);
  return {
    ...analysis,
    documentSummary: summary || 'Summary unavailable. Review the original document with your attorney.',
    keyPoints: clean(analysis.keyPoints),
    recommendedActions: clean(analysis.recommendedActions),
    questionsForAttorney: analysis.questionsForAttorney ? clean(analysis.questionsForAttorney) : undefined,
    legalAnalysis: analysis.legalAnalysis && !containsAdvice(analysis.legalAnalysis.claimType)
      ? analysis.legalAnalysis
      : undefined,
  };
}
