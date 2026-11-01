import { describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({ supabase: {} }));

import { buildLetterFilePath, getLetterFileKind } from './letterFiles.service';

describe('buildLetterFilePath', () => {
  it('scopes the file under the user folder that storage RLS requires', () => {
    expect(buildLetterFilePath('user-1', 'letter-9', 'Demand Letter (final).pdf')).toBe(
      'user-1/letter-9/Demand_Letter_final_.pdf',
    );
  });

  it('falls back to a generic name when nothing safe is left', () => {
    expect(buildLetterFilePath('u', 'l', '???')).toBe('u/l/document');
  });
});

describe('getLetterFileKind', () => {
  it.each([
    ['u/l/a.PDF', 'pdf'],
    ['u/l/scan.jpeg', 'image'],
    ['u/l/scan.webp', 'image'],
    ['u/l/notes.txt', 'other'],
  ])('%s -> %s', (path, kind) => {
    expect(getLetterFileKind(path)).toBe(kind);
  });
});
