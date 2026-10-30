import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { Violation } from '../../types';
import Icon from './Icon';
import { TonePill } from './TonePill/TonePill';
import { severityTone } from './violationSeverity';

interface ViolationCardProps {
  violation: Violation;
}

function toStepText(step: unknown): string {
  if (typeof step === 'string') {
    try {
      const parsed = JSON.parse(step);
      if (typeof parsed === 'string') return parsed;
      if (parsed && typeof parsed === 'object' && parsed.value) return String(parsed.value);
      if (parsed && typeof parsed === 'object' && parsed.url) return String(parsed.url);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return step;
    }
  }
  if (typeof step === 'object' && step !== null) {
    const obj = step as Record<string, unknown>;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.url === 'string') return obj.url;
    return JSON.stringify(obj, null, 2);
  }
  return String(step);
}

/**
 * One violation as a flush list row. Render inside a `<ul>` that sits in a
 * `BezelCard padding="none"`; rows separate themselves with a hairline.
 */
export default function ViolationCard({ violation }: ViolationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

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
        <TonePill variant="outline">WCAG {violation.wcag_guideline}</TonePill>
        {violation.compliance_level && <TonePill variant="outline">Level {violation.compliance_level}</TonePill>}
      </Box>

      {violation.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, overflowWrap: 'anywhere' }}>
          {violation.description}
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
        sx={{ borderRadius: 999, minHeight: 44, px: 1.5, ml: -1.5 }}
      >
        {expanded ? 'Hide' : 'Show'} remediation steps
      </Button>

      <Collapse in={expanded} id={panelId}>
        <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="eyebrow" component="p" sx={{ mb: 1 }}>
            How to fix
          </Typography>
          {violation.remediation_steps && violation.remediation_steps.length > 0 ? (
            <Box component="ol" sx={{ m: 0, pl: 3 }}>
              {violation.remediation_steps.map((step, index) => (
                <Typography
                  key={index}
                  component="li"
                  variant="body2"
                  sx={{ mb: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {toStepText(step)}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Consult WCAG guidelines for detailed remediation steps.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
