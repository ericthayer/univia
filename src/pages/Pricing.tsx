import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserTier } from '../types/auth';
import { USER_TIERS } from '../config/tierConfig';
import Icon from '../components/ui/Icon';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { TonePill } from '../components/ui/TonePill/TonePill';

const FAQS = [
  {
    question: 'Is the Basic plan really free forever?',
    answer:
      'Yes! Our Basic plan is completely free with no time limit. We believe everyone should have access to accessibility auditing tools.',
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer:
      'Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can arrange for invoice-based billing.',
  },
] as const;

export default function Pricing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = (tier: UserTier) => {
    if (!user) {
      navigate('/');
      return;
    }

    if (tier === 'basic') {
      navigate('/settings');
    } else {
      alert(`Upgrade to ${tier} coming soon! This is a prototype feature.`);
    }
  };

  const tiers: UserTier[] = ['basic', 'pro', 'enterprise'];

  return (
    <PageCanvas maxWidth="lg">
      <PageHeader
        eyebrow="Plans"
        title="Choose Your Plan"
        description="Start with our free Basic plan. Upgrade anytime for more features."
      />

      <Box
        component="ul"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
          gap: 3,
          listStyle: 'none',
          m: 0,
          p: 0,
          mb: { xs: 6, md: 10 },
        }}
      >
        {tiers.map((tier, index) => {
          const config = USER_TIERS[tier];
          const isCurrentTier = profile?.tier === tier;
          const isFree = tier === 'basic';
          const isPopular = tier === 'pro';
          const price = isFree ? 'Free' : config.price.split('/')[0];
          // "/month" only reads correctly after a numeric price ("$49"), not after "Custom".
          const showPerMonth = !isFree && price.startsWith('$');
          const titleId = `plan-${tier}-name`;

          return (
            <Box component="li" key={tier} sx={{ display: 'flex', minWidth: 0 }}>
              <BezelCard
                component="article"
                aria-labelledby={titleId}
                accent={isPopular ? 'neutral' : undefined}
                reveal={index}
                sx={{ gap: 3 }}
                style={{ width: '100%' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Typography id={titleId} variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                    {config.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {isPopular && <TonePill variant="solid">Most Popular</TonePill>}
                    {isCurrentTier && (
                      <TonePill tone="success" dot>
                        Current Plan
                      </TonePill>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="metric" component="p">
                      {price}
                    </Typography>
                    {showPerMonth && (
                      <Typography variant="body1" color="text.secondary" component="span">
                        /month
                      </Typography>
                    )}
                  </Box>
                  {isFree && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Forever
                    </Typography>
                  )}
                </Box>

                <Box
                  component="ul"
                  sx={{
                    listStyle: 'none',
                    m: 0,
                    p: 0,
                    pt: 3,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {config.features.map((feature: string) => (
                    <Box component="li" key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: 20,
                          height: 20,
                          mt: 0.25,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          bgcolor: 'action.hover',
                          color: 'success.main',
                          fontSize: '0.875rem',
                        }}
                      >
                        <Icon name="check_circle" />
                      </Box>
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Box>

                <ArrowButton
                  variant={isPopular ? 'contained' : 'outlined'}
                  size="large"
                  fullWidth
                  onClick={() => handleSelectPlan(tier)}
                  disabled={isCurrentTier}
                >
                  {isCurrentTier
                    ? 'Current Plan'
                    : isFree
                      ? user
                        ? 'Your Plan'
                        : 'Get Started'
                      : 'Upgrade'}
                </ArrowButton>
              </BezelCard>
            </Box>
          );
        })}
      </Box>

      <Box component="section" aria-labelledby="pricing-faq-title" sx={{ maxWidth: 800 }}>
        <SectionHeader id="pricing-faq-title" title="Frequently Asked Questions" />
        <BezelCard padding="none" sx={{ overflow: 'hidden' }}>
          {FAQS.map(({ question, answer }) => (
            <Accordion
              key={question}
              disableGutters
              square
              elevation={0}
              slotProps={{ heading: { component: 'h3' } }}
              sx={{
                bgcolor: 'transparent',
                backgroundImage: 'none',
                border: 0,
                '&::before': { display: 'none' },
                '& + &': { borderTop: '1px solid', borderColor: 'divider' },
              }}
            >
              <AccordionSummary
                expandIcon={<Icon name="expand_more" style={{ fontSize: 24 }} aria-hidden />}
                sx={{
                  minHeight: 64,
                  px: 3,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    transition: (theme) =>
                      `transform ${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}`,
                  },
                }}
              >
                <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                  {question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pt: 0, pb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </BezelCard>
      </Box>
    </PageCanvas>
  );
}
