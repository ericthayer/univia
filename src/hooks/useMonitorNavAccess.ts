import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMonitorAccess } from '../services/monitor.service';

// One lookup per signed-in account, shared by the header and the drawer.
const cache = new Map<string, Promise<boolean>>();

function lookup(userId: string): Promise<boolean> {
  let pending = cache.get(userId);
  if (!pending) {
    pending = getMonitorAccess().then(
      (result) => result.ok && result.value,
      () => false,
    );
    // A failed or thrown lookup hides the item but is not cached, so the next mount retries.
    void pending.then((allowed) => {
      if (!allowed) cache.delete(userId);
    });
    cache.set(userId, pending);
  }
  return pending;
}

/**
 * Whether to show Monitor in the main navigation. Access is decided by the
 * server (my_monitor_access); the item stays hidden until it answers yes.
 */
export function useMonitorNavAccess(): boolean {
  const { user, isRegistered } = useAuth();
  const userId = isRegistered ? user?.id : undefined;
  const [access, setAccess] = useState<{ userId: string; allowed: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void lookup(userId).then((allowed) => {
      if (active) setAccess({ userId, allowed });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return Boolean(userId && access?.userId === userId && access.allowed);
}

/** Test-only: forget cached answers. */
export function resetMonitorNavAccessCache(): void {
  cache.clear();
}
