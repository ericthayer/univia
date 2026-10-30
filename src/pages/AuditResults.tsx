import { useEffect, useState, useRef, useCallback } from 'react';
import { Link as RouterLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { supabase } from '../services/supabaseClient';
import { AccessibilityAudit, Violation } from '../types';
import ComplianceGauge from '../components/ui/ComplianceGauge';
import ViolationCard from '../components/ui/ViolationCard';
import Icon from '../components/ui/Icon';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { SegmentedToggleGroup } from '../components/ui/SegmentedToggleGroup/SegmentedToggleGroup';
import { TonePill } from '../components/ui/TonePill/TonePill';
import { SEVERITIES, severityTone } from '../components/ui/violationSeverity';

const WIDE = '@container (min-width: 1000px)';

const SCORE_CELLS: ReadonlyArray<{ key: 'performance_score' | 'accessibility_score' | 'best_practices_score' | 'seo_score'; label: string }> = [
  { key: 'performance_score', label: 'Performance' },
  { key: 'accessibility_score', label: 'Accessibility' },
  { key: 'best_practices_score', label: 'Best Practices' },
  { key: 'seo_score', label: 'SEO' },
];

export default function AuditResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routePartialAudit = (location.state as { partialAudit?: boolean } | null)?.partialAudit === true;
  const [mobileAudit, setMobileAudit] = useState<AccessibilityAudit | null>(null);
  const [desktopAudit, setDesktopAudit] = useState<AccessibilityAudit | null>(null);
  const [mobileViolations, setMobileViolations] = useState<Violation[]>([]);
  const [desktopViolations, setDesktopViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceTab, setDeviceTab] = useState(0);
  const [severityTab, setSeverityTab] = useState(0);
  const loadingRef = useRef(false);

  const loadAuditResults = useCallback(async () => {
    try {
      const { data: auditsData } = await supabase
        .from('accessibility_audits')
        .select('id, business_id, url_scanned, accessibility_score, performance_score, best_practices_score, seo_score, screenshot_url, device_type, created_at')
        .eq('audit_session_id', id);

      if (auditsData && auditsData.length > 0) {
        const mobile = auditsData.find(a => a.device_type === 'mobile');
        const desktop = auditsData.find(a => a.device_type === 'desktop');

        setMobileAudit(mobile || null);
        setDesktopAudit(desktop || null);

        if (mobile) {
          const { data: mobileViolationsData } = await supabase
            .from('violations')
            .select('id, title, description, severity, wcag_guideline, affected_selector, remediation_steps, audit_id, element_screenshot_url, compliance_level, impact, created_at')
            .eq('audit_id', mobile.id)
            .order('severity', { ascending: false });
          setMobileViolations(mobileViolationsData || []);
        }

        if (desktop) {
          const { data: desktopViolationsData } = await supabase
            .from('violations')
            .select('id, title, description, severity, wcag_guideline, affected_selector, remediation_steps, audit_id, element_screenshot_url, compliance_level, impact, created_at')
            .eq('audit_id', desktop.id)
            .order('severity', { ascending: false });
          setDesktopViolations(desktopViolationsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading audit results:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [id]);

  useEffect(() => {
    if (id && !loadingRef.current) {
      loadingRef.current = true;
      loadAuditResults();
    }
  }, [id, loadAuditResults]);

  const currentAudit = deviceTab === 0 ? mobileAudit : desktopAudit;
  const currentViolations = deviceTab === 0 ? mobileViolations : desktopViolations;
  const partialAudit = routePartialAudit || (Boolean(mobileAudit) !== Boolean(desktopAudit));

  const getFilteredViolations = () => {
    if (severityTab === 0) return currentViolations;
    const severities = ['critical', 'serious', 'moderate', 'minor'];
    return currentViolations.filter((v) => v.severity === severities[severityTab - 1]);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80dvh' }}>
        <CircularProgress size={60} aria-label="Loading audit results" />
      </Box>
    );
  }

  if (!mobileAudit && !desktopAudit) {
    return (
      <PageCanvas maxWidth="lg">
        <EmptyState
          icon="error"
          title="Audit not found"
          description="We couldn't find that audit. It may have been removed, or the link may be incorrect."
          action={
            <ArrowButton component={RouterLink} to="/audit">
              Back to Audit
            </ArrowButton>
          }
        />
      </PageCanvas>
    );
  }

  const filteredViolations = getFilteredViolations();
  const severityCounts = SEVERITIES.map((severity) => ({
    severity,
    count: currentViolations.filter((v) => v.severity === severity).length,
  }));
  const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <PageCanvas maxWidth="lg">
      <Button
        component={RouterLink}
        to="/audit"
        startIcon={<Icon name="arrow_back" />}
        sx={{ alignSelf: 'flex-start', borderRadius: 999, minHeight: 44, px: 2, ml: -2, mb: 1, textDecoration: 'none !important' }}
      >
        Back to Audit
      </Button>

      <PageHeader
        eyebrow="Lighthouse"
        title="Accessibility Audit Results"
        titleComponent="h1"
        description={
          currentAudit?.url_scanned ? (
            <Link
              href={currentAudit.url_scanned}
              target="_blank"
              rel="noreferrer"
              aria-label={`${currentAudit.url_scanned} (opens in a new tab)`}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, overflowWrap: 'anywhere' }}
            >
              {currentAudit.url_scanned}
              <Icon name="open_in_new" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden />
            </Link>
          ) : undefined
        }
        actions={
          <SegmentedToggleGroup
            exclusive
            size="small"
            value={deviceTab}
            onChange={(_, next: number | null) => next !== null && setDeviceTab(next)}
            aria-label="Device"
          >
            <ToggleButton value={0} disabled={!mobileAudit} aria-label="Mobile results">
              <Icon name="smartphone" style={{ fontSize: 16 }} aria-hidden />
              Mobile
            </ToggleButton>
            <ToggleButton value={1} disabled={!desktopAudit} aria-label="Desktop results">
              <Icon name="computer" style={{ fontSize: 16 }} aria-hidden />
              Desktop
            </ToggleButton>
          </SegmentedToggleGroup>
        }
      />

      {partialAudit && (
        <Alert severity="warning" role="status" sx={{ mb: 3, mt: -2 }}>
          This report includes the device audit that completed successfully. The other device could not be audited and can be retried later.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: '1fr',
          mb: { xs: 4, md: 6 },
          [WIDE]: { gridTemplateColumns: 'minmax(0, 8fr) minmax(0, 4fr)' },
        }}
      >
        <Box sx={{ display: 'grid', gap: 3, alignContent: 'start', minWidth: 0 }}>
          <BezelCard component="section" aria-labelledby="audit-scores-title" reveal={0}>
            <SectionHeader id="audit-scores-title" component="h2" title="Scores" dense />
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: 'repeat(auto-fit, minmax(7.5rem, 1fr))',
                justifyItems: 'center',
              }}
            >
              {SCORE_CELLS.map(({ key, label }) => (
                <Box key={key} sx={{ textAlign: 'center' }}>
                  <ComplianceGauge score={currentAudit?.[key] || 0} size={100} label="" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </BezelCard>

          <BezelCard component="section" aria-labelledby="audit-severity-title" reveal={1}>
            <SectionHeader id="audit-severity-title" component="h2" title="Issues by Severity" dense />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {severityCounts.map(({ severity, count }) => (
                <TonePill key={severity} tone={severityTone(severity)} dot>
                  {severity}
                  <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {count}
                  </Box>
                </TonePill>
              ))}
            </Box>
          </BezelCard>
        </Box>

        <BezelCard component="section" aria-label="Page screenshot" reveal={2} sx={{ justifyContent: 'center' }}>
          {currentAudit?.screenshot_url ? (
            <Box
              component="img"
              src={currentAudit.screenshot_url}
              alt={`Screenshot of ${currentAudit.url_scanned}`}
              loading="lazy"
              decoding="async"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 360,
                objectFit: 'contain',
                objectPosition: 'top center',
                borderRadius: '10px',
                border: 1,
                borderColor: 'divider',
              }}
            />
          ) : (
            <EmptyState compact icon="image" title="No screenshot available" />
          )}
        </BezelCard>
      </Box>

      <BezelCard component="section" aria-labelledby="audit-issues-title" padding="none" reveal={3} sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3 }}>
          <SectionHeader id="audit-issues-title" component="h2" title="Issues" meta={`${currentViolations.length} total`} dense />
        </Box>
        <Tabs
          value={severityTab}
          onChange={(_, newValue: number) => setSeverityTab(newValue)}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          aria-label="Filter issues by severity"
          sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 2 } }}
        >
          <Tab
            id="severity-tab-0"
            aria-controls="severity-panel"
            label={`All Issues (${currentViolations.length})`}
          />
          {severityCounts.map(({ severity, count }, index) => (
            <Tab
              key={severity}
              id={`severity-tab-${index + 1}`}
              aria-controls="severity-panel"
              label={`${titleCase(severity)} (${count})`}
            />
          ))}
        </Tabs>

        <Box role="tabpanel" id="severity-panel" aria-labelledby={`severity-tab-${severityTab}`}>
          {filteredViolations.length === 0 ? (
            <EmptyState
              compact
              icon="check_circle"
              title="No violations found in this category"
              description="Great job!"
            />
          ) : (
            <Box component="ul" sx={{ m: 0, p: 0 }}>
              {filteredViolations.map((violation) => (
                <ViolationCard key={violation.id} violation={violation} />
              ))}
            </Box>
          )}
        </Box>
      </BezelCard>

      <Box sx={{ mt: { xs: 4, md: 6 }, display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<Icon name="file_download" />}
          sx={{ borderRadius: 999, minHeight: 48 }}
        >
          Export PDF Report
        </Button>
        <ArrowButton onClick={() => navigate('/audit')}>Run New Audit</ArrowButton>
      </Box>
    </PageCanvas>
  );
}
