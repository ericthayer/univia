export interface DocumentAnalysis {
  documentSummary: string;
  documentType: string;
  keyPoints: string[];
  recommendedActions: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  additionalResources: string[];
  extractedData: {
    plaintiffName?: string;
    attorneyName?: string;
    attorneyFirm?: string;
    responseDeadline?: string;
    settlementAmount?: number;
    violationsCited?: string[];
    caseNumber?: string;
    courtName?: string;
    filingDate?: string;
  };
  confidenceScores: Record<string, number>;
  extractedEntities: {
    persons: string[];
    organizations: string[];
    dates: string[];
    amounts: string[];
    legalCitations: string[];
  };
  legalAnalysis?: {
    claimType: string;
    jurisdiction?: string;
    statuteOfLimitations?: string;
    potentialDefenses: string[];
    riskAssessment: string;
  };
}

const URGENCY_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const MAX_SUMMARY_LENGTH = 10_000;
const MAX_SHORT_TEXT_LENGTH = 500;
const MAX_LONG_TEXT_LENGTH = 2_000;
const MAX_ARRAY_ITEMS = 100;
const MAX_LIST_ITEMS = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error('invalid string');
  }
  return value.trim();
}

function optionalString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requiredString(value, maxLength);
}

function stringArray(value: unknown, maxItems: number, maxItemLength: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error('invalid string array');
  }
  return value.map((item) => requiredString(item, maxItemLength));
}

function optionalStringArray(value: unknown, maxItems: number, maxItemLength: number): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  return stringArray(value, maxItems, maxItemLength);
}

function optionalNumber(value: unknown, maxValue: number): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maxValue) {
    throw new Error('invalid number');
  }
  return value;
}

function confidenceScores(value: unknown): Record<string, number> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value) || Object.keys(value).length > MAX_LIST_ITEMS) {
    throw new Error('invalid confidence scores');
  }

  return Object.fromEntries(Object.entries(value).map(([key, score]) => {
    if (!key || key.length > MAX_SHORT_TEXT_LENGTH || typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
      throw new Error('invalid confidence score');
    }
    return [key, score];
  }));
}

export function validateDocumentAnalysis(value: unknown): DocumentAnalysis | null {
  try {
    if (!isRecord(value)) return null;

    const extractedData = isRecord(value.extractedData) ? value.extractedData : value;
    const extractedEntities = isRecord(value.extractedEntities) ? value.extractedEntities : {};
    const legalAnalysis = value.legalAnalysis === undefined || value.legalAnalysis === null
      ? undefined
      : value.legalAnalysis;

    if (legalAnalysis !== undefined && !isRecord(legalAnalysis)) {
      return null;
    }

    return {
      documentSummary: requiredString(value.documentSummary, MAX_SUMMARY_LENGTH),
      documentType: requiredString(value.documentType, MAX_SHORT_TEXT_LENGTH),
      keyPoints: stringArray(value.keyPoints, MAX_LIST_ITEMS, MAX_LONG_TEXT_LENGTH),
      recommendedActions: stringArray(value.recommendedActions, MAX_LIST_ITEMS, MAX_LONG_TEXT_LENGTH),
      urgencyLevel: (() => {
        if (typeof value.urgencyLevel !== 'string' || !URGENCY_LEVELS.has(value.urgencyLevel)) {
          throw new Error('invalid urgency');
        }
        return value.urgencyLevel as DocumentAnalysis['urgencyLevel'];
      })(),
      additionalResources: stringArray(value.additionalResources, MAX_LIST_ITEMS, MAX_SHORT_TEXT_LENGTH),
      extractedData: {
        plaintiffName: optionalString(extractedData.plaintiffName, MAX_SHORT_TEXT_LENGTH),
        attorneyName: optionalString(extractedData.attorneyName, MAX_SHORT_TEXT_LENGTH),
        attorneyFirm: optionalString(extractedData.attorneyFirm, MAX_SHORT_TEXT_LENGTH),
        responseDeadline: optionalString(extractedData.responseDeadline, MAX_SHORT_TEXT_LENGTH),
        settlementAmount: optionalNumber(extractedData.settlementAmount, 1_000_000_000),
        violationsCited: optionalStringArray(extractedData.violationsCited, MAX_LIST_ITEMS, MAX_SHORT_TEXT_LENGTH),
        caseNumber: optionalString(extractedData.caseNumber, MAX_SHORT_TEXT_LENGTH),
        courtName: optionalString(extractedData.courtName, MAX_SHORT_TEXT_LENGTH),
        filingDate: optionalString(extractedData.filingDate, MAX_SHORT_TEXT_LENGTH),
      },
      confidenceScores: confidenceScores(value.confidenceScores),
      extractedEntities: {
        persons: stringArray(extractedEntities.persons ?? [], MAX_ARRAY_ITEMS, MAX_SHORT_TEXT_LENGTH),
        organizations: stringArray(extractedEntities.organizations ?? [], MAX_ARRAY_ITEMS, MAX_SHORT_TEXT_LENGTH),
        dates: stringArray(extractedEntities.dates ?? [], MAX_ARRAY_ITEMS, MAX_SHORT_TEXT_LENGTH),
        amounts: stringArray(extractedEntities.amounts ?? [], MAX_ARRAY_ITEMS, MAX_SHORT_TEXT_LENGTH),
        legalCitations: stringArray(extractedEntities.legalCitations ?? [], MAX_ARRAY_ITEMS, MAX_SHORT_TEXT_LENGTH),
      },
      legalAnalysis: legalAnalysis ? {
        claimType: requiredString(legalAnalysis.claimType, MAX_SHORT_TEXT_LENGTH),
        jurisdiction: optionalString(legalAnalysis.jurisdiction, MAX_SHORT_TEXT_LENGTH),
        statuteOfLimitations: optionalString(legalAnalysis.statuteOfLimitations, MAX_SHORT_TEXT_LENGTH),
        potentialDefenses: stringArray(legalAnalysis.potentialDefenses, MAX_LIST_ITEMS, MAX_LONG_TEXT_LENGTH),
        riskAssessment: requiredString(legalAnalysis.riskAssessment, MAX_LONG_TEXT_LENGTH),
      } : undefined,
    };
  } catch {
    return null;
  }
}
