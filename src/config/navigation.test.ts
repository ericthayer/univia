import { describe, expect, it } from 'vitest';
import { getHeaderMenuItems, getSidebarMenuItems } from './navigation';

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('Monitor in the main navigation', () => {
  it('is shown to signed-in accounts with Monitor access, after Analyze Letter', () => {
    expect(ids(getHeaderMenuItems(true, { monitorAccess: true }))).toEqual(['dashboard', 'audit', 'letters', 'monitor']);
    expect(ids(getSidebarMenuItems(true, { monitorAccess: true }))).toEqual(['dashboard', 'audit', 'letters', 'monitor']);
  });

  it('is hidden from signed-in accounts without access, and while access is unknown', () => {
    expect(ids(getHeaderMenuItems(true, { monitorAccess: false }))).not.toContain('monitor');
    expect(ids(getHeaderMenuItems(true))).not.toContain('monitor');
    expect(ids(getSidebarMenuItems(true))).not.toContain('monitor');
  });

  it('is never shown to signed-out visitors', () => {
    expect(ids(getHeaderMenuItems(false, { monitorAccess: true }))).toEqual(['dashboard', 'audit', 'letters', 'sign-in']);
    expect(ids(getSidebarMenuItems(false, { monitorAccess: true }))).not.toContain('monitor');
  });
});
