import { Card, CardContent, Typography, Chip, Box, Collapse, Button } from '@mui/material';
import { useState } from 'react';
import { Violation } from '../../types';

interface ViolationCardProps {
  violation: Violation;
}

export default function ViolationCard({ violation }: ViolationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'serious':
        return 'warning';
      case 'moderate':
        return 'info';
      case 'minor':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {violation.title}
          </Typography>
          <Chip
            label={violation.severity.toUpperCase()}
            color={getSeverityColor(violation.severity) as any}
            size="small"
            sx={{ ml: 2, fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`WCAG ${violation.wcag_guideline}`}
            size="small"
            variant="outlined"
          />
          {violation.compliance_level && (
            <Chip
              label={`Level ${violation.compliance_level}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {violation.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {violation.description}
          </Typography>
        )}

        {violation.affected_selector && (
          <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', backgroundColor: 'action.hover', p: 1, borderRadius: 1 }}>
            Selector: {violation.affected_selector}
          </Typography>
        )}

        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ mb: 1 }}
        >
          {expanded ? 'Hide' : 'Show'} Remediation Steps
        </Button>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              How to Fix:
            </Typography>
            {violation.remediation_steps && violation.remediation_steps.length > 0 ? (
              <Box component="ol" sx={{ m: 0, pl: 3 }}>
                {violation.remediation_steps.map((step, index) => {
                  let stepText = '';

                  if (typeof step === 'string') {
                    try {
                      const parsed = JSON.parse(step);
                      if (typeof parsed === 'string') {
                        stepText = parsed;
                      } else if (parsed && typeof parsed === 'object' && parsed.value) {
                        stepText = String(parsed.value);
                      } else if (parsed && typeof parsed === 'object' && parsed.url) {
                        stepText = String(parsed.url);
                      } else {
                        stepText = JSON.stringify(parsed, null, 2);
                      }
                    } catch {
                      stepText = step;
                    }
                  } else if (typeof step === 'object' && step !== null) {
                    const obj = step as any;
                    if (obj.value) {
                      stepText = String(obj.value);
                    } else if (obj.url) {
                      stepText = String(obj.url);
                    } else {
                      stepText = JSON.stringify(obj, null, 2);
                    }
                  } else {
                    stepText = String(step);
                  }

                  return (
                    <Typography key={index} component="li" variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {stepText}
                    </Typography>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Consult WCAG guidelines for detailed remediation steps.
              </Typography>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
