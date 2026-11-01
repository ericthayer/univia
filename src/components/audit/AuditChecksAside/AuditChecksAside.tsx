import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowButton } from '../../ui/ArrowButton/ArrowButton';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import Icon from '../../ui/Icon';

const AUDIT_CHECKS = [
  { icon: 'contrast', title: 'Color Contrast', description: 'Text is readable for users with low vision' },
  { icon: 'keyboard', title: 'Keyboard Navigation', description: 'Every interactive element works without a mouse' },
  { icon: 'image', title: 'Alternative Text', description: 'Images have descriptive alt text for screen readers' },
  { icon: 'language', title: 'ARIA Labels', description: 'Semantic markup and ARIA attributes are valid' },
  { icon: 'text_fields', title: 'Form Labels', description: 'Form inputs have associated labels' },
  { icon: 'article', title: 'Document Structure', description: 'Headings and landmarks follow a logical order' },
] as const;

/**
 * Side panel for the Site Audit page. Mirrors the Analyze Letter "What happens
 * next?" aside: a short list in nested circles, then a route to professional help.
 */
export function AuditChecksAside() {
  const theme = useTheme();

  const nestedCircleSx = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    fontSize: '1rem',
    color: 'text.primary',
    bgcolor: 'action.hover',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    ...theme.applyStyles('dark', {
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    }),
  } as const;

  return (
    <BezelCard component="aside" aria-labelledby="audit-checks-title" reveal={1}>
      <Typography id="audit-checks-title" variant="h6" component="h2" sx={{ mb: 2 }}>
        What we check
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
        {AUDIT_CHECKS.map((check) => (
          <Box component="li" key={check.title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box aria-hidden="true" sx={nestedCircleSx}>
              <Icon name={check.icon} />
            </Box>
            <Box sx={{ minWidth: 0, pt: 0.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {check.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {check.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box aria-hidden="true" sx={{ ...nestedCircleSx, width: 36, height: 36, fontSize: '1.125rem' }}>
            <Icon name="people" />
          </Box>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
            Need help fixing issues?
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Our Professional Resources directory lists accessibility specialists who can help you remediate.
        </Typography>
        <ArrowButton variant="text" component={RouterLink} to="/resources" sx={{ px: 1.5, minHeight: 40 }}>
          Browse professionals
        </ArrowButton>
      </Box>
    </BezelCard>
  );
}

export default AuditChecksAside;
