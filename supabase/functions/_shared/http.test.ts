import { describe, expect, it } from 'vitest';
import {
  createRequestId,
  getAllowedOrigins,
  getCorsHeaders,
  isAllowedOrigin,
  jsonResponse,
} from './http';

describe('http boundary helpers', () => {
  it('parses a configured origin allowlist and ignores wildcard entries', () => {
    expect([...getAllowedOrigins('https://app.example, *, https://preview.example')]).toEqual([
      'https://app.example',
      'https://preview.example',
    ]);
    expect([...getAllowedOrigins('')]).toEqual([
      'http://localhost:5173',
      'http://localhost:4173',
    ]);
  });

  it('allows requests without an Origin by default and only configured browser origins', () => {
    const allowedOrigins = getAllowedOrigins('https://app.example');
    expect(isAllowedOrigin(new Request('https://edge.example'), allowedOrigins)).toBe(true);
    expect(isAllowedOrigin(new Request('https://edge.example', {
      headers: { Origin: 'https://app.example' },
    }), allowedOrigins)).toBe(true);
    expect(isAllowedOrigin(new Request('https://edge.example', {
      headers: { Origin: 'https://evil.example' },
    }), allowedOrigins)).toBe(false);
  });

  it('requires an allowlisted Origin when configured for anonymous access', () => {
    const allowedOrigins = getAllowedOrigins('https://app.example');
    expect(isAllowedOrigin(new Request('https://edge.example'), allowedOrigins, true)).toBe(false);
    expect(isAllowedOrigin(new Request('https://edge.example', {
      headers: { Origin: 'https://app.example' },
    }), allowedOrigins, true)).toBe(true);
    expect(isAllowedOrigin(new Request('https://edge.example', {
      headers: { Origin: 'https://evil.example' },
    }), allowedOrigins, true)).toBe(false);
  });

  it('returns narrow CORS headers and a request correlation header', () => {
    const requestId = createRequestId();
    const headers = new Headers(getCorsHeaders(
      new Request('https://edge.example', { headers: { Origin: 'https://app.example' } }),
      getAllowedOrigins('https://app.example'),
      requestId
    ));

    expect(headers.get('Access-Control-Allow-Origin')).toBe('https://app.example');
    expect(headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(headers.get('X-Request-ID')).toBe(requestId);
  });

  it('does not grant an unknown origin an allow-origin header', () => {
    const headers = new Headers(getCorsHeaders(
      new Request('https://edge.example', { headers: { Origin: 'https://evil.example' } }),
      getAllowedOrigins('https://app.example'),
      'request-id'
    ));

    expect(headers.has('Access-Control-Allow-Origin')).toBe(false);
  });

  it('returns non-cacheable JSON responses with the request ID', async () => {
    const response = jsonResponse(
      new Request('https://edge.example'),
      { error: 'Request failed' },
      422,
      getAllowedOrigins('https://app.example'),
      'request-id'
    );

    expect(response.status).toBe(422);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Request-ID')).toBe('request-id');
    await expect(response.json()).resolves.toEqual({ error: 'Request failed' });
  });
});
