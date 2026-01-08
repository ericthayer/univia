import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Stack,
  Link,
} from '@mui/material';
import { supabase } from '../services/supabaseClient';
import { AccessibilityAudit, Violation } from '../types';
import ComplianceGauge from '../components/ui/ComplianceGauge';
import ViolationCard from '../components/ui/ViolationCard';
import Icon from '../components/ui/Icon';

export default function AuditResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mobileAudit, setMobileAudit] = useState<AccessibilityAudit | null>(null);
  const [desktopAudit, setDesktopAudit] = useState<AccessibilityAudit | null>(null);
  const [mobileViolations, setMobileViolations] = useState<Violation[]>([]);
  const [desktopViolations, setDesktopViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceTab, setDeviceTab] = useState(0);
  const [severityTab, setSeverityTab] = useState(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (id && !loadingRef.current) {
      loadingRef.current = true;
      loadAuditResults();
    }
  }, [id]);

  const loadAuditResults = async () => {
    try {
      const { data: auditsData } = await supabase
        .from('accessibility_audits')
        .select('id, url_scanned, accessibility_score, performance_score, best_practices_score, seo_score, screenshot_url, device_type, created_at')
        .eq('audit_session_id', id);

      if (auditsData && auditsData.length > 0) {
        const mobile = auditsData.find(a => a.device_type === 'mobile');
        const desktop = auditsData.find(a => a.device_type === 'desktop');

        setMobileAudit(mobile || null);
        setDesktopAudit(desktop || null);

        if (mobile) {
          const { data: mobileViolationsData } = await supabase
            .from('violations')
            .select('id, title, description, severity, wcag_guideline, affected_selector, remediation_steps, audit_id, element_screenshot_url, compliance_level, impact')
            .eq('audit_id', mobile.id)
            .order('severity', { ascending: false });
          setMobileViolations(mobileViolationsData || []);
        }

        if (desktop) {
          const { data: desktopViolationsData } = await supabase
            .from('violations')
            .select('id, title, description, severity, wcag_guideline, affected_selector, remediation_steps, audit_id, element_screenshot_url, compliance_level, impact')
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
  };

  const currentAudit = deviceTab === 0 ? mobileAudit : desktopAudit;
  const currentViolations = deviceTab === 0 ? mobileViolations : desktopViolations;

  const getFilteredViolations = () => {
    if (severityTab === 0) return currentViolations;
    const severities = ['critical', 'serious', 'moderate', 'minor'];
    return currentViolations.filter((v) => v.severity === severities[severityTab - 1]);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!mobileAudit && !desktopAudit) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">Audit not found</Alert>
        <Button onClick={() => navigate('/audit')} sx={{ mt: 2 }}>
          Back to Audit
        </Button>
      </Container>
    );
  }

  const filteredViolations = getFilteredViolations();

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<Icon name="arrow_back" />}
            onClick={() => navigate('/audit')}
            sx={{ mb: 2 }}
          >
            Back to Audits
          </Button>
          <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={2}>
            <Typography variant="h3" sx={{ flex: '1 1 400px' }}>
              Accessibility Audit Results
            </Typography>
              <Link variant="h6" href={currentAudit?.url_scanned} target="_blank" rel="noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {currentAudit?.url_scanned}
                <Icon name="open_in_new" />
              </Link>
          </Stack>
        </Box>

        <Card sx={{ mb: 4 }}>
          <Tabs
            value={deviceTab}
            onChange={(_, newValue) => setDeviceTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
            }}
          >
            <Tab
              icon={<Icon name="smartphone" />}
              iconPosition="start"
              label="Mobile"
              disabled={!mobileAudit}
            />
            <Tab
              icon={<Icon name="computer" />}
              iconPosition="start"
              label="Desktop"
              disabled={!desktopAudit}
            />
          </Tabs>
        </Card>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <ComplianceGauge
                      score={currentAudit?.performance_score || 0}
                      size={100}
                      label=""
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Performance
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <ComplianceGauge
                      score={currentAudit?.accessibility_score || 0}
                      size={100}
                      label=""
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Accessibility
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <ComplianceGauge
                      score={currentAudit?.best_practices_score || 0}
                      size={100}
                      label=""
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Best Practices
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <ComplianceGauge
                      score={currentAudit?.seo_score || 0}
                      size={100}
                      label=""
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      SEO
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Issues by Severity
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Critical: ${currentViolations.filter((v) => v.severity === 'critical').length}`}
                    color="error"
                    variant="outlined"
                  />
                  <Chip
                    label={`Serious: ${currentViolations.filter((v) => v.severity === 'serious').length}`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    label={`Moderate: ${currentViolations.filter((v) => v.severity === 'moderate').length}`}
                    color="info"
                    variant="outlined"
                  />
                  <Chip
                    label={`Minor: ${currentViolations.filter((v) => v.severity === 'minor').length}`}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', flex: 1 }}>
            {currentAudit?.screenshot_url ? (
              <Card sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CardContent sx={{ flex: 1, p: '1rem !important' }}>
                  <Stack sx={{ flex: 1 }} justifyContent="center">
                    <Box
                      component="img"
                      src={currentAudit.screenshot_url}
                      alt={`Screenshot of ${currentAudit.url_scanned}`}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: 280,
                        objectFit: 'contain',
                        objectFitPosition: 'top center',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Icon name="image" style={{ fontSize: 48, color: '#94A3B8' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    No screenshot available
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        <Card sx={{ mb: 4 }}>
          <Tabs
            value={severityTab}
            onChange={(_, newValue) => setSeverityTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`All Issues (${currentViolations.length})`} />
            <Tab label={`Critical (${currentViolations.filter((v) => v.severity === 'critical').length})`} />
            <Tab label={`Serious (${currentViolations.filter((v) => v.severity === 'serious').length})`} />
            <Tab label={`Moderate (${currentViolations.filter((v) => v.severity === 'moderate').length})`} />
            <Tab label={`Minor (${currentViolations.filter((v) => v.severity === 'minor').length})`} />
          </Tabs>
        </Card>

        {filteredViolations.length === 0 ? (
          <Alert severity="success" sx={{ mb: 4 }}>
            No violations found in this category. Great job!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredViolations.map((violation) => (
              <Grid size={{ xs: 12 }} key={violation.id}>
                <ViolationCard violation={violation} />
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 6, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Icon name="file_download" />}
          >
            Export PDF Report
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/audit')}
          >
            Run New Audit
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
