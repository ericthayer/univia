export const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
]);

export function getAllowedOrigins(configuredOrigins?: string): Set<string> {
  const origins = configuredOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*');

  return new Set(origins?.length ? origins : DEFAULT_ALLOWED_ORIGINS);
}

export function isAllowedOrigin(
  req: Request,
  allowedOrigins: Set<string>,
  requireOrigin = false,
): boolean {
  const origin = req.headers.get('Origin');
  return (requireOrigin && !origin) ? false : !origin || allowedOrigins.has(origin);
}

export function getCorsHeaders(
  req: Request,
  allowedOrigins: Set<string>,
  requestId?: string
): HeadersInit {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Apikey, X-Client-Info',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  return headers;
}

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function jsonResponse(
  req: Request,
  body: Record<string, unknown>,
  status: number,
  allowedOrigins: Set<string>,
  requestId: string
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req, allowedOrigins, requestId),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
