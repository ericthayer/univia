import { useId, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { Violation } from '../../types';
import Icon from './Icon';
import { TonePill } from './TonePill/TonePill';
import { severityTone } from './violationSeverity';
import { controlRadius } from '../../theme/tokens';
import { getFixGuidance } from '../../config/fixGuides';
import { FixGuide } from './FixGuide/FixGuide';

interface ViolationCardProps {
  violation: Violation;
}

/**
 * One violation as a flush list row. Render inside a `<ul>` that sits in a
 * `BezelCard padding="none"`; rows separate themselves with a hairline.
 */
export default function ViolationCard({ violation }: ViolationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const guidance = useMemo(() => getFixGuidance(violation), [violation]);
  const level = guidance.standards[0]?.level ?? violation.compliance_level;

  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        px: { xs: 2, sm: 3 },
        py: 2.5,
        '& + &': {
          borderTop: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          {violation.title}
        </Typography>
        <TonePill tone={severityTone(violation.severity)} dot>
          {violation.severity}
        </TonePill>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        {guidance.standards.length > 0 ? (
          guidance.standards.map((standard) => (
            <TonePill key={standard.id} variant="outline">
              WCAG {standard.id}
            </TonePill>
          ))
        ) : (
          <TonePill variant="outline">
            {guidance.category === 'accessibility' ? 'Best practice' : guidance.categoryLabel}
          </TonePill>
        )}
        {level && <TonePill variant="outline">Level {level}</TonePill>}
      </Box>

      {guidance.summary && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, overflowWrap: 'anywhere' }}>
          {guidance.summary}
        </Typography>
      )}

      {violation.affected_selector && (
        <Typography
          variant="body2"
          component="code"
          sx={{
            display: 'block',
            mb: 1.5,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.8125rem',
            bgcolor: 'action.hover',
            px: 1.5,
            py: 1,
            borderRadius: '10px',
            overflowWrap: 'anywhere',
          }}
        >
          Selector: {violation.affected_selector}
        </Typography>
      )}

      <Button
        size="small"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={panelId}
        endIcon={<Icon name={expanded ? 'expand_less' : 'expand_more'} />}
        sx={{ borderRadius: controlRadius, minHeight: 44, px: 1.5, ml: -1.5 }}
      >
        {expanded ? 'Hide' : 'Show'} how to fix
      </Button>

      <Collapse in={expanded} id={panelId}>
        <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <FixGuide guidance={guidance} />
        </Box>
      </Collapse>
    </Box>
  );
}
