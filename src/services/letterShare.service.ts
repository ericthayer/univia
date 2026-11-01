import { supabase } from './supabaseClient';
import { ROUTE_PATHS } from '../config/navigation';
import type { DocumentAnalysis } from '../components/documents/DocumentUploadDialog';

/**
 * Share links for demand-letter analyses. All access goes through SECURITY
 * DEFINER RPCs (see supabase/migrations/20261101120000_letter_share_links.sql);
 * the share table itself is closed to the browser.
 */

export const SHARE_EXPIRY_OPTIONS = [
  { days: 1, label: '24 hours' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
] as const;

export type ShareExpiryDays = (typeof SHARE_EXPIRY_OPTIONS)[number]['days'];

export interface CreatedShareLink {
  id: string;
  url: string;
  expiresAt: string;
}

export interface ActiveShareLink {
  id: string;
  createdAt: string;
  expiresAt: string;
  accessCount: number;
  lastAccessedAt: string | null;
}

export type ShareResult<T> = { ok: true; value: T } | { ok: false; message: string };

/** Public payload returned by `get_shared_letter_analysis`. */
export interface SharedLetterPayload {
  file_name: string;
  upload_date: string | null;
  plaintiff_name: string | null;
  attorney_name: string | null;
  attorney_firm: string | null;
  response_deadline: string | null;
  settlement_amount: number | null;
  violations_cited: { items?: string[] } | string[] | null;
  analysis_summary: string | null;
  risk_level: string | null;
  ai_model_version: string | null;
  confidence_scores: Record<string, number> | null;
  extracted_entities: Partial<NonNullable<DocumentAnalysis['analysis']['extractedEntities']>> | null;
  analysis_result: DocumentAnalysis['analysis'] | null;
  expires_at: string;
}

/** The token travels in the URL fragment so it is never sent to a server or in a Referer header. */
export function buildShareUrl(token: string, origin: string = window.location.origin): string {
  return `${origin}${ROUTE_PATHS.SHARED_LETTER}#${token}`;
}

export function readShareToken(hash: string): string | null {
  const token = hash.replace(/^#/, '');
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

function friendlyError(error: { message?: string } | null): string {
  if (error?.message?.includes('SHARE_LINK_LIMIT')) {
    return 'This letter already has 10 active links. Revoke one before creating another.';
  }
  if (error?.message?.includes('authentication required')) {
    return 'Your session has ended. Sign in again to share this analysis.';
  }
  if (error?.message?.includes('letter not found')) {
    return 'We could not find this letter in your account.';
  }
  return 'Something went wrong. Please try again.';
}

export async function createShareLink(letterId: string, days: ShareExpiryDays): Promise<ShareResult<CreatedShareLink>> {
  const { data, error } = await supabase.rpc('create_letter_share', {
    p_letter_id: letterId,
    p_expires_in_days: days,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return { ok: false, message: friendlyError(error) };
  return { ok: true, value: { id: row.id, url: buildShareUrl(row.token), expiresAt: row.expires_at } };
}

export async function listShareLinks(letterId: string): Promise<ShareResult<ActiveShareLink[]>> {
  const { data, error } = await supabase.rpc('list_letter_shares', { p_letter_id: letterId });
  if (error) return { ok: false, message: friendlyError(error) };
  const rows = (data ?? []) as Array<{
    id: string;
    created_at: string;
    expires_at: string;
    access_count: number;
    last_accessed_at: string | null;
  }>;
  return {
    ok: true,
    value: rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      accessCount: row.access_count,
      lastAccessedAt: row.last_accessed_at,
    })),
  };
}

export async function revokeShareLink(linkId: string): Promise<ShareResult<boolean>> {
  const { data, error } = await supabase.rpc('revoke_letter_share', { p_link_id: linkId });
  if (error) return { ok: false, message: friendlyError(error) };
  return { ok: true, value: data === true };
}

/** Returns null for unknown, expired, and revoked links alike. */
export async function fetchSharedLetter(token: string): Promise<ShareResult<SharedLetterPayload | null>> {
  const { data, error } = await supabase.rpc('get_shared_letter_analysis', { p_token: token });
  if (error) return { ok: false, message: 'We could not load this shared analysis. Please try again.' };
  return { ok: true, value: (data as SharedLetterPayload | null) ?? null };
}

const RISK_TO_URGENCY: Record<string, DocumentAnalysis['analysis']['urgencyLevel']> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

function violationList(value: SharedLetterPayload['violations_cited']): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return Array.isArray(value.items) ? value.items : undefined;
}

/**
 * Builds the view model for `InlineAnalysisResults`. Letters saved before the
 * full analysis was persisted fall back to the stored columns.
 */
export function toDocumentAnalysis(payload: SharedLetterPayload): DocumentAnalysis {
  if (payload.analysis_result) {
    return { success: true, analysis: payload.analysis_result };
  }

  const entities = payload.extracted_entities;
  const hasEntities = Boolean(entities && Object.values(entities).some((v) => Array.isArray(v) && v.length > 0));

  return {
    success: true,
    analysis: {
      documentSummary: payload.analysis_summary ?? '',
      documentType: 'Legal demand letter',
      keyPoints: [],
      recommendedActions: [],
      additionalResources: [],
      urgencyLevel: RISK_TO_URGENCY[payload.risk_level ?? ''] ?? 'medium',
      extractedData: {
        plaintiffName: payload.plaintiff_name ?? undefined,
        attorneyName: payload.attorney_name ?? undefined,
        attorneyFirm: payload.attorney_firm ?? undefined,
        responseDeadline: payload.response_deadline ?? undefined,
        settlementAmount: payload.settlement_amount != null ? Number(payload.settlement_amount) : undefined,
        violationsCited: violationList(payload.violations_cited),
      },
      confidenceScores: payload.confidence_scores ?? undefined,
      extractedEntities: hasEntities
        ? {
            persons: entities?.persons ?? [],
            organizations: entities?.organizations ?? [],
            dates: entities?.dates ?? [],
            amounts: entities?.amounts ?? [],
            legalCitations: entities?.legalCitations,
          }
        : undefined,
    },
  };
}
