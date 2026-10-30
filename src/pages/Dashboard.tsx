import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import InteractiveAbbr from '../components/ui/InteractiveAbbr';
import UserAuditMetrics from '../components/audit/UserAuditMetrics';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { TonePill } from '../components/ui/TonePill/TonePill';
import { useAuth } from '../contexts/AuthContext';

const ADA_URL =
  'https://www.ada.gov/topics/intro-to-ada/#:~:text=The%EE%80%80%20Americans%20with%20Disabilities%20Act%EE%80%81%20(ADA)';
const WCAG_URL = 'https://www.w3.org/TR/WCAG22/';

interface Standard {
  icon: string;
  title: string;
  href: string;
  titleAttr?: string;
  body: string;
  points: string[];
}

const STANDARDS: Standard[] = [
  {
    icon: 'balance',
    title: 'Americans with Disabilities Act',
    href: ADA_URL,
    titleAttr: 'Americans with Disabilities Act',
    body: 'The ADA is a civil rights law that prohibits discrimination against individuals with disabilities. It requires equal access to public services, employment, and information technology.',
    points: ['Legal requirement', 'Broad compliance'],
  },
  {
    icon: 'accessibility_new',
    title: 'WCAG 2.2 Standards',
    href: WCAG_URL,
    body: 'Web Content Accessibility Guidelines (WCAG) provide technical standards for creating accessible web content. Version 2.2 includes the latest best practices for inclusivity.',
    points: ['Technical specs', 'Latest version'],
  },
];

interface QuickAction {
  icon: string;
  title: string;
  body: string;
  to?: string;
  disabledHint?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'search', title: 'Run Audit', body: 'Scan your website for accessibility issues', to: '/audit' },
  { icon: 'gavel', title: 'Analyze Letter', body: 'Upload and analyze demand letters', to: '/letters' },
  { icon: 'people', title: 'Find Professionals', body: 'Connect with legal and technical experts', to: '/resources' },
  {
    icon: 'analytics',
    title: 'View Metrics',
    body: 'Track performance and compliance',
    disabledHint: 'Coming in Q2 2026',
  },
];

const iconCircleSx = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  bgcolor: 'action.hover',
  fontSize: '1.25rem',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
} as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isRegistered } = useAuth();

  if (isRegistered && user) {
    return (
      <PageCanvas>
        <UserAuditMetrics userId={user.id} enabled />
      </PageCanvas>
    );
  }

  return (
    <PageCanvas>
      {/* Hero */}
      <Box
        component="section"
        aria-labelledby="home-title"
        sx={{ py: { xs: 6, md: 12 }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <Typography
          id="home-title"
          variant="h1"
          sx={{
            mb: 3,
            fontSize: 'clamp(2.75rem, 7cqw, 4.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
          }}
        >
          <InteractiveAbbr short="A11y" long="Accessibility" title="Accessibility" /> Checkup
        </Typography>
        <Typography
          variant="h6"
          component="p"
          color="text.secondary"
          sx={{ mb: 5, maxWidth: '60ch', fontSize: { xs: '1.0625rem', md: '1.25rem' }, fontWeight: 450, lineHeight: 1.6 }}
        >
          Univia simplifies <a href={WCAG_URL}>Web Content Accessibility Guidelines (WCAG)</a> through intuitive tools
          and actionable insights. Our mission is to make accessibility effortless, ensuring every person enjoys equal
          access to the web by meeting{' '}
          <a href={ADA_URL} title="Americans with Disabilities Act">
            ADA
          </a>{' '}
          compliance.
        </Typography>
        <Stack direction="row" gap={2} flexWrap="wrap" sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Run a Web Accessibility Audit">
            <ArrowButton
              size="large"
              onClick={() => navigate('/audit')}
              startIcon={<Icon name="search" />}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Site Audit
            </ArrowButton>
          </Tooltip>
          <Tooltip title="Analyze ADA Violation Demand Letters">
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/letters')}
              startIcon={<Icon name="upload_file" />}
              sx={{ borderRadius: 999, minHeight: 48, px: 3, flexGrow: { xs: 1, sm: 0 } }}
            >
              Analyze Letter
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      {/* Standards overview */}
      <Box component="section" aria-labelledby="standards-title" sx={{ mb: { xs: 6, md: 8 } }}>
        <SectionHeader id="standards-title" title="Standards Overview" />
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {STANDARDS.map((standard, index) => (
            <BezelCard key={standard.title} component="article" reveal={index} sx={{ height: '100%' }}>
              <Box sx={{ ...iconCircleSx, mb: 3 }} aria-hidden="true">
                <Icon name={standard.icon} />
              </Box>
              <Typography variant="h5" component="h3" sx={{ mb: 1.5, letterSpacing: '-0.01em' }}>
                <a href={standard.href} title={standard.titleAttr}>
                  {standard.title}
                </a>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                {standard.body}
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 'auto' }}>
                {standard.points.map((point) => (
                  <TonePill key={point} variant="outline">
                    {point}
                  </TonePill>
                ))}
              </Stack>
            </BezelCard>
          ))}
        </Box>
      </Box>

      {/* Quick actions */}
      <Box component="section" aria-labelledby="quick-actions-title">
        <SectionHeader id="quick-actions-title" title="Quick Actions" />
        <Box
          component="ul"
          sx={{
            display: 'grid',
            gap: 3,
            m: 0,
            p: 0,
            listStyle: 'none',
            gridTemplateColumns: { xs: '1fr', tiny: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          }}
        >
          {QUICK_ACTIONS.map((action, index) => {
            const disabled = !action.to;
            const content = (
              <>
                <Box sx={{ ...iconCircleSx, mb: 2, opacity: disabled ? 0.55 : 1 }} aria-hidden="true">
                  <Icon name={action.icon} />
                </Box>
                <Typography variant="h6" component="p" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.body}
                </Typography>
                {disabled && (
                  <Box sx={{ mt: 1.5 }}>
                    <TonePill variant="outline">{action.disabledHint}</TonePill>
                  </Box>
                )}
              </>
            );

            return (
              <Box component="li" key={action.title} sx={{ minWidth: 0 }}>
                <BezelCard
                  interactive={!disabled}
                  padding="none"
                  reveal={index}
                  style={{ height: '100%' }}
                  sx={{ height: '100%' }}
                >
                  {disabled ? (
                    <Box sx={{ p: 3, cursor: 'not-allowed', flex: 1 }} aria-disabled="true">
                      {content}
                    </Box>
                  ) : (
                    <CardActionArea
                      onClick={() => navigate(action.to as string)}
                      sx={{ p: 3, flex: 1, borderRadius: 'inherit', display: 'block' }}
                    >
                      {content}
                    </CardActionArea>
                  )}
                </BezelCard>
              </Box>
            );
          })}
        </Box>
      </Box>
    </PageCanvas>
  );
}
