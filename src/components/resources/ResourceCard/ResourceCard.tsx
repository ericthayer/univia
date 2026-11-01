import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import type { ProfessionalResource } from '../../../types';
import Icon from '../../ui/Icon';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { TonePill } from '../../ui/TonePill/TonePill';
import { srOnly } from '../../ui/srOnly';
import { iconCircleSx } from '../resourceStyles';

// Icon names must exist in `components/ui/Icon` (it renders nothing for unknown names).
const TYPE_ICON: Record<ProfessionalResource['type'], string> = {
  lawyer: 'gavel',
  developer: 'tools',
  consultant: 'people',
  auditor: 'fact_check',
};

export interface ResourceCardProps {
  resource: ProfessionalResource;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

/** One vetted directory listing. Contact and Website render only when the listing has them. */
export function ResourceCard({ resource, reveal }: ResourceCardProps) {
  const titleId = `resource-${resource.id}-name`;
  const specializations = resource.specializations?.slice(0, 3) ?? [];
  const hasRate = !resource.pro_bono && resource.hourly_rate_min && resource.hourly_rate_max;

  return (
    <BezelCard
      component="article"
      aria-labelledby={titleId}
      interactive
      reveal={reveal}
      accent={resource.pro_bono ? 'success' : undefined}
      sx={{ height: '100%', gap: 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
        <Box aria-hidden="true" sx={iconCircleSx(48)}>
          <Icon name={TYPE_ICON[resource.type] ?? 'person'} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography id={titleId} variant="h6" component="h3" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {resource.name}
          </Typography>
          {resource.location && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {resource.location}
            </Typography>
          )}
          {resource.rating ? (
            <Rating
              value={resource.rating}
              readOnly
              size="small"
              sx={{ mt: 0.75, '& .MuiRating-iconFilled': { color: 'text.primary' } }}
            />
          ) : null}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TonePill>{resource.type}</TonePill>
        {resource.verified && (
          <TonePill tone="success" dot>
            Verified
          </TonePill>
        )}
        {resource.pro_bono && <TonePill tone="success">Pro bono</TonePill>}
        {hasRate && (
          <TonePill variant="outline">{`$${resource.hourly_rate_min}-${resource.hourly_rate_max}/hr`}</TonePill>
        )}
      </Box>

      {resource.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {resource.description}
        </Typography>
      )}

      {specializations.length > 0 && (
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ mb: 1 }}>
            Specializations
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {specializations.map((spec) => (
              <TonePill key={spec} variant="outline">
                {spec}
              </TonePill>
            ))}
          </Box>
        </Box>
      )}

      {(resource.contact_email || resource.website) && (
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1 }}>
          {resource.contact_email && (
            <Button
              variant="contained"
              fullWidth
              href={`mailto:${resource.contact_email}`}
              startIcon={<Icon name="email" />}
              sx={{ minHeight: 44 }}
            >
              Contact<Box component="span" sx={srOnly}>{` ${resource.name}`}</Box>
            </Button>
          )}
          {resource.website && (
            <Button
              variant="outlined"
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Icon name="language" />}
              sx={{ minHeight: 44, flexShrink: 0 }}
            >
              Website
              <Box component="span" sx={srOnly}>{` for ${resource.name} (opens in a new tab)`}</Box>
            </Button>
          )}
        </Box>
      )}
    </BezelCard>
  );
}
