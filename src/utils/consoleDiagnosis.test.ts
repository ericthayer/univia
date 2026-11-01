import { describe, expect, it } from 'vitest';
import { diagnoseConsoleMessage } from './consoleDiagnosis';

describe('diagnoseConsoleMessage', () => {
  it('explains a 403', () => {
    expect(diagnoseConsoleMessage('Failed to load resource: the server responded with a status of 403 ()')).toMatch(/403 Forbidden/);
  });

  it('explains a 401 and a 404 differently', () => {
    expect(diagnoseConsoleMessage('the server responded with a status of 401 ()')).toMatch(/401 Unauthorized/);
    expect(diagnoseConsoleMessage('the server responded with a status of 404 ()')).toMatch(/404 Not Found/);
  });

  it('explains a refused frame', () => {
    expect(
      diagnoseConsoleMessage("Refused to display 'https://codepen.io/' in a frame because it set 'X-Frame-Options' to 'sameorigin'."),
    ).toMatch(/does not allow being embedded/);
  });

  it('returns undefined when unsure', () => {
    expect(diagnoseConsoleMessage('Something odd happened')).toBeUndefined();
  });
});
