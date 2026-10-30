import { ReactNode, useId, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { DocumentAnalysis } from './DocumentUploadDialog';
import { confidenceLabel, urgencyIcon, urgencyTone } from './urgency';
import Icon from '../ui/Icon';
import LegalDisclaimer from '../ui/LegalDisclaimer';
import { ArrowButton } from '../ui/ArrowButton/ArrowButton';
import { TonePill } from '../ui/TonePill/TonePill';

interface InlineAnalysisResultsProps {
  analysis: DocumentAnalysis;
  onNewUpload: () => void;
}

interface AnalysisSectionProps {
  id: string;
  title: string;
  /** Trailing control, e.g. a collapse toggle. */
  action?: ReactNode;
  children: ReactNode;
}

/** Section with an eyebrow title and a hairline above it. */
function AnalysisSection({ id, title, action, children }: AnalysisSectionProps) {
  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={{ pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, minHeight: 32 }}>
        <Typography id={id} variant="eyebrow" component="h3">
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

/** Free-form text can be long, so these wrap instead of using the fixed-height pill. */
function TextChip({ label, icon, tone }: { label: string; icon?: string; tone?: 'error' }) {
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      color={tone}
      icon={icon ? <Icon name={icon} style={{ fontSize: 14 }} /> : undefined}
      sx={{
        borderRadius: 999,
        maxWidth: '100%',
        height: 'auto',
        py: 0.5,
        '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere' },
      }}
    />
  );
}

interface DetailProps {
  label: string;
  confidence?: number;
  children: ReactNode;
}

