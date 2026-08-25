import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasFailedDevice, LighthouseAuditError, requestLighthouseAudit } from './lighthouseAudit.service';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('requestLighthouseAudit', () => {
  beforeEach(() => fetchMock.mockReset());

  it('normalizes bare domains and returns a valid audit session', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      success: true,
      session_id: 'session-id',
      mobile: { status: 'completed', audit_id: 'mobile-id' },
      desktop: { status: 'completed', audit_id: 'desktop-id' },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(requestLighthouseAudit('example.com', 'session-token')).resolves.toMatchObject({
      session_id: 'session-id',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/run-lighthouse-audit'),
      expect.objectContaining({ body: JSON.stringify({ url: 'https://example.com/' }) }),
    );
  });

  it('maps structured server errors without exposing provider details', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'Audit service unavailable', errorType: 'INTERNAL_ERROR' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'request-id' },
    }));

    await expect(requestLighthouseAudit('example.com', 'session-token')).rejects.toMatchObject({
      message: 'Audit service is temporarily unavailable. Please try again shortly.',
      status: 503,
      requestId: 'request-id',
      code: 'INTERNAL_ERROR',
    });
  });

  it('rejects incomplete successful responses', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    await expect(requestLighthouseAudit('example.com', 'session-token')).rejects.toBeInstanceOf(LighthouseAuditError);
  });

  it('accepts a session when one device completed and the other failed', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      success: true,
      session_id: 'partial-session-id',
      mobile: { status: 'completed', audit_id: 'mobile-id' },
      desktop: { status: 'failed', error_type: 'PAGESPEED_TIMEOUT' },
    }), { status: 200 }));

    await expect(requestLighthouseAudit('example.com', 'session-token')).resolves.toMatchObject({
      session_id: 'partial-session-id',
      desktop: { status: 'failed' },
    });
  });

  it('normalizes legacy completed device records during deployment overlap', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      success: true,
      session_id: 'legacy-session-id',
      mobile: { audit_id: 'mobile-id', device_type: 'mobile' },
      desktop: { audit_id: 'desktop-id', device_type: 'desktop' },
    }), { status: 200 }));

    await expect(requestLighthouseAudit('example.com', 'session-token')).resolves.toMatchObject({
      session_id: 'legacy-session-id',
      mobile: { status: 'completed', audit_id: 'mobile-id' },
      desktop: { status: 'completed', audit_id: 'desktop-id' },
    });
  });

  it('identifies a partial device result without treating it as a request failure', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      success: true,
      session_id: 'partial-session-id',
      mobile: { status: 'completed', audit_id: 'mobile-id' },
      desktop: { status: 'failed', error_type: 'PAGESPEED_TIMEOUT' },
    }), { status: 200 }));

    const result = await requestLighthouseAudit('example.com', 'session-token');

    expect(hasFailedDevice(result)).toBe(true);
  });

  it('does not make unauthenticated requests', async () => {
    await expect(requestLighthouseAudit('example.com', null)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});