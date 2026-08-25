const MAX_AUDIT_URL_LENGTH = 2_048;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export interface AuditRequest {
  url: string;
  business_id?: string;
}

export type AuditValidationResult =
  | { ok: true; value: AuditRequest }
  | { ok: false; status: 400 | 422; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPublicIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  return first !== 0 &&
    first !== 10 &&
    first !== 127 &&
    !(first === 100 && second >= 64 && second <= 127) &&
    !(first === 169 && second === 254) &&
    !(first === 172 && second >= 16 && second <= 31) &&
    !(first === 192 && second === 0) &&
    !(first === 192 && second === 168) &&
    !(first === 198 && (second === 18 || second === 19 || second === 51)) &&
    !(first === 203 && second === 0 && octets[2] === 113) &&
    first < 224;
}

function parseIpv6(address: string): number[] | null {
  const normalized = address.toLowerCase().split('%')[0];
  if (!normalized || normalized.includes(':::')) return null;

  const halves = normalized.split('::');
  if (halves.length > 2) return null;

  const parsePart = (part: string): number[] | null => {
    if (!part) return [];
    const pieces = part.split(':');
    const values: number[] = [];
    for (const piece of pieces) {
      if (!/^[0-9a-f]{1,4}$/.test(piece)) return null;
      values.push(Number.parseInt(piece, 16));
    }
    return values;
  };

  const left = parsePart(halves[0]);
  const right = parsePart(halves[1] ?? '');
  if (!left || !right) return null;

  if (halves.length === 1) {
    return left.length === 8 ? left : null;
  }

  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function isPublicIpv6(address: string): boolean {
  const groups = parseIpv6(address);
  if (!groups) return false;

  const first = groups[0];
  const second = groups[1];
  const isUnspecified = groups.every((group) => group === 0);
  const isUniqueLocal = (first & 0xfe00) === 0xfc00;
  const isLinkLocal = (first & 0xffc0) === 0xfe80;
  const isMulticast = (first & 0xff00) === 0xff00;
  const isDocumentation = first === 0x2001 && second === 0x0db8;
  const isBenchmark = first === 0x2001 && second === 0x0002;
  const isIpv4Mapped = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;

  if (isUnspecified || isUniqueLocal || isLinkLocal || isMulticast || isDocumentation || isBenchmark || isIpv4Mapped) {
    return false;
  }

  return first !== 0 && first !== 0x0100 && first !== 0x3fff;
}

export function isPublicIp(address: string): boolean {
  if (address.includes(':')) return isPublicIpv6(address);
  return isPublicIpv4(address);
}

function isIpLiteral(hostname: string): boolean {
  const unbracketed = hostname.replace(/^\[|\]$/g, '');
  return unbracketed.includes(':') || /^\d+(?:\.\d+){3}$/.test(unbracketed) || /^\d+$/.test(unbracketed);
}

export function validateAuditUrl(rawUrl: unknown): URL | null {
  if (typeof rawUrl !== 'string' || !rawUrl.trim() || rawUrl.length > MAX_AUDIT_URL_LENGTH) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const labels = hostname.split('.');
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== '443') ||
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.') ||
    hostname.includes('xn--') ||
    isIpLiteral(hostname) ||
    hostname.length > 253 ||
    labels.some((label) => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))
  ) {
    return null;
  }

  return url;
}

export function validateAuditRequest(body: unknown): AuditValidationResult {
  if (!isRecord(body)) {
    return { ok: false, status: 400, error: 'Invalid request body' };
  }

  const keys = Object.keys(body);
  if (keys.some((key) => key !== 'url' && key !== 'business_id')) {
    return { ok: false, status: 422, error: 'Invalid request fields' };
  }

  const url = validateAuditUrl(body.url);
  if (!url) {
    return { ok: false, status: 422, error: 'URL must be a public HTTPS address' };
  }

  if (body.business_id !== undefined && (typeof body.business_id !== 'string' || !UUID_PATTERN.test(body.business_id))) {
    return { ok: false, status: 422, error: 'Invalid business identifier' };
  }

  return { ok: true, value: { url: url.toString(), business_id: body.business_id as string | undefined } };
}

export async function resolvesToPublicIps(hostname: string): Promise<boolean> {
  if (isIpLiteral(hostname)) return false;

  try {
    const records = await Promise.all([
      Deno.resolveDns(hostname, 'A').catch(() => [] as string[]),
      Deno.resolveDns(hostname, 'AAAA').catch(() => [] as string[]),
    ]);
    const addresses = records.flat();
    return addresses.length > 0 && addresses.every(isPublicIp);
  } catch {
    return false;
  }
}
