import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { supabase } from '../services/supabaseClient';
import { DemandLetter } from '../types';
import { DocumentAnalysis } from '../components/documents/DocumentUploadDialog';
import InlineDocumentUpload from '../components/documents/InlineDocumentUpload';
import InlineAnalysisResults from '../components/documents/InlineAnalysisResults';
import Icon from '../components/ui/Icon';

export default function DemandLetters() {
  const [letters, setLetters] = useState<DemandLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    try {
      const { data } = await supabase
        .from('demand_letters')
        .select('*')
        .order('upload_date', { ascending: false });

      setLetters(data || []);
    } catch (error) {
      console.error('Error loading letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'info';
      case 'responded':
        return 'primary';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleUploadComplete = (analysis: DocumentAnalysis) => {
    setAnalysisResult(analysis);
    setActiveTab(1);
    loadLetters();
  };

  const handleNewUpload = () => {
    setAnalysisResult(null);
    setActiveTab(0);
  };

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="md" sx={{ pt: 1 }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
            Demand Letters
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload and analyze legal demand letters with AI-powered extraction
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 12 }}>
            <Box sx={{ position: 'sticky', top: 24, display: 'none' }}>
              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                sx={{ mb: 3 }}
              >
                <Tab
                  label="Upload Document"
                  icon={<Icon name="upload_file" />}
                  iconPosition="start"
                />
                <Tab
                  label="Analysis Results"
                  icon={<Icon name="analytics" />}
                  iconPosition="start"
                  disabled={!analysisResult}
                />
              </Tabs>

              {activeTab === 0 && (
                <InlineDocumentUpload onUploadComplete={handleUploadComplete} />
              )}

              {activeTab === 1 && analysisResult && (
                <InlineAnalysisResults
                  analysis={analysisResult}
                  onNewUpload={handleNewUpload}
                />
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'none' }}>
            <Box sx={{ mb: 3, mt: 12 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Your Demand Letters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View and manage all uploaded demand letters
              </Typography>
            </Box>

            {letters.length === 0 && !loading ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <Icon name="description" style={{ fontSize: 40, color: '#94A3B8' }} />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    No Demand Letters Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Upload your first demand letter using the form on the left to get started
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {letters.map((letter) => {
                  const daysLeft = getDaysUntilDeadline(letter.response_deadline);
                  return (
                    <Card
                      key={letter.id}
                      sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {letter.file_name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                              <Chip
                                label={letter.status?.toUpperCase() || 'PENDING'}
                                color={getStatusColor(letter.status) as any}
                                size="small"
                              />
                              <Chip
                                label={`${letter.risk_level?.toUpperCase() || 'MEDIUM'} RISK`}
                                color={getRiskColor(letter.risk_level) as any}
                                size="small"
                              />
                              {daysLeft !== null && daysLeft <= 30 && (
                                <Chip
                                  label={`${daysLeft} days until deadline`}
                                  color={daysLeft <= 7 ? 'error' : 'warning'}
                                  size="small"
                                  icon={<Icon name="schedule" />}
                                />
                              )}
                              {letter.ai_model_version && (
                                <Chip
                                  label={letter.ai_model_version}
                                  size="small"
                                  variant="outlined"
                                  icon={<Icon name="psychology" style={{ fontSize: 14 }} />}
                                />
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Icon name="share" />}
                            >
                              Share
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              endIcon={<Icon name="arrow_forward" />}
                            >
                              View
                            </Button>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          {letter.plaintiff_name && (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Plaintiff
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {letter.plaintiff_name}
                              </Typography>
                            </Grid>
                          )}
                          {letter.attorney_name && (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Attorney
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {letter.attorney_name}
                              </Typography>
                            </Grid>
                          )}
                          {letter.response_deadline && (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Deadline
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {new Date(letter.response_deadline).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          )}
                          {letter.settlement_amount && (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Settlement Amount
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                ${letter.settlement_amount.toLocaleString()}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>

                        {letter.analysis_summary && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {letter.analysis_summary}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {letters.length > 0 && (
                  <Alert severity="info">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Need Legal Help?
                    </Typography>
                    <Typography variant="body2">
                      Visit our Professional Resources directory to find experienced ADA attorneys who can help you respond to demand letters.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
