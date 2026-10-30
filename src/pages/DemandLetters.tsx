import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { DemandLetter } from '../types';
import { DocumentAnalysis } from '../components/documents/DocumentUploadDialog';
import InlineDocumentUpload from '../components/documents/InlineDocumentUpload';
import InlineAnalysisResults from '../components/documents/InlineAnalysisResults';
import { LetterCard } from '../components/documents/LetterCard/LetterCard';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import Icon from '../components/ui/Icon';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';

const NEXT_STEPS = [
  'Your document will be analyzed for key information',
  'AI extracts dates, names, amounts, and violations',
  'Legal analysis with risk assessment and potential defenses',
  'Results are saved and can be shared with others',
];

const SKELETON_KEYS = ['a', 'b', 'c'];

export default function DemandLetters() {
  const theme = useTheme();
  const [letters, setLetters] = useState<DemandLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysis | null>(null);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    setLoading(true);
    try {
      setLoadError(null);
      const { data, error } = await supabase
        .from('demand_letters')
        .select('id, file_name, upload_date, plaintiff_name, attorney_name, response_deadline, settlement_amount, analysis_summary, risk_level, status, ai_model_version, created_at')
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setLetters(data || []);
    } catch (error) {
      console.error('Error loading letters:', error);
      setLoadError('Unable to load your saved demand letters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (analysis: DocumentAnalysis) => {
    setAnalysisResult(analysis);
    loadLetters();
  };

  const handleNewUpload = () => {
    setAnalysisResult(null);
  };

  const nestedCircleSx = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    fontSize: '0.75rem',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    color: 'text.primary',
    bgcolor: 'action.hover',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    ...theme.applyStyles('dark', {
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    }),
  } as const;

  return (
    <PageCanvas maxWidth="lg">
      <PageHeader
        eyebrow="AI analysis"
        title="Analyze Demand Letters"
        titleId="letters-title"
        description={
          <>
            Upload a PDF or image of your demand letter for AI-powered analysis. Your file is sent to Google
            Gemini for analysis; review the results before relying on them.
          </>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
          gap: 3,
          alignItems: 'start',
          mb: { xs: 6, md: 8 },
        }}
      >
        <BezelCard component="section" aria-label="Upload a demand letter" reveal={0}>
          {analysisResult ? (
            <InlineAnalysisResults analysis={analysisResult} onNewUpload={handleNewUpload} />
          ) : (
            <InlineDocumentUpload onUploadComplete={handleUploadComplete} showNextSteps={false} />
          )}
        </BezelCard>

        <BezelCard component="aside" aria-labelledby="next-steps-title" reveal={1}>
          <Typography id="next-steps-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            What happens next?
          </Typography>
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
            {NEXT_STEPS.map((step, index) => (
              <Box component="li" key={step} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box aria-hidden="true" sx={nestedCircleSx}>
                  {index + 1}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box aria-hidden="true" sx={{ ...nestedCircleSx, width: 36, height: 36, fontSize: '1.125rem' }}>
                <Icon name="people" />
              </Box>
              <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
                Need legal help?
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Our Professional Resources directory lists experienced ADA attorneys who can help you respond.
            </Typography>
            <ArrowButton
              variant="text"
              component={RouterLink}
              to="/resources"
              sx={{ px: 1.5, minHeight: 40 }}
            >
              Browse professionals
            </ArrowButton>
          </Box>
        </BezelCard>
      </Box>

      <Box component="section" aria-labelledby="letters-list-title">
        <SectionHeader
          id="letters-list-title"
          title="Your Demand Letters"
          meta={loading ? undefined : letters.length}
        />

        {loadError && !loading ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadLetters}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        ) : loading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
              gap: 3,
            }}
            aria-busy="true"
            aria-label="Loading demand letters"
          >
            {SKELETON_KEYS.map((key) => (
              <BezelCard key={key}>
                <Skeleton variant="text" width="70%" sx={{ fontSize: '1.25rem' }} />
                <Box sx={{ display: 'flex', gap: 1, my: 1.5 }}>
                  <Skeleton variant="rounded" width={72} height={24} />
                  <Skeleton variant="rounded" width={96} height={24} />
                </Box>
                <Skeleton variant="rounded" height={88} />
              </BezelCard>
            ))}
          </Box>
        ) : letters.length === 0 ? (
          <BezelCard>
            <EmptyState
              icon="description"
              title="No Demand Letters Yet"
              description="Upload your first demand letter above to get started."
              compact
            />
          </BezelCard>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
              gap: 3,
            }}
          >
            {letters.map((letter, index) => (
              <LetterCard key={letter.id} letter={letter} reveal={index} />
            ))}
          </Box>
        )}
      </Box>
    </PageCanvas>
  );
}
