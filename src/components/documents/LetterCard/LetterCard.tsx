import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { DemandLetter } from '../../../types';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import Icon from '../../ui/Icon';
import { getDaysUntilDeadline, getRiskColor, getStatusColor } from './letterStatus';

export interface LetterCardProps {
  letter: DemandLetter;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

interface MetaItem {
  label: string;
  value: string;
}

const SUMMARY_CLAMP_LINES = 3;

/**
 * One uploaded demand letter: file name, status / risk chips, extracted meta,
 * and the AI summary clamped to three lines with an expand toggle.
 */
export function LetterCard({ letter, reveal }: LetterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const summaryId = useId();
  const daysLeft = getDaysUntilDeadline(letter.response_deadline);

  const meta: MetaItem[] = [];
  if (letter.plaintiff_name) meta.push({ label: 'Plaintiff', value: letter.plaintiff_name });
  if (letter.attorney_name) meta.push({ label: 'Attorney', value: letter.attorney_name });
  if (letter.response_deadline) {
    meta.push({ label: 'Deadline', value: new Date(letter.response_deadline).toLocaleDateString() });
  }
  if (letter.settlement_amount) {
    meta.push({ label: 'Settlement', value: `$${letter.settlement_amount.toLocaleString()}` });
  }

  return (
    <BezelCard interactive reveal={reveal} component="article" aria-label={letter.file_name}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            lineHeight: 1.35,
            minWidth: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            overflowWrap: 'anywhere',
          }}
        >
          {letter.file_name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button variant="outlined" size="small" startIcon={<Icon name="share" />}>
            Share
          </Button>
          <Button variant="outlined" size="small" endIcon={<Icon name="arrow_forward" />}>
            View
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: meta.length || letter.analysis_summary ? 2.5 : 0 }}>
        <Chip label={letter.status?.toUpperCase() || 'PENDING'} color={getStatusColor(letter.status)} size="small" />
        <Chip
          label={`${letter.risk_level?.toUpperCase() || 'MEDIUM'} RISK`}
          color={getRiskColor(letter.risk_level)}
          size="small"
        />
        {daysLeft !== null && daysLeft <= 30 && (
          <Chip
            label={`${daysLeft} days until deadline`}
            color={daysLeft <= 7 ? 'error' : 'warning'}
            size="small"
            icon={<Icon name="schedule" />}
            sx={{ fontVariantNumeric: 'tabular-nums' }}
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

      {meta.length > 0 && (
        <Box
          component="dl"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))',
            gap: 2,
            m: 0,
            mb: letter.analysis_summary ? 2.5 : 0,
          }}
        >
          {meta.map((item) => (
            <Box key={item.label} sx={{ minWidth: 0 }}>
              <Typography variant="eyebrow" component="dt" sx={{ display: 'block', mb: 0.5 }}>
                {item.label}
              </Typography>
              <Typography
                variant="body1"
                component="dd"
                sx={{ m: 0, fontWeight: 500, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {letter.analysis_summary && (
        <Box sx={{ mt: 'auto', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography
            id={summaryId}
            variant="body2"
            color="text.secondary"
            sx={
              expanded
                ? undefined
                : {
                    display: '-webkit-box',
                    WebkitLineClamp: SUMMARY_CLAMP_LINES,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }
            }
          >
            {letter.analysis_summary}
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={summaryId}
            sx={{ mt: 1, px: 0 }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </Box>
      )}
    </BezelCard>
  );
}

export default LetterCard;
