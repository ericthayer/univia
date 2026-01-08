import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TIER_CONFIG, UserTier } from '../types/auth';
import Icon from '../components/ui/Icon';

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
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Start with our free Basic plan. Upgrade anytime for more features.
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {tiers.map((tier) => {
          const config = TIER_CONFIG[tier];
          const isCurrentTier = profile?.tier === tier;
          const isFree = tier === 'basic';
          const isPopular = tier === 'pro';

          return (
            <Grid key={tier} size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={isPopular ? 8 : 2}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isPopular ? 2 : 0,
                  borderColor: isPopular ? 'primary.main' : 'transparent',
                }}
              >
                {isPopular && (
                  <Chip
                    label="Most Popular"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                    }}
                  />
                )}

                {isCurrentTier && (
                  <Chip
                    label="Current Plan"
                    color="success"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                    }}
                  />
                )}

                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {config.name}
                </Typography>

                <Box mb={3}>
                  <Typography variant="h3" fontWeight={700} component="span">
                    {isFree ? 'Free' : config.price.split('/')[0]}
                  </Typography>
                  {!isFree && (
                    <Typography variant="h6" component="span" color="text.secondary">
                      /month
                    </Typography>
                  )}
                  {isFree && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Forever
                    </Typography>
                  )}
                </Box>

                <Stack spacing={2} mb={4} flexGrow={1}>
                  {config.features.map((feature, index) => (
                    <Box key={index} display="flex" alignItems="flex-start" gap={1}>
                      <Icon name="check_circle" style={{ fontSize: 20, color: '#2e7d32', marginTop: 2 }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Stack>

                <Button
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
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Box mt={8} textAlign="center">
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Frequently Asked Questions
        </Typography>

        <Stack spacing={3} mt={4} maxWidth="md" mx="auto">
          <Paper sx={{ p: 3, textAlign: 'left' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Is the Basic plan really free forever?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Yes! Our Basic plan is completely free with no time limit. We believe everyone
              should have access to accessibility auditing tools.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, textAlign: 'left' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Can I upgrade or downgrade anytime?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Yes, you can change your plan at any time. Upgrades take effect immediately, and
              downgrades take effect at the end of your billing cycle.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, textAlign: 'left' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              What payment methods do you accept?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.
              Enterprise customers can arrange for invoice-based billing.
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Container>
  );
}
