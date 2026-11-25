const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The token from the query string or a JSON body, if it is a UUID. */
export async function readToken(req: Request): Promise<string | null> {
  const fromQuery = new URL(req.url).searchParams.get('token');
  if (fromQuery && UUID.test(fromQuery)) return fromQuery.toLowerCase();
  if ((req.headers.get('Content-Type') ?? '').includes('application/json')) {
    const body = await req.json().catch(() => null) as { token?: unknown } | null;
    if (typeof body?.token === 'string' && UUID.test(body.token)) return body.token.toLowerCase();
  }
  return null;
}
