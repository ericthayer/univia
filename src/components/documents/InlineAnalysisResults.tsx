import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Button,
  LinearProgress,
  Tooltip,
  Collapse,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { DocumentAnalysis } from './DocumentUploadDialog';
import Icon from '../ui/Icon';
import LegalDisclaimer from '../ui/LegalDisclaimer';

interface InlineAnalysisResultsProps {
  analysis: DocumentAnalysis;
  onNewUpload: () => void;
}

export default function InlineAnalysisResults({
  analysis,
  onNewUpload,
}: InlineAnalysisResultsProps) {
  const [showEntities, setShowEntities] = useState(false);
  const [showLegalAnalysis, setShowLegalAnalysis] = useState(true);

  if (!analysis?.analysis) return null;

  const { analysis: result, debug } = analysis;

  const getUrgencyColor = (level: string) => {
    switch (level) {
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

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'check_circle';
      default:
        return 'help';
    }
  };

  const getConfidenceLabel = (score?: number) => {
    if (!score) return { label: 'Unknown', color: 'default' };
    if (score >= 0.9) return { label: 'High', color: 'success' };
    if (score >= 0.7) return { label: 'Medium', color: 'info' };
    return { label: 'Low', color: 'warning' };
  };

  const ConfidenceBadge = ({ score }: { score?: number }) => {
    if (!score) return null;
    const { label, color } = getConfidenceLabel(score);
    return (
      <Tooltip title={`AI Confidence: ${(score * 100).toFixed(0)}%`}>
        <Chip
          label={`${label} Confidence`}
          size="small"
          color={color as 'success' | 'info' | 'warning' | 'default'}
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Tooltip>
    );
  };

  const handleShare = () => {
    console.log('Share functionality');
  };

  const handleExportPDF = () => {
    console.log('Export PDF functionality');
  };

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Analysis Results
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={result.documentType}
                color="primary"
                size="medium"
              />
              <Chip
                icon={<Icon name={getUrgencyIcon(result.urgencyLevel)} style={{ fontSize: 18 }} />}
                label={`${result.urgencyLevel.toUpperCase()} URGENCY`}
                color={getUrgencyColor(result.urgencyLevel) as 'error' | 'warning' | 'info' | 'success' | 'default'}
                size="medium"
              />
              {debug?.aiModel && (
                <Chip
                  icon={<Icon name="psychology" style={{ fontSize: 16 }} />}
                  label={debug.aiModel}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Icon name="share" />}
              onClick={handleShare}
              size="small"
            >
              Share
            </Button>
            <Button
              variant="outlined"
              startIcon={<Icon name="picture_as_pdf" />}
              onClick={handleExportPDF}
              size="small"
            >
              Export PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<Icon name="upload_file" />}
              onClick={onNewUpload}
              size="small"
            >
              Upload Another
            </Button>
          </Box>
        </Box>
      </Box>

      <LegalDisclaimer variant="compact" sx={{ mb: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Summary
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
          {result.documentSummary}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Key Information
        </Typography>
        <Grid container spacing={2}>
          {result.keyPoints.map((point, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Icon name="check_circle" style={{ color: '#2563EB', fontSize: 20, marginTop: 2 }} />
                  <Typography variant="body2">{point}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {result.extractedData && Object.values(result.extractedData).some(v => v) && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Extracted Details with AI Confidence
              </Typography>
              {result.confidenceScores && Object.keys(result.confidenceScores).length > 0 && (
                <Tooltip title="Confidence scores indicate how certain the AI is about each extracted field">
                  <Chip
                    icon={<Icon name="psychology" style={{ fontSize: 16 }} />}
                    label="AI-Powered"
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Box>
            <Grid container spacing={3}>
              {result.extractedData.plaintiffName && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Plaintiff</Typography>
                      <ConfidenceBadge score={result.confidenceScores?.plaintiffName} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.extractedData.plaintiffName}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.attorneyName && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Attorney</Typography>
                      <ConfidenceBadge score={result.confidenceScores?.attorneyName} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.extractedData.attorneyName}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.attorneyFirm && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Law Firm</Typography>
                      <ConfidenceBadge score={result.confidenceScores?.attorneyFirm} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.extractedData.attorneyFirm}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.caseNumber && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Case Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.extractedData.caseNumber}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.courtName && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Court
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.extractedData.courtName}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.filingDate && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Filing Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.extractedData.filingDate}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.responseDeadline && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Response Deadline</Typography>
                      <ConfidenceBadge score={result.confidenceScores?.responseDeadline} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {result.extractedData.responseDeadline}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.settlementAmount && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Settlement Amount</Typography>
                      <ConfidenceBadge score={result.confidenceScores?.settlementAmount} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ${result.extractedData.settlementAmount.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {result.extractedData.violationsCited && result.extractedData.violationsCited.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Violations Cited
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {result.extractedData.violationsCited.map((violation, index) => (
                        <Chip key={index} label={violation} size="small" color="error" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </>
      )}

      {result.legalAnalysis && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Legal Analysis
              </Typography>
              <IconButton size="small" onClick={() => setShowLegalAnalysis(!showLegalAnalysis)}>
                <Icon name={showLegalAnalysis ? 'expand_less' : 'expand_more'} />
              </IconButton>
            </Box>
            <Collapse in={showLegalAnalysis}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Claim Type
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.legalAnalysis.claimType}
                      </Typography>
                    </Grid>
                    {result.legalAnalysis.jurisdiction && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Jurisdiction
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {result.legalAnalysis.jurisdiction}
                        </Typography>
                      </Grid>
                    )}
                    {result.legalAnalysis.statuteOfLimitations && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Statute of Limitations
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {result.legalAnalysis.statuteOfLimitations}
                        </Typography>
                      </Grid>
                    )}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Risk Assessment
                      </Typography>
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="body2">
                          {result.legalAnalysis.riskAssessment}
                        </Typography>
                      </Box>
                    </Grid>
                    {result.legalAnalysis.potentialDefenses && result.legalAnalysis.potentialDefenses.length > 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Potential Defenses to Consider
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {result.legalAnalysis.potentialDefenses.map((defense, index) => (
                            <Chip
                              key={index}
                              label={defense}
                              size="small"
                              variant="outlined"
                              icon={<Icon name="shield" style={{ fontSize: 16 }} />}
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Collapse>
          </Box>
        </>
      )}

      {result.extractedEntities && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                All Extracted Entities
              </Typography>
              <IconButton size="small" onClick={() => setShowEntities(!showEntities)}>
                <Icon name={showEntities ? 'expand_less' : 'expand_more'} />
              </IconButton>
            </Box>
            <Collapse in={showEntities}>
              <Grid container spacing={2}>
                {result.extractedEntities.persons && result.extractedEntities.persons.length > 0 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Persons ({result.extractedEntities.persons.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {result.extractedEntities.persons.slice(0, 10).map((person, i) => (
                          <Chip key={i} label={person} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
                {result.extractedEntities.organizations && result.extractedEntities.organizations.length > 0 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Organizations ({result.extractedEntities.organizations.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {result.extractedEntities.organizations.slice(0, 10).map((org, i) => (
                          <Chip key={i} label={org} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
                {result.extractedEntities.dates && result.extractedEntities.dates.length > 0 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Dates ({result.extractedEntities.dates.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {result.extractedEntities.dates.slice(0, 10).map((date, i) => (
                          <Chip key={i} label={date} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
                {result.extractedEntities.amounts && result.extractedEntities.amounts.length > 0 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Amounts ({result.extractedEntities.amounts.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {result.extractedEntities.amounts.slice(0, 10).map((amount, i) => (
                          <Chip key={i} label={`$${amount}`} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
                {result.extractedEntities.legalCitations && result.extractedEntities.legalCitations.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Legal Citations ({result.extractedEntities.legalCitations.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {result.extractedEntities.legalCitations.slice(0, 15).map((citation, i) => (
                          <Chip
                            key={i}
                            label={citation}
                            size="small"
                            variant="outlined"
                            icon={<Icon name="gavel" style={{ fontSize: 14 }} />}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Collapse>
          </Box>
        </>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Recommended Actions
        </Typography>
        <List disablePadding>
          {result.recommendedActions.map((action, index) => (
            <ListItem key={index} disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </Box>
              </ListItemIcon>
              <ListItemText primary={action} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Additional Resources
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {result.additionalResources.map((resource, index) => (
            <Chip
              key={index}
              label={resource}
              variant="outlined"
              icon={<Icon name="link" style={{ fontSize: 16 }} />}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>

      {debug && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Analysis Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption">
                Method: {debug.analysisMethod}
              </Typography>
              <Typography variant="caption">
                Model: {debug.aiModel}
              </Typography>
              {debug.modelPreference && (
                <Typography variant="caption">
                  Preference: {debug.modelPreference}
                </Typography>
              )}
              {debug.analysisDepth && (
                <Typography variant="caption">
                  Depth: {debug.analysisDepth}
                </Typography>
              )}
              <Typography variant="caption">
                Processed: {new Date(debug.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
}
