import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({ supabase: { rpc: vi.fn() } }));

import { supabase } from './supabaseClient';
import { createSite, fetchAllRows, isRunActive, monitorErrorMessage, requestSiteScan, type ScanRun } from './monitor.service';

const rpc = vi.mocked(supabase.rpc);

describe('monitorErrorMessage', () => {
  it('maps database codes to plain language', () => {
    expect(monitorErrorMessage({ message: 'SCAN_RATE_LIMIT' })).toMatch(/one extra scan a day/);
    expect(monitorErrorMessage({ message: 'PAGE_LIMIT' })).toBe('A site can have up to 25 pages.');
    expect(monitorErrorMessage({ message: 'permission denied' })).toBe('Something went wrong. Please try again.');
    expect(monitorErrorMessage(null)).toBe('Something went wrong. Please try again.');
  });
});

describe('Monitor writes', () => {
  beforeEach(() => rpc.mockReset());

  it('creates a site through the database function', async () => {
    rpc.mockResolvedValueOnce({ data: 'site-1', error: null } as never);
    expect(await createSite('Shop', 'https://shop.example.com', ['https://shop.example.com/'])).toEqual({ ok: true, value: 'site-1' });
    expect(rpc).toHaveBeenCalledWith('create_site', {
      p_name: 'Shop',
      p_origin: 'https://shop.example.com',
      p_urls: ['https://shop.example.com/'],
    });
  });

  it('returns a friendly message on failure', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'SCAN_IN_PROGRESS' } } as never);
    expect(await requestSiteScan('site-1')).toEqual({ ok: false, message: 'A scan is already running for this site.' });
  });
});

describe('isRunActive', () => {
  it('is true only while queued or running', () => {
    const run = (status: ScanRun['status']) => ({ status }) as ScanRun;
    expect(isRunActive(run('queued'))).toBe(true);
    expect(isRunActive(run('running'))).toBe(true);
    expect(isRunActive(run('completed'))).toBe(false);
    expect(isRunActive(undefined)).toBe(false);
  });
});

describe('fetchAllRows', () => {
  it('keeps reading pages until a short one', async () => {
    const page = vi.fn((from: number) =>
      Promise.resolve({ data: Array.from({ length: from === 0 ? 1000 : 3 }, (_, i) => from + i), error: null }),
    );
    const result = await fetchAllRows<number>(page);
    expect(result.data).toHaveLength(1003);
    expect(page).toHaveBeenCalledTimes(2);
    expect(page).toHaveBeenLastCalledWith(1000, 1999);
  });

  it('stops on an error', async () => {
    const result = await fetchAllRows<number>(() => Promise.resolve({ data: null, error: { message: 'boom' } }));
    expect(result.error).toEqual({ message: 'boom' });
  });
});
