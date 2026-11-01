import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { REFERENCE_GROUPS, SITUATION_PATHS } from '../config/resourceLinks';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { SituationCard } from '../components/resources/SituationCard/SituationCard';
import { ReferenceLinkCard } from '../components/resources/ReferenceLinkCard/ReferenceLinkCard';
import { ResourceDirectory } from '../components/resources/ResourceDirectory/ResourceDirectory';
import { autoGridSx } from '../components/resources/resourceStyles';

const SECTION_GAP = { mb: { xs: 5, md: 8 } } as const;

export default function Resources() {
  return (
    <PageCanvas maxWidth="lg">
      <PageHeader
        eyebrow="Directory"
        title="Professional Resources"
        description={
          <>
            Find the right help for where you are:
            <br />
            legal counsel, remediation, or an independent audit.
          </>
        }
      />

      <Box component="section" aria-labelledby="situations-title" sx={SECTION_GAP}>
        <SectionHeader id="situations-title" title="Where to start" />
        <Box component="ul" sx={autoGridSx('17rem')}>
          {SITUATION_PATHS.map((path, index) => (
            <Box component="li" key={path.id} sx={{ minWidth: 0 }}>
              <SituationCard path={path} reveal={index} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="references-title" sx={SECTION_GAP}>
        <SectionHeader id="references-title" title="Trusted references" />
        {REFERENCE_GROUPS.map((group) => (
          <Box key={group.id} sx={{ '& + &': { mt: { xs: 3, md: 4 } } }}>
            <Typography id={`references-${group.id}`} variant="eyebrow" component="h3" sx={{ display: 'block', mb: 1.5 }}>
              {group.title}
            </Typography>
            <Box component="ul" aria-labelledby={`references-${group.id}`} sx={autoGridSx('18rem')}>
              {group.links.map((link, index) => (
                <Box component="li" key={link.id} sx={{ minWidth: 0 }}>
                  <ReferenceLinkCard link={link} reveal={index} />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={SECTION_GAP}>
        <ResourceDirectory />
      </Box>

      <Typography component="p" variant="caption" color="text.secondary" sx={{ maxWidth: '72ch', lineHeight: 1.6 }}>
        Listings and links are provided for information and are not endorsements. Univia is not a law firm and does not
        provide legal advice; consult a licensed attorney about any demand letter or lawsuit.
      </Typography>
    </PageCanvas>
  );
}
