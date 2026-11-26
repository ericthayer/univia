import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ user: { id: 'u1' } as { id: string } | null, isRegistered: true }));
const access = vi.hoisted(() => ({ getMonitorAccess: vi.fn() }));

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../services/monitor.service', () => access);

import { resetMonitorNavAccessCache, useMonitorNavAccess } from './useMonitorNavAccess';

describe('useMonitorNavAccess', () => {
  beforeEach(() => {
    resetMonitorNavAccessCache();
    auth.user = { id: 'u1' };
    auth.isRegistered = true;
  });
  afterEach(() => vi.clearAllMocks());

  it('is true once the server confirms access, and asks only once per account', async () => {
    access.getMonitorAccess.mockResolvedValue({ ok: true, value: true });
    const first = renderHook(() => useMonitorNavAccess());
    const second = renderHook(() => useMonitorNavAccess());
    expect(first.result.current).toBe(false);
    await waitFor(() => expect(first.result.current).toBe(true));
    await waitFor(() => expect(second.result.current).toBe(true));
    expect(access.getMonitorAccess).toHaveBeenCalledTimes(1);
  });

  it('stays false without access or when the lookup fails', async () => {
    access.getMonitorAccess.mockResolvedValueOnce({ ok: true, value: false });
    const denied = renderHook(() => useMonitorNavAccess());
    await waitFor(() => expect(access.getMonitorAccess).toHaveBeenCalledTimes(1));
    expect(denied.result.current).toBe(false);

    access.getMonitorAccess.mockResolvedValueOnce({ ok: false, message: 'offline' });
    const failed = renderHook(() => useMonitorNavAccess());
    await waitFor(() => expect(access.getMonitorAccess).toHaveBeenCalledTimes(2));
    expect(failed.result.current).toBe(false);
  });

  it('retries after a lookup that throws', async () => {
    access.getMonitorAccess.mockRejectedValueOnce(new Error('network'));
    const failed = renderHook(() => useMonitorNavAccess());
    await waitFor(() => expect(access.getMonitorAccess).toHaveBeenCalledTimes(1));
    expect(failed.result.current).toBe(false);

    access.getMonitorAccess.mockResolvedValueOnce({ ok: true, value: true });
    const retried = renderHook(() => useMonitorNavAccess());
    await waitFor(() => expect(retried.result.current).toBe(true));
    expect(access.getMonitorAccess).toHaveBeenCalledTimes(2);
  });

  it('does not ask for guests or signed-out visitors', () => {
    auth.isRegistered = false;
    const { result } = renderHook(() => useMonitorNavAccess());
    expect(result.current).toBe(false);
    expect(access.getMonitorAccess).not.toHaveBeenCalled();
  });
});
