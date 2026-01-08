import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Avatar,
  Rating,
  Grid,
} from '@mui/material';
import { supabase } from '../services/supabaseClient';
import { ProfessionalResource } from '../types';
import Icon from '../components/ui/Icon';

export default function Resources() {
  const [resources, setResources] = useState<ProfessionalResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<ProfessionalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchTerm, typeFilter, resources]);

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

  const filterResources = () => {
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
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lawyer':
        return 'gavel';
      case 'developer':
        return 'code';
      case 'consultant':
        return 'business_center';
      case 'auditor':
        return 'fact_check';
      default:
        return 'person';
    }
  };

  const proBonoResources = filteredResources.filter((r) => r.pro_bono);
  const paidResources = filteredResources.filter((r) => !r.pro_bono);

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
            Professional Resources
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Connect with verified accessibility professionals, legal experts, and technical specialists
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by name, location, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon name="search" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="lawyer">Lawyers</MenuItem>
                <MenuItem value="developer">Developers</MenuItem>
                <MenuItem value="consultant">Consultants</MenuItem>
                <MenuItem value="auditor">Auditors</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Icon name="filter_list" />}
                sx={{ height: '56px' }}
              >
                More Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {proBonoResources.length > 0 && (
          <>
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                  p: 2,
                  bgcolor: 'success.light',
                  borderRadius: 2,
                }}
              >
                <Icon name="volunteer_activism" style={{ color: '#10B981', fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.dark' }}>
                    Pro Bono Resources
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Free or reduced-cost services for qualifying businesses
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {proBonoResources.map((resource) => (
                  <Grid size={{ xs: 12, md: 6 }} key={resource.id}>
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 8,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: 'success.main',
                              mr: 2,
                            }}
                          >
                            <Icon name={getTypeIcon(resource.type)} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {resource.name}
                              </Typography>
                              {resource.verified && (
                                <Icon name="verified" style={{ color: '#0D9488', fontSize: 20 }} />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {resource.location}
                            </Typography>
                            {resource.rating && (
                              <Rating value={resource.rating} readOnly size="small" />
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip label={resource.type.toUpperCase()} size="small" color="primary" />
                          <Chip label="PRO BONO" size="small" color="success" />
                        </Box>

                        {resource.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {resource.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            startIcon={<Icon name="email" />}
                          >
                            Contact
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Icon name="language" />}
                          >
                            Website
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}

        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          All Resources
        </Typography>

        <Grid container spacing={3}>
          {paidResources.map((resource) => (
            <Grid size={{ xs: 12, md: 6 }} key={resource.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main',
                        mr: 2,
                      }}
                    >
                      <Icon name={getTypeIcon(resource.type)} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {resource.name}
                        </Typography>
                        {resource.verified && (
                          <Icon name="verified" style={{ color: '#0D9488', fontSize: 20 }} />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {resource.location}
                      </Typography>
                      {resource.rating && (
                        <Rating value={resource.rating} readOnly size="small" />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={resource.type.toUpperCase()} size="small" color="primary" />
                    {resource.hourly_rate_min && resource.hourly_rate_max && (
                      <Chip
                        label={`$${resource.hourly_rate_min}-${resource.hourly_rate_max}/hr`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {resource.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {resource.description}
                    </Typography>
                  )}

                  {resource.specializations && resource.specializations.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Specializations:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {resource.specializations.slice(0, 3).map((spec, idx) => (
                          <Chip key={idx} label={spec} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      startIcon={<Icon name="email" />}
                    >
                      Contact
                    </Button>
                    {resource.website && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Icon name="language" />}
                      >
                        Website
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredResources.length === 0 && !loading && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No resources found matching your criteria
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
