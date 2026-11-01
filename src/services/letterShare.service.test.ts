import { describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({ supabase: { rpc: vi.fn() } }));

import { supabase } from './supabaseClient';
import {
  SharedLetterPayload,
  buildShareUrl,
  createShareLink,
  readShareToken,
  toDocumentAnalysis,
} from './letterShare.service';

const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJ-_01234';

const basePayload: SharedLetterPayload = {
  file_name: 'letter.pdf',
  upload_date: null,
  plaintiff_name: 'Jane Doe',
  attorney_name: null,
  attorney_firm: null,
  response_deadline: '2026-12-01',
  settlement_amount: 5000,
  violations_cited: { items: ['WCAG 1.1.1'] },
  analysis_summary: 'Summary',
  risk_level: 'high',
  ai_model_version: 'gemini',
  confidence_scores: null,
  extracted_entities: {},
  analysis_result: null,
  expires_at: '2026-11-08T00:00:00Z',
};

describe('share link URLs', () => {
  it('puts the token in the fragment so it never reaches a server', () => {
    expect(buildShareUrl(TOKEN, 'https://univia.app')).toBe(`https://univia.app/shared/letter#${TOKEN}`);
  });

  it('accepts only well-formed tokens', () => {
    expect(readShareToken(`#${TOKEN}`)).toBe(TOKEN);
    expect(readShareToken('#short')).toBeNull();
    expect(readShareToken(`#${TOKEN}<script>`)).toBeNull();
    expect(readShareToken('')).toBeNull();
  });
});

describe('toDocumentAnalysis', () => {
  it('uses the persisted full analysis when present', () => {
    const full = { ...basePayload, analysis_result: { documentSummary: 'Full', keyPoints: ['k'] } as never };
    expect(toDocumentAnalysis(full).analysis.documentSummary).toBe('Full');
  });

  it('falls back to stored columns for older letters', () => {
    const { analysis } = toDocumentAnalysis(basePayload);
    expect(analysis.documentSummary).toBe('Summary');
    expect(analysis.urgencyLevel).toBe('high');
    expect(analysis.keyPoints).toEqual([]);
    expect(analysis.extractedData.violationsCited).toEqual(['WCAG 1.1.1']);
    expect(analysis.extractedData.settlementAmount).toBe(5000);
    expect(analysis.extractedEntities).toBeUndefined();
  });
});

describe('createShareLink', () => {
  it('returns a fragment URL for the created token', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [{ id: 'l1', token: TOKEN, expires_at: '2026-11-08T00:00:00Z' }],
      error: null,
    } as never);
    const result = await createShareLink('letter-1', 7);
    expect(supabase.rpc).toHaveBeenCalledWith('create_letter_share', { p_letter_id: 'letter-1', p_expires_in_days: 7 });
    expect(result.ok && result.value.url.endsWith(`/shared/letter#${TOKEN}`)).toBe(true);
  });

  it('maps the active-link cap to a readable message', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { message: 'SHARE_LINK_LIMIT' } } as never);
    const result = await createShareLink('letter-1', 7);
    expect(result).toEqual({ ok: false, message: expect.stringMatching(/10 active links/) });
  });
});
