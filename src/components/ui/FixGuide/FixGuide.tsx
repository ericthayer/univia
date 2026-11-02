import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { FixGuidance } from '../../../config/fixGuides';
import Icon from '../Icon';
import { srOnly } from '../srOnly';
import { CodeSample } from './CodeSample';
import { GuideSection } from './GuideSection';
import { InstanceList } from './InstanceList';

export interface FixGuideProps {
  guidance: FixGuidance;
}

interface Fact {
  label: string;
  value: string;
}

/**
 * Expanded "how to fix" body for one violation: quick facts, why it matters,
 * ordered steps, a code example, where it was found, and further reading.
 * Pure presentation over `getFixGuidance()` output.
 */
export function FixGuide({ guidance }: FixGuideProps) {
  const facts: Fact[] = [
    guidance.fixedBy && { label: 'Usually fixed by', value: guidance.fixedBy },
    guidance.effort && { label: 'Effort', value: guidance.effort },
    guidance.whoIsAffected.length > 0 && { label: 'Who it affects', value: guidance.whoIsAffected.join('; ') },
  ].filter((fact): fact is Fact => Boolean(fact));

  return (
    <Box sx={{ containerType: 'inline-size' }}>
      {facts.length > 0 && (
        <Box
          component="dl"
          sx={{
            m: 0,
            mb: 2.5,
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: 'minmax(0, 1fr)',
            '@container (min-width: 44rem)': { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)' },
          }}
        >
          {facts.map((fact) => (
            <Box key={fact.label} sx={{ minWidth: 0 }}>
              <Typography variant="eyebrow" component="dt" sx={{ display: 'block', mb: 0.5 }}>
                {fact.label}
              </Typography>
              <Typography variant="body2" component="dd" sx={{ m: 0 }}>
                {fact.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {guidance.whyItMatters && (
        <GuideSection title="Why it matters">
          <Typography variant="body2" color="text.secondary">
            {guidance.whyItMatters}
          </Typography>
        </GuideSection>
      )}

      <GuideSection title="How to fix">
        <Box component="ol" sx={{ m: 0, pl: 3 }}>
          {guidance.steps.map((step, index) => (
            <Typography key={index} component="li" variant="body2" sx={{ mb: 1, overflowWrap: 'anywhere' }}>
              {step}
            </Typography>
          ))}
        </Box>
      </GuideSection>

      {guidance.example && (
        <GuideSection title="Code example">
          <CodeSample example={guidance.example} />
        </GuideSection>
      )}

      {guidance.instances.length > 0 && (
        <GuideSection title={`Where we found it (${guidance.instances.length})`}>
          <InstanceList instances={guidance.instances} />
        </GuideSection>
      )}

      {guidance.resources.length > 0 && (
        <GuideSection title="Learn more">
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
            {guidance.resources.map((resource) => (
              <Typography key={resource.url} component="li" variant="body2">
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                >
                  {resource.label}
                  <Icon name="north_east" style={{ fontSize: '1em' }} aria-hidden />
                  <Box component="span" sx={srOnly}>
                    (opens in a new tab)
                  </Box>
                </Link>
              </Typography>
            ))}
          </Box>
        </GuideSection>
      )}
    </Box>
  );
}
