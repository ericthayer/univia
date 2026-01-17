import { Box, Container, Typography, Tooltip, Button, Card, CardContent, CardActionArea, Grid, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import InteractiveAbbr from '../components/ui/InteractiveAbbr';
import UserAuditMetrics from '../components/audit/UserAuditMetrics';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box>
      <Box
        sx={{
          bgcolor: 'light-dark(hsl(0 0% 98.82% / 1), hsl(0 0% 6% / 1))',
          borderBottom: '1px solid',
          borderColor: 'divider',
          containerType: 'inline-size',
          minHeight: { sm: '50svh' },
          placeContent: 'center',
          py: 'clamp(4rem, 15cqh, 10rem)',
          px: 'clamp(2rem, 8cqw, 8rem)',
          '@media (35rem < height < 54rem)': {
            height: { sm: 'calc(100dvh - 65px)' },
          },
        }}
      >
        <Stack alignItems="center">
          <Container maxWidth="lg">
            
            <Typography
              variant="h1"
              sx={{
                mb: 2,
                fontSize: 'clamp(3.125rem, 8dvmin, 4.75rem)',
              }}
            >
            <InteractiveAbbr short="A11y" long="Accessibility" title="Accessibility" /> Checkup
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                mb: 5,
                maxWidth: '60ch',
                fontSize: { xs: '1.125rem', md: '1.25rem'},
              }}
            >
              Univia simplifies <a href="https://www.w3.org/TR/WCAG22/">Web Content Accessibility Guidelines (WCAG)</a> through intuitive tools and actionable insights. Our mission is to make accessibility effortless, ensuring every person enjoys equal access to the web by meeting <a href="https://www.ada.gov/topics/intro-to-ada/#:~:text=The%EE%80%80%20Americans%20with%20Disabilities%20Act%EE%80%81%20(ADA)" title="Americans with Disabilities Act">ADA</a> compliance.
            </Typography>
            <Box sx={{ display: 'flex', gap: 'clamp(1rem, 3.5cqw, 2rem)', flexWrap: 'wrap' }}>
              <Tooltip title="Run a Web Accessibility Audit">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/audit')}
                  startIcon={<Icon name="search" />}
                  sx={{
                    flexGrow: { xs: 1, sm: 0 },
                  }}
                >
                  Site Audit
                </Button>
              </Tooltip>
              <Tooltip title="Analyze ADA Violation Demand Letters">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/letters')}
                  startIcon={<Icon name="upload_file" />}
                  sx={{
                    flexGrow: { xs: 1, sm: 0 },
                  }}
                >
                  Analyze Letter
                </Button>
              </Tooltip>
            </Box>
          </Container>
        </Stack>
      </Box>

      <Container maxWidth="lg" sx={{ py: 'clamp(4rem, 6dvh, 8rem)', pl: { xs: '2rem', lg: '1.5rem !important' }, pr: { xs: '2rem', lg: '1.5rem !important' } }}>
        {/* Standards Overview */}
        <Stack gap={6}>
          <Box sx={{
            '.MuiCard-root': {
              height: '100%',
            },
          }}>
            <Typography variant="h4" component="h2" sx={{ mb: 4, fontWeight: 700 }}>
              Standards Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      <Icon name="balance" style={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                      <a href="https://www.ada.gov/topics/intro-to-ada/#:~:text=The%EE%80%80%20Americans%20with%20Disabilities%20Act%EE%80%81%20(ADA)" title="Americans with Disabilities Act">Americans with Disabilities Act</a>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      The ADA is a civil rights law that prohibits discrimination against individuals with disabilities. It requires equal access to public services, employment, and information technology.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="check_circle" style={{ fontSize: 16 }} />
                        Legal requirement
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="check_circle" style={{ fontSize: 16 }} />
                        Broad compliance
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      <Icon name="accessibility_new" style={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                      <a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2 Standards</a>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      Web Content Accessibility Guidelines (WCAG) provide technical standards for creating accessible web content. Version 2.2 includes the latest best practices for inclusivity.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="check_circle" style={{ fontSize: 16 }} />
                        Technical specs
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon name="check_circle" style={{ fontSize: 16 }} />
                        Latest version
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Stack>

        {/* User Audit Metrics - Only shown when logged in */}
        {user && (
          <Box sx={{ mt: 6 }}>
            <UserAuditMetrics
              userId={user.id}
              enabled={!!user}
              fullWidth={false}
            />
          </Box>
        )}

        <Stack gap={6} sx={{ mt: 'clamp(5rem, 7cqh, 8rem)' }}>
          <Box sx={{
            '.MuiCard-root': {
              height: '100%',
            },
          }}
            >
            <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, tiny: 6, md: 3 }}>
                <Card
                  sx={{
                    borderColor: 'divider',
                    transition: 'border-color 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardActionArea onClick={() => navigate('/audit')}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 1,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Icon name="search" style={{ fontSize: 28 }} />
                      </Box>
                      <Typography variant="h6" component="p" sx={{ fontWeight: 600, mb: 1 }}>
                        Run Audit
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Scan your website for accessibility issues
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
  
              <Grid size={{ xs: 12, tiny: 6, md: 3 }}>           
                <Card
                  sx={{
                    borderColor: 'divider',
                    transition: 'border-color 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardActionArea onClick={() => navigate('/letters')}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 1,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Icon name="gavel" style={{ fontSize: 28 }} />
                      </Box>
                      <Typography variant="h6" component="p" sx={{ fontWeight: 600, mb: 1 }}>
                        Analyze Letter
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload and analyze demand letters
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
  
              <Grid size={{ xs: 12, tiny: 6, md: 3 }}>          
                <Card
                  sx={{
                    borderColor: 'divider',
                    transition: 'border-color 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardActionArea onClick={() => navigate('/resources')}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 1,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Icon name="people" style={{ fontSize: 28 }} />
                      </Box>
                      <Typography variant="h6" component="p" sx={{ fontWeight: 600, mb: 1 }}>
                        Find Professionals
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Connect with legal and technical experts
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
  
              <Grid size={{ xs: 12, tiny: 6, md: 3 }}>
                <Tooltip title="Feature Comming in Q2 2026"> 
                  <Card
                    sx={{
                      borderColor: 'divider',
                      transition: 'border-color 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                                                           
                    <span style={{ cursor: 'not-allowed' }}>
                      <CardActionArea onClick={() => alert('Feature Comming in Q2 2026')} disabled>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 1,
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 2,
                            }}
                          >
                            <Icon name="analytics" style={{ fontSize: 28 }} />
                          </Box>
                          <Typography variant="h6" component="p" sx={{ fontWeight: 600, mb: 1 }}>
                            View Metrics
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Track performance and compliance
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </span>
                  </Card>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
         </Stack>
      </Container>
    </Box>
  );
}