/** One term/definition pair in a details grid. */
function Detail({ label, confidence, children }: DetailProps) {
  const level = confidenceLabel(confidence);
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box component="dt" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {level && confidence !== undefined && (
          <Box component="span" title={`AI confidence: ${(confidence * 100).toFixed(0)}%`}>
            <TonePill variant="outline">{level} confidence</TonePill>
          </Box>
        )}
      </Box>
      <Box component="dd" sx={{ m: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

const detailsGridSx = {
  display: 'grid',
  gap: 2.5,
  gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
  m: 0,
} as const;

const pillButtonSx = { borderRadius: 999, minHeight: 44, px: 2.5 } as const;

export default function InlineAnalysisResults({
  analysis,
  onNewUpload,
}: InlineAnalysisResultsProps) {
  const [showEntities, setShowEntities] = useState(false);
  const [showLegalAnalysis, setShowLegalAnalysis] = useState(true);
  const uid = useId();

  if (!analysis?.analysis) return null;

  const { analysis: result, debug } = analysis;
  const data = result.extractedData;
  const scores = result.confidenceScores;

  const handleShare = () => {
    console.log('Share functionality');
  };

  const handleExportPDF = () => {
    console.log('Export PDF functionality');
  };

  const entityGroups: ReadonlyArray<{ label: string; items?: string[]; limit: number; format?: (v: string) => string; icon?: string }> = result.extractedEntities
    ? [
        { label: 'Persons', items: result.extractedEntities.persons, limit: 10 },
        { label: 'Organizations', items: result.extractedEntities.organizations, limit: 10 },
        { label: 'Dates', items: result.extractedEntities.dates, limit: 10 },
        { label: 'Amounts', items: result.extractedEntities.amounts, limit: 10, format: (v) => `$${v}` },
        { label: 'Legal Citations', items: result.extractedEntities.legalCitations, limit: 15, icon: 'gavel' },
      ]
    : [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mb: 1.5 }}>
          Analysis Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
          <TonePill variant="solid">{result.documentType}</TonePill>
          <TonePill tone={urgencyTone(result.urgencyLevel)} dot>
            <Icon name={urgencyIcon(result.urgencyLevel)} style={{ fontSize: 14 }} aria-hidden />
            {result.urgencyLevel} urgency
          </TonePill>
          {debug?.aiModel && (
            <TonePill variant="outline">
              <Icon name="psychology" style={{ fontSize: 14 }} aria-hidden />
              {debug.aiModel}
            </TonePill>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <ArrowButton onClick={onNewUpload}>Upload Another</ArrowButton>
          <Button variant="outlined" startIcon={<Icon name="share" />} onClick={handleShare} sx={pillButtonSx}>
            Share
          </Button>
          <Button variant="outlined" startIcon={<Icon name="picture_as_pdf" />} onClick={handleExportPDF} sx={pillButtonSx}>
            Export PDF
          </Button>
        </Box>
      </Box>

      <LegalDisclaimer variant="compact" />

      <AnalysisSection id={`${uid}-summary`} title="Summary">
        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
          {result.documentSummary}
        </Typography>
      </AnalysisSection>

      <AnalysisSection id={`${uid}-key`} title="Key Information">
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {result.keyPoints.map((point, index) => (
            <Box
              component="li"
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.25,
                py: 1.25,
                '&:first-of-type': { pt: 0 },
                '&:last-of-type': { pb: 0 },
                '& + &': { borderTop: '1px solid', borderColor: 'divider' },
              }}
            >
              <Icon
                name="check_circle"
                aria-hidden
                style={{ fontSize: 18, marginTop: 2, flexShrink: 0, color: 'var(--mui-palette-text-secondary)' }}
              />
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                {point}
              </Typography>
            </Box>
          ))}
        </Box>
      </AnalysisSection>

      {data && Object.values(data).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))) && (
        <AnalysisSection
          id={`${uid}-details`}
          title="Extracted Details"
          action={
            scores && Object.keys(scores).length > 0 ? (
              <TonePill variant="outline">
                <Icon name="psychology" style={{ fontSize: 14 }} aria-hidden />
                AI-powered
              </TonePill>
            ) : undefined
          }
        >
          <Box component="dl" sx={detailsGridSx}>
            {data.plaintiffName && (
              <Detail label="Plaintiff" confidence={scores?.plaintiffName}>
                <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {data.plaintiffName}
                </Typography>
              </Detail>
            )}
            {data.attorneyName && (
              <Detail label="Attorney" confidence={scores?.attorneyName}>
                <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {data.attorneyName}
                </Typography>
              </Detail>
            )}
            {data.attorneyFirm && (
              <Detail label="Law Firm" confidence={scores?.attorneyFirm}>
                <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {data.attorneyFirm}
                </Typography>
              </Detail>
            )}
            {data.caseNumber && (
              <Detail label="Case Number">
                <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {data.caseNumber}
                </Typography>
              </Detail>
            )}
            {data.courtName && (
              <Detail label="Court">
                <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {data.courtName}
                </Typography>
              </Detail>
            )}
            {data.filingDate && (
              <Detail label="Filing Date">
                <Typography variant="body1" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {data.filingDate}
                </Typography>
              </Detail>
            )}
            {data.responseDeadline && (
              <Detail label="Response Deadline" confidence={scores?.responseDeadline}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main', fontVariantNumeric: 'tabular-nums' }}>
                  {data.responseDeadline}
                </Typography>
              </Detail>
            )}
            {data.settlementAmount && (
              <Detail label="Settlement Amount" confidence={scores?.settlementAmount}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  ${data.settlementAmount.toLocaleString()}
                </Typography>
              </Detail>
            )}
            {data.violationsCited && data.violationsCited.length > 0 && (
              <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
                <Box component="dt" sx={{ mb: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    Violations Cited
                  </Typography>
                </Box>
                <Box component="dd" sx={{ m: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {data.violationsCited.map((violation, index) => (
                    <TextChip key={index} label={violation} tone="error" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </AnalysisSection>
      )}

      {result.legalAnalysis && (
        <AnalysisSection
          id={`${uid}-legal`}
          title="Legal Analysis"
          action={
            <IconButton
              onClick={() => setShowLegalAnalysis((open) => !open)}
              aria-expanded={showLegalAnalysis}
              aria-controls={`${uid}-legal-panel`}
              aria-label={showLegalAnalysis ? 'Collapse legal analysis' : 'Expand legal analysis'}
              sx={{ width: 44, height: 44, mr: -1 }}
            >
              <Icon name={showLegalAnalysis ? 'expand_less' : 'expand_more'} />
            </IconButton>
          }
        >
          <Collapse in={showLegalAnalysis} id={`${uid}-legal-panel`}>
            <Box component="dl" sx={{ ...detailsGridSx, mb: 2.5 }}>
              <Detail label="Claim Type">
                <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {result.legalAnalysis.claimType}
                </Typography>
              </Detail>
              {result.legalAnalysis.jurisdiction && (
                <Detail label="Jurisdiction">
                  <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {result.legalAnalysis.jurisdiction}
                  </Typography>
                </Detail>
              )}
              {result.legalAnalysis.statuteOfLimitations && (
                <Detail label="Statute of Limitations">
                  <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {result.legalAnalysis.statuteOfLimitations}
                  </Typography>
                </Detail>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Risk Assessment
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.7, overflowWrap: 'anywhere' }}>
              {result.legalAnalysis.riskAssessment}
            </Typography>

            {result.legalAnalysis.potentialDefenses && result.legalAnalysis.potentialDefenses.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  Potential Defenses to Consider
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {result.legalAnalysis.potentialDefenses.map((defense, index) => (
                    <TextChip key={index} label={defense} icon="shield" />
                  ))}
                </Box>
              </Box>
            )}
          </Collapse>
        </AnalysisSection>
      )}

      {result.extractedEntities && (
        <AnalysisSection
          id={`${uid}-entities`}
          title="All Extracted Entities"
          action={
            <IconButton
              onClick={() => setShowEntities((open) => !open)}
              aria-expanded={showEntities}
              aria-controls={`${uid}-entities-panel`}
              aria-label={showEntities ? 'Collapse extracted entities' : 'Expand extracted entities'}
              sx={{ width: 44, height: 44, mr: -1 }}
            >
              <Icon name={showEntities ? 'expand_less' : 'expand_more'} />
            </IconButton>
          }
        >
          <Collapse in={showEntities} id={`${uid}-entities-panel`}>
            <Box component="dl" sx={{ m: 0, display: 'grid', gap: 2.5 }}>
              {entityGroups
                .filter((group) => group.items && group.items.length > 0)
                .map((group) => (
                  <Box key={group.label} sx={{ minWidth: 0 }}>
                    <Box component="dt" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        {group.label} ({group.items?.length})
                      </Typography>
                    </Box>
                    <Box component="dd" sx={{ m: 0, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {group.items?.slice(0, group.limit).map((item, index) => (
                        <TextChip key={index} label={group.format ? group.format(item) : item} icon={group.icon} />
                      ))}
                    </Box>
                  </Box>
                ))}
            </Box>
          </Collapse>
        </AnalysisSection>
      )}

      <AnalysisSection id={`${uid}-actions`} title="Recommended Actions">
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
          {result.recommendedActions.map((action, index) => (
            <Box component="li" key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {index + 1}
              </Box>
              <Typography variant="body2" sx={{ pt: 0.5, overflowWrap: 'anywhere' }}>
                {action}
              </Typography>
            </Box>
          ))}
        </Box>
      </AnalysisSection>

      <AnalysisSection id={`${uid}-resources`} title="Additional Resources">
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {result.additionalResources.map((resource, index) => (
            <Box component="li" key={index} sx={{ maxWidth: '100%' }}>
              <TextChip label={resource} icon="link" />
            </Box>
          ))}
        </Box>
      </AnalysisSection>

      {debug && (
        <AnalysisSection id={`${uid}-debug`} title="Analysis Details">
          <Box component="dl" sx={{ m: 0, display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
            <Detail label="Method">
              <Typography variant="body2">{debug.analysisMethod}</Typography>
            </Detail>
            <Detail label="Model">
              <Typography variant="body2">{debug.aiModel}</Typography>
            </Detail>
            {debug.modelPreference && (
              <Detail label="Preference">
                <Typography variant="body2">{debug.modelPreference}</Typography>
              </Detail>
            )}
            {debug.analysisDepth && (
              <Detail label="Depth">
                <Typography variant="body2">{debug.analysisDepth}</Typography>
              </Detail>
            )}
            <Detail label="Processed">
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {Number.isNaN(new Date(debug.timestamp).getTime()) ? (
                  debug.timestamp
                ) : (
                  <time dateTime={new Date(debug.timestamp).toISOString()}>
                    {new Date(debug.timestamp).toLocaleString()}
                  </time>
                )}
              </Typography>
            </Detail>
          </Box>
        </AnalysisSection>
      )}
    </Box>
  );
}
