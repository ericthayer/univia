import { execFileSync } from 'node:child_process';

/**
 * Resolves the release version at build time from the latest `vX.Y.Z` git tag
 * reachable from HEAD. Git tags are the release source of truth; package.json
 * is no longer bumped because `main` only accepts changes through pull requests.
 * Returns undefined when git or tags are unavailable so callers can fall back.
 */
export function resolveReleaseVersion(cwd: string = process.cwd()): string | undefined {
  try {
    const tag = execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return tag || undefined;
  } catch {
    return undefined;
  }
}
