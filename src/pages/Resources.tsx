import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Rating from '@mui/material/Rating';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { supabase } from '../services/supabaseClient';
import { ProfessionalResource } from '../types';
import Icon from '../components/ui/Icon';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { TonePill } from '../components/ui/TonePill/TonePill';
import { FilterSelect } from '../components/admin/FilterSelect/FilterSelect';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'lawyer', label: 'Lawyers' },
  { value: 'developer', label: 'Developers' },
  { value: 'consultant', label: 'Consultants' },
  { value: 'auditor', label: 'Auditors' },
] as const;

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 22rem), 1fr))',
  gap: 3,
  listStyle: 'none',
  m: 0,
  p: 0,
} as const;

// Icon names must exist in `components/ui/Icon` (it renders nothing for unknown names).
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'lawyer':
      return 'gavel';
    case 'developer':
      return 'tools';
    case 'consultant':
      return 'people';
    case 'auditor':
      return 'fact_check';
    default:
      return 'person';
  }
};

interface ResourceCardProps {
  resource: ProfessionalResource;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

function ResourceCard({ resource, reveal }: ResourceCardProps) {
  const titleId = `resource-${resource.id}-name`;
  const specializations = resource.specializations?.slice(0, 3) ?? [];

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
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor: 'action.hover',
            color: 'text.primary',
            fontSize: '1.25rem',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            ...theme.applyStyles('dark', {
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }),
          })}
        >
          <Icon name={getTypeIcon(resource.type)} />
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
          {resource.rating && (
            <Rating
              value={resource.rating}
              readOnly
              size="small"
              sx={{ mt: 0.75, '& .MuiRating-iconFilled': { color: 'text.primary' } }}
            />
          )}
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
        {!resource.pro_bono && resource.hourly_rate_min && resource.hourly_rate_max && (
          <TonePill variant="outline">{`$${resource.hourly_rate_min}-${resource.hourly_rate_max}/hr`}</TonePill>
        )}
      </Box>

      {resource.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {resource.description}
        </Typography>
      )}

      {!resource.pro_bono && specializations.length > 0 && (
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

      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Icon name="email" />}
          sx={{ borderRadius: 999, minHeight: 44 }}
        >
          Contact
        </Button>
        {(resource.pro_bono || resource.website) && (
          <Button
            variant="outlined"
            startIcon={<Icon name="language" />}
            sx={{ borderRadius: 999, minHeight: 44, flexShrink: 0 }}
          >
            Website
          </Button>
        )}
      </Box>
    </BezelCard>
  );
}

export default function Resources() {
  const [resources, setResources] = useState<ProfessionalResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<ProfessionalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data } = await supabase
        .from('professional_resources')
        .select('*')
        .order('verified', { ascending: false })
        .order('rating', { ascending: false });

      setResources(data || []);
      setFilteredResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = useCallback(() => {
    let filtered = resources;

    if (typeFilter !== 'all') {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm, typeFilter]);

  useEffect(() => {
    filterResources();
  }, [filterResources]);

  const proBonoResources = filteredResources.filter((r) => r.pro_bono);
  const paidResources = filteredResources.filter((r) => !r.pro_bono);

  return (
    <PageCanvas maxWidth="lg">
      <PageHeader
        eyebrow="Directory"
        title="Professional Resources"
        description="Connect with verified accessibility professionals, legal experts, and technical specialists."
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          mb: { xs: 4, md: 6 },
        }}
      >
        <TextField
          type="search"
          placeholder="Search by name, location, or specialization…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Search resources by name, location, or specialization' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" style={{ fontSize: 18 }} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: '1 1 18rem',
            // The theme paints the field root with a square background; round it to match the pill outline.
            borderRadius: 999,
            '& .MuiOutlinedInput-root': { borderRadius: 999, minHeight: 44, pl: 1.75 },
          }}
        />
        <FilterSelect
          id="resource-type-filter"
          label="Type"
          value={typeFilter}
          options={TYPE_OPTIONS}
          onChange={setTypeFilter}
        />
        <Button
          variant="outlined"
          startIcon={<Icon name="filter_list" />}
          sx={{ borderRadius: 999, minHeight: 44, px: 2.5, flexShrink: 0 }}
        >
          More Filters
        </Button>
      </Box>

      {loading && (
        <Box sx={GRID_SX} aria-busy="true" aria-label="Loading resources">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={260}
              sx={{ borderRadius: (theme) => `${theme.surfaces.shellRadius}px` }}
            />
          ))}
        </Box>
      )}

      {proBonoResources.length > 0 && (
        <Box component="section" aria-labelledby="pro-bono-title" sx={{ mb: { xs: 4, md: 6 } }}>
          <SectionHeader id="pro-bono-title" title="Pro Bono Resources" meta={proBonoResources.length} dense />
          <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 3 }}>
            Free or reduced-cost services for qualifying businesses
          </Typography>
          <Box component="ul" sx={GRID_SX}>
            {proBonoResources.map((resource, index) => (
              <Box component="li" key={resource.id} sx={{ minWidth: 0 }}>
                <ResourceCard resource={resource} reveal={index} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {paidResources.length > 0 && (
        <Box component="section" aria-labelledby="all-resources-title">
          <SectionHeader id="all-resources-title" title="All Resources" meta={paidResources.length} />
          <Box component="ul" sx={GRID_SX}>
            {paidResources.map((resource, index) => (
              <Box component="li" key={resource.id} sx={{ minWidth: 0 }}>
                <ResourceCard resource={resource} reveal={index} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {filteredResources.length === 0 && !loading && (
        <BezelCard component="section" aria-label="No matching resources">
          <EmptyState
            icon="search"
            title="No resources found matching your criteria"
            description="Try a different name, location, or type."
            action={
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
                sx={{ borderRadius: 999, minHeight: 44, px: 2.5 }}
              >
                Clear Filters
              </Button>
            }
            compact
          />
        </BezelCard>
      )}
    </PageCanvas>
  );
}
