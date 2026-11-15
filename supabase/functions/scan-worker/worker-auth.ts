// The worker is called only by pg_cron through pg_net, with a shared secret.
// Compared in constant time so the secret cannot be guessed byte by byte.

const MIN_SECRET_LENGTH = 32;

export function isAuthorizedWorkerCall(expected: string | undefined, provided: string | null): boolean {
  const secret = expected?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH || !provided) return false;

  const encoder = new TextEncoder();
  const a = encoder.encode(secret);
  const b = encoder.encode(provided);
  let difference = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) {
    difference |= a[i] ^ (b[i % (b.length || 1)] ?? 0);
  }
  return difference === 0;
}
