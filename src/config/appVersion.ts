export function normalizeAppVersion(version: string | undefined, fallback: string): string {
  return version?.replace(/^v/, '') || fallback;
}