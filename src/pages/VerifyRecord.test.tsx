import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../test/renderWithTheme';

const verifyRecord = vi.hoisted(() => vi.fn());
vi.mock('../services/remediationRecord.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/remediationRecord.service')>()),
  verifyRecord,
}));

import VerifyRecord from './VerifyRecord';

const ID = '11111111-2222-3333-4444-555555555555';
const RESULT = {
  site_name: 'Shop',
  site_origin: 'https://shop.example.com',
  period_start: '2026-10-01T00:00:00Z',
  period_end: '2026-11-01T00:00:00Z',
  created_at: '2026-11-02T00:00:00Z',
  fingerprint: 'b'.repeat(64),
  matches: true,
};

const renderAt = (id: string) =>
  renderWithTheme(
    <MemoryRouter initialEntries={[`/verify/record/${id}`]}>
      <Routes>
        <Route path="/verify/record/:id" element={<VerifyRecord />} />
      </Routes>
    </MemoryRouter>,
  );

describe('VerifyRecord', () => {
  beforeEach(() => verifyRecord.mockReset());

  it('says when the history is unchanged and shows the fingerprint', async () => {
    verifyRecord.mockResolvedValue({ ok: true, value: RESULT });
    renderAt(ID);
    expect(await screen.findByRole('heading', { name: /has not changed/ })).toBeInTheDocument();
    expect(screen.getByText('b'.repeat(64))).toBeInTheDocument();
    expect(verifyRecord).toHaveBeenCalledWith(ID);
  });

  it('says when the history has changed', async () => {
    verifyRecord.mockResolvedValue({ ok: true, value: { ...RESULT, matches: false } });
    renderAt(ID);
    expect(await screen.findByRole('heading', { name: /has changed since/ })).toBeInTheDocument();
  });

  it('does not query for a malformed id', async () => {
    renderAt('not-a-record');
    expect(await screen.findByText('No record has this link')).toBeInTheDocument();
    expect(verifyRecord).not.toHaveBeenCalled();
  });
});
