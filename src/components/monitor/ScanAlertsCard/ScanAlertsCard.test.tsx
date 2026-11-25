import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/monitor.service', () => ({ getMonitorAccess: vi.fn() }));
vi.mock('../../../services/notifications.service', () => ({ getScanAlerts: vi.fn(), setScanAlerts: vi.fn() }));

import { getMonitorAccess } from '../../../services/monitor.service';
import { getScanAlerts, setScanAlerts } from '../../../services/notifications.service';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { ScanAlertsCard } from './ScanAlertsCard';

const access = vi.mocked(getMonitorAccess);
const load = vi.mocked(getScanAlerts);
const save = vi.mocked(setScanAlerts);

describe('ScanAlertsCard', () => {
  beforeEach(() => {
    access.mockReset();
    load.mockReset();
    save.mockReset();
  });

  it('renders nothing without Monitor access', async () => {
    access.mockResolvedValueOnce({ ok: true, value: false });
    const { container } = renderWithTheme(<ScanAlertsCard />);
    await waitFor(() => expect(access).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(load).not.toHaveBeenCalled();
  });

  it('turns alerts off and announces it', async () => {
    access.mockResolvedValueOnce({ ok: true, value: true });
    load.mockResolvedValueOnce({ ok: true, value: true });
    save.mockResolvedValueOnce({ ok: true, value: false });
    const user = userEvent.setup();
    renderWithTheme(<ScanAlertsCard />);
    const toggle = await screen.findByRole('switch', { name: /email me when a scan finds new issues/i });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(save).toHaveBeenCalledWith(false);
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Scan alerts are off.');
  });

  it('puts the switch back when saving fails', async () => {
    access.mockResolvedValueOnce({ ok: true, value: true });
    load.mockResolvedValueOnce({ ok: true, value: false });
    save.mockResolvedValueOnce({ ok: false, message: 'Your alert setting could not be saved. Try again.' });
    const user = userEvent.setup();
    renderWithTheme(<ScanAlertsCard />);
    const toggle = await screen.findByRole('switch');
    await user.click(toggle);
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(screen.getByRole('status')).toHaveTextContent('could not be saved');
  });
});
