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
 * Phrases that turn a factual summary into legal advice.
 * Kept narrow on purpose: "consult a defense attorney" or "the letter demands
 * a settlement of $X" are fine; "you have a strong defense" is not.
 */
const OPINION_PATTERNS: readonly RegExp[] = [
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
];

/**
 * Compliance and protection claims. Never acceptable in any field, questions
 * included. Covers present and future tense and versioned standards
 * ("will be compliant", "is WCAG 2.1 AA compliant") but not the sender's
 * allegations ("alleges the site is not compliant").
 */
const CLAIM_PATTERNS: readonly RegExp[] = [
  /\b(site|website|business|you|it)\s+(is|are|will\s+be|would\s+be|becomes?|will\s+become)\s+(now\s+)?(fully\s+)?(?:(?:ada|wcag|section\s*508)\s*)?(?:\d+(?:\.\d+)*\s*)?(?:(?:level\s+)?a{1,3}\s*)?[-\s]?(compliant|conformant)\b/i,
  /\b(immunity\s+from|lawsuit[-\s]proof|protected\s+from\s+(lawsuits|claims))\b/i,
];

/** Imperative legal moves, checked only at the start of a recommended action. */
const IMPERATIVE_ACTION = /^\s*(?:\d+[.)]\s*)?(?:(?:pay|settle|ignore|reject|refuse|accept|counter[-\s]?offer)\b|(?:do\s+not|don't)\s+(?:pay|settle|respond|reply)\b)/i;

export type AdviceField = 'summary' | 'keyPoint' | 'action' | 'question' | 'claimType';

/**
 * True when `text` gives legal advice or makes a compliance claim. The field
 * matters: a neutral question for an attorney may mention defenses or
 * settlement ("Are there defenses I should discuss?"), and only recommended
 * actions are checked for imperative moves ("Pay the $8,000").
 */
export function containsAdvice(text: string, field: AdviceField = 'summary'): boolean {
  if (CLAIM_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (field === 'action' && IMPERATIVE_ACTION.test(text)) return true;
  if (field === 'question' && text.trim().endsWith('?')) return false;
  return OPINION_PATTERNS.some((pattern) => pattern.test(text));
}

function textFields(analysis: DocumentAnalysis): Array<[string, string, AdviceField]> {
  const fields: Array<[string, string, AdviceField]> = [['documentSummary', analysis.documentSummary, 'summary']];
  analysis.keyPoints.forEach((item, i) => fields.push([`keyPoints[${i}]`, item, 'keyPoint']));
  analysis.recommendedActions.forEach((item, i) => fields.push([`recommendedActions[${i}]`, item, 'action']));
  (analysis.questionsForAttorney ?? []).forEach((item, i) => fields.push([`questionsForAttorney[${i}]`, item, 'question']));
  if (analysis.legalAnalysis) fields.push(['legalAnalysis.claimType', analysis.legalAnalysis.claimType, 'claimType']);
  return fields;
}

/** Paths of fields that contain advice-like language; empty when clean. */
export function findAdviceViolations(analysis: DocumentAnalysis): string[] {
  return textFields(analysis)
    .filter(([, text, field]) => containsAdvice(text, field))
    .map(([path]) => path);
}

/** Split on sentence ends only, so "WCAG 2.1" and "$8,000.00" stay whole. */
function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/);
}

function stripSentences(text: string): string {
  return splitSentences(text).filter((sentence) => !containsAdvice(sentence)).join(' ').trim();
}

/**
 * Last line of defence after one regeneration: drop list items and summary
 * sentences that still contain advice-like language.
 */
export function stripAdvice(analysis: DocumentAnalysis): DocumentAnalysis {
  const clean = (items: string[], field: AdviceField) => items.filter((item) => !containsAdvice(item, field));
  const summary = stripSentences(analysis.documentSummary);
  return {
    ...analysis,
    documentSummary: summary || 'Summary unavailable. Review the original document with your attorney.',
    keyPoints: clean(analysis.keyPoints, 'keyPoint'),
    recommendedActions: clean(analysis.recommendedActions, 'action'),
    questionsForAttorney: analysis.questionsForAttorney ? clean(analysis.questionsForAttorney, 'question') : undefined,
    legalAnalysis: analysis.legalAnalysis && !containsAdvice(analysis.legalAnalysis.claimType, 'claimType')
      ? analysis.legalAnalysis
      : undefined,
  };
}
