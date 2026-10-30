import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { toneColor } from '../tone';
import { clampScore, scoreTone } from '../ScoreBar/scoreTone';

export interface ScoreStripScores {
  performance?: number | null;
  accessibility?: number | null;
  bestPractices?: number | null;
  seo?: number | null;
}

export interface ScoreStripProps {
  scores: ScoreStripScores;
  size?: 'sm' | 'md';
}

const CELLS: ReadonlyArray<{ key: keyof ScoreStripScores; abbr: string; full: string }> = [
  { key: 'performance', abbr: 'Perf', full: 'Performance' },
  { key: 'accessibility', abbr: 'A11y', full: 'Accessibility' },
  { key: 'bestPractices', abbr: 'BP', full: 'Best Practices' },
  { key: 'seo', abbr: 'SEO', full: 'SEO' },
];

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/**
 * Four-up Perf / A11y / BP / SEO readout. Each cell is a definition pair so
 * assistive tech hears "Performance, 87" rather than a bare number. Colors
 * follow the value (SPEC §3.3), never the category.
 */
export function ScoreStrip({ scores, size = 'md' }: ScoreStripProps) {
  const theme = useTheme();
  const numeralVariant = size === 'sm' ? 'body1' : 'h6';

  return (
    <Box
      component="dl"
      sx={{
        display: 'flex',
        gap: size === 'sm' ? 1.5 : 2.5,
        m: 0,
        flexShrink: 0,
      }}
    >
      {CELLS.map(({ key, abbr, full }) => {
        const score = clampScore(scores[key] ?? 0);
        return (
          <Box
            key={key}
            sx={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', minWidth: size === 'sm' ? 32 : 40 }}
          >
            <Typography component="dt" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              <span aria-hidden="true">{abbr}</span>
              <Box component="span" sx={srOnly}>
                {full}
              </Box>
            </Typography>
            <Typography
              component="dd"
              variant={numeralVariant}
              sx={{
                m: 0,
                fontWeight: 700,
                lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
                color: toneColor(theme, scoreTone(score)),
              }}
            >
              {score}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default ScoreStrip;
