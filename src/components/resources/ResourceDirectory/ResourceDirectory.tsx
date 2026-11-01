import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useProfessionalResources, type ResourceTypeFilter } from '../../../hooks/useProfessionalResources';
import Icon from '../../ui/Icon';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { ArrowButton } from '../../ui/ArrowButton/ArrowButton';
import { FilterSelect } from '../../admin/FilterSelect/FilterSelect';
import { srOnly } from '../../ui/srOnly';
import { ResourceCard } from '../ResourceCard/ResourceCard';
import { autoGridSx } from '../resourceStyles';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'lawyer', label: 'Lawyers' },
  { value: 'developer', label: 'Developers' },
  { value: 'consultant', label: 'Consultants' },
  { value: 'auditor', label: 'Auditors' },
] as const;

const GRID_SX = autoGridSx('22rem');

/** Supabase-backed list of vetted professionals, with search, type filter, and two distinct empty states. */
export function ResourceDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceTypeFilter>('all');
  const { loading, total, filtered, proBono, paid } = useProfessionalResources(searchTerm, typeFilter);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
  };

  return (
    <Box component="section" aria-labelledby="directory-title" aria-busy={loading}>
      <SectionHeader id="directory-title" title="Professional directory" meta={total > 0 ? total : undefined} />

      {total > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: { xs: 3, md: 4 } }}>
          <TextField
            type="search"
            placeholder="Search by name, location, or specialization…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              htmlInput: { 'aria-label': 'Search professionals by name, location, or specialization' },
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
              '& .MuiOutlinedInput-root': { minHeight: 44, pl: 1.75 },
            }}
          />
          <FilterSelect
            id="resource-type-filter"
            label="Type"
            value={typeFilter}
            options={TYPE_OPTIONS}
            onChange={(value) => setTypeFilter(value as ResourceTypeFilter)}
          />
          <Box component="p" aria-live="polite" sx={srOnly}>
            {`${filtered.length} of ${total} professionals shown`}
          </Box>
        </Box>
      )}

      {loading && (
        <Box sx={GRID_SX}>
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

      {proBono.length > 0 && (
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <SectionHeader title="Pro bono" component="h3" meta={proBono.length} dense />
          <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 3 }}>
            Free or reduced-cost services for qualifying businesses
          </Typography>
          <Box component="ul" sx={GRID_SX}>
            {proBono.map((resource, index) => (
              <Box component="li" key={resource.id} sx={{ minWidth: 0 }}>
                <ResourceCard resource={resource} reveal={index} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {paid.length > 0 && (
        <Box>
          {proBono.length > 0 && <SectionHeader title="All professionals" component="h3" meta={paid.length} dense />}
          <Box component="ul" sx={GRID_SX}>
            {paid.map((resource, index) => (
              <Box component="li" key={resource.id} sx={{ minWidth: 0 }}>
                <ResourceCard resource={resource} reveal={index} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {!loading && total === 0 && (
        <BezelCard>
          <EmptyState
            icon="verified_user"
            title="Vetted listings are on the way"
            description={
              <>
                We list professionals only after checking their credentials.
                <br />
                Until then, start with the references above.
              </>
            }
            action={
              <ArrowButton component={RouterLink} to="/letters">
                Analyze a Letter
              </ArrowButton>
            }
            compact
          />
        </BezelCard>
      )}

      {!loading && total > 0 && filtered.length === 0 && (
        <BezelCard>
          <EmptyState
            icon="search"
            title="No professionals match your search"
            description="Try a different name, location, or type."
            action={
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ minHeight: 44, px: 2.5 }}
              >
                Clear Filters
              </Button>
            }
            compact
          />
        </BezelCard>
      )}
    </Box>
  );
}
