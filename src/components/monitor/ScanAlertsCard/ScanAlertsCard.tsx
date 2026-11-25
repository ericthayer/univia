import { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { getMonitorAccess } from '../../../services/monitor.service';
import { getScanAlerts, setScanAlerts } from '../../../services/notifications.service';

type CardState = { status: 'hidden' } | { status: 'ready'; enabled: boolean };

/**
 * Account Settings card for Monitor scan alerts. Renders nothing for
 * accounts without Monitor access. Saves on toggle and announces the result.
 */
export function ScanAlertsCard() {
  const [state, setState] = useState<CardState>({ status: 'hidden' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const access = await getMonitorAccess();
      if (!active || !access.ok || !access.value) return;
      const alerts = await getScanAlerts();
      if (!active) return;
      setState({ status: 'ready', enabled: alerts.ok ? alerts.value : true });
      if (!alerts.ok) setMessage(alerts.message);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'hidden') return null;

  const toggle = async (enabled: boolean) => {
    setSaving(true);
    setMessage('');
    setState({ status: 'ready', enabled });
    const result = await setScanAlerts(enabled);
    setSaving(false);
    if (!result.ok) {
      setState({ status: 'ready', enabled: !enabled });
      setMessage(result.message);
      return;
    }
    setMessage(enabled ? 'Scan alerts are on.' : 'Scan alerts are off.');
  };

  return (
    <BezelCard component="section" aria-labelledby="alerts-heading">
      <SectionHeader id="alerts-heading" title="Email alerts" dense />
      <Typography id="alerts-description" variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2 }}>
        One email after a Monitor scan finds new issues, issues that came back, or fixes it could not confirm. Nothing is sent when a scan finds nothing new.
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={state.enabled}
            onChange={(event) => void toggle(event.target.checked)}
            disabled={saving}
            slotProps={{ input: { role: 'switch', 'aria-describedby': 'alerts-description' } }}
          />
        }
        label="Email me when a scan finds new issues"
      />
      <Typography role="status" aria-live="polite" variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: '1.5em' }}>
        {message}
      </Typography>
    </BezelCard>
  );
}
