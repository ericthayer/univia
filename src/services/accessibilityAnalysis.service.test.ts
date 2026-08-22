import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAccessibilityAnalysis } from './accessibilityAnalysis.service';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

describe('requestAccessibilityAnalysis', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('sends the bounded report to the authenticated analysis endpoint', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ analysis: 'Use descriptive link text.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      requestAccessibilityAnalysis({
        content: 'Audit finding',
        accessToken: 'session-token',
      }),
    ).resolves.toBe('Use descriptive link text.');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/generate-accessibility-analysis'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
          'Content-Type': 'application/json',
          apikey: expect.stringMatching(/^sb_publishable_/),
        }),
        body: JSON.stringify({ content: 'Audit finding' }),
      }),
    );
  });

  it('rejects unauthenticated requests before making a network call', async () => {
    await expect(
      requestAccessibilityAnalysis({ content: 'Audit finding', accessToken: null }),
    ).rejects.toThrow('Authentication required');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects content over the server limit', async () => {
    await expect(
      requestAccessibilityAnalysis({
        content: 'a'.repeat(50_001),
        accessToken: 'session-token',
      }),
    ).rejects.toThrow('Report content is too long');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not expose provider details from failed responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Gemini quota and internal provider detail' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      requestAccessibilityAnalysis({
        content: 'Audit finding',
        accessToken: 'session-token',
      }),
    ).rejects.toThrow('Analysis service unavailable');
  });
});
