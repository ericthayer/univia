import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SegmentedToggleGroup } from '../../ui/SegmentedToggleGroup/SegmentedToggleGroup';
import { ScoreBar } from '../../ui/ScoreBar/ScoreBar';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import Icon from '../../ui/Icon';

export interface ScoreSet {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  count: number;
}

export interface ScoreBreakdownCardProps {
  overall: ScoreSet;
  desktop: ScoreSet;
  mobile: ScoreSet;
  reveal?: number;
}

type Dataset = 'overall' | 'desktop' | 'mobile';

const DATASETS: ReadonlyArray<{ key: Dataset; label: string; icon: string }> = [
  { key: 'overall', label: 'Overall', icon: 'analytics' },
  { key: 'desktop', label: 'Desktop', icon: 'computer' },
  { key: 'mobile', label: 'Mobile', icon: 'smartphone' },
];

const BARS: ReadonlyArray<{ key: keyof Omit<ScoreSet, 'count'>; label: string }> = [
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'performance', label: 'Performance' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo', label: 'SEO' },
];

/**
 * Average scores with a dataset switch. One set of four bars replaces the
 * twelve stacked bars the dashboard used to render.
 */
export function ScoreBreakdownCard({ overall, desktop, mobile, reveal }: ScoreBreakdownCardProps) {
  const [dataset, setDataset] = useState<Dataset>('overall');
  const headingId = 'score-breakdown-heading';

  const sets = useMemo<Record<Dataset, ScoreSet>>(() => ({ overall, desktop, mobile }), [overall, desktop, mobile]);
  const active = sets[dataset];

  return (
    <BezelCard component="section" aria-labelledby={headingId} reveal={reveal} sx={{ containerType: 'inline-size', height: '100%' }}>
      <SectionHeader
        id={headingId}
        component="h3"
        title="Score Breakdown"
        meta={`${active.count} ${active.count === 1 ? 'audit' : 'audits'}`}
        dense
        action={
          <SegmentedToggleGroup
            exclusive
            size="small"
            value={dataset}
            onChange={(_, next: Dataset | null) => next && setDataset(next)}
            aria-label="Score dataset"
          >
            {DATASETS.map(({ key, label, icon }) => (
              <ToggleButton key={key} value={key} disabled={sets[key].count === 0} aria-label={`${label} (${sets[key].count} audits)`}>
                <Icon name={icon} style={{ fontSize: 16 }} aria-hidden />
                {label}
              </ToggleButton>
            ))}
          </SegmentedToggleGroup>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: '1fr',
          '@container (min-width: 34rem)': {
            gridTemplateColumns: '1fr 1fr',
            columnGap: 4,
          },
        }}
      >
        {BARS.map(({ key, label }) => (
          <ScoreBar key={key} label={label} value={active[key]} />
        ))}
      </Box>
    </BezelCard>
  );
}

export default ScoreBreakdownCard;
