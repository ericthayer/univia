import { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { WCAG_CHECKLIST, ChecklistCategory } from '../config/wcagChecklist';
import CustomChecklistManager from '../components/checklist/CustomChecklistManager';
import { WcagChecklistItem } from '../components/checklist/WcagChecklistItem/WcagChecklistItem';
import { useWCAGProgress } from '../hooks/useWCAGProgress';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import Icon from '../components/ui/Icon';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { ScoreBar } from '../components/ui/ScoreBar/ScoreBar';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { SegmentedToggleGroup } from '../components/ui/SegmentedToggleGroup/SegmentedToggleGroup';
import { TonePill } from '../components/ui/TonePill/TonePill';

type ChecklistMode = 'wcag' | 'custom';

const WIDE = '@container (min-width: 900px)';

const LEVEL_LEGEND = [
  { level: 'A', variant: 'solid', label: 'Essential' },
  { level: 'AA', variant: 'tonal', label: 'Target' },
  { level: 'AAA', variant: 'outline', label: 'Enhanced' },
] as const;

export default function ComplianceChecklist() {
  const { progress, loading, toggleItem, updateNotes } = useWCAGProgress();
  const [mode, setMode] = useState<ChecklistMode>('wcag');
  const [expandedCategory, setExpandedCategory] = useState<string | false>('content');

  const getCategoryProgress = (category: ChecklistCategory) => {
    const completed = category.items.filter(
      (item) => progress[item.id]?.completed
    ).length;
    return {
      completed,
      total: category.items.length,
      percentage: (completed / category.items.length) * 100,
    };
  };

  const getOverallProgress = () => {
    const allItems = WCAG_CHECKLIST.flatMap((cat) => cat.items);
    const completed = allItems.filter((item) => progress[item.id]?.completed).length;
    return {
      completed,
      total: allItems.length,
      percentage: (completed / allItems.length) * 100,
    };
  };

  const overall = getOverallProgress();

  if (loading) {
    return (
      <PageCanvas>
        <LinearProgress aria-label="Loading checklist" />
      </PageCanvas>
    );
  }

  return (
    <PageCanvas>
      <PageHeader
        eyebrow="Compliance"
        title="Compliance Checklist"
        description={
          mode === 'wcag'
            ? 'Work through this comprehensive checklist to ensure your website meets WCAG accessibility standards. Track your progress and add notes for each item.'
            : 'Create and manage custom compliance checklists for your specific needs. Perfect for internal audits, project tracking, and tailored compliance workflows.'
        }
        actions={
          <Box sx={{ display: 'none', gap: 2, flexWrap: 'wrap' }}>
            <SegmentedToggleGroup
              value={mode}
              exclusive
              onChange={(_, newMode: ChecklistMode | null) => newMode && setMode(newMode)}
              aria-label="Checklist mode"
            >
              <ToggleButton value="wcag" aria-label="WCAG checklist">
                <Icon name="fact_check" style={{ fontSize: 16 }} aria-hidden />
                WCAG Checklist
              </ToggleButton>
              <ToggleButton value="custom" aria-label="Custom checklists" sx={{ display: 'none' }}>
                <Icon name="playlist_add_check" style={{ fontSize: 16 }} aria-hidden />
                Custom Checklists
              </ToggleButton>
            </SegmentedToggleGroup>

            {mode === 'wcag' && (
              <ArrowButton href="/audit" startIcon={<Icon name="search" />}>
                Run Accessibility Audit
              </ArrowButton>
            )}
          </Box>
        }
      />

      {mode === 'wcag' ? (
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: '1fr',
            alignItems: 'start',
            [WIDE]: { gridTemplateColumns: 'minmax(0, 4fr) minmax(0, 8fr)' },
          }}
        >
          <BezelCard
            component="section"
            aria-labelledby="checklist-progress-title"
            reveal={0}
            sx={{
              [WIDE]: { position: 'sticky', top: 88 },
            }}
          >
            <SectionHeader
              id="checklist-progress-title"
              title="Overall Progress"
              meta={`${overall.completed} / ${overall.total}`}
              dense
            />
            <ScoreBar label="Criteria completed" value={overall.percentage} tone="neutral" />

            <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 3, p: 0, display: 'grid', gap: 1.25 }}>
              {LEVEL_LEGEND.map(({ level, variant, label }) => (
                <Box component="li" key={level} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TonePill variant={variant}>{level}</TonePill>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                mt: 3,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            >
              <Icon name="info" style={{ fontSize: 16, marginTop: 3, flexShrink: 0 }} aria-hidden />
              <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                Your WCAG checklist progress is stored locally in your browser. It will be cleared if you clear your browser data.
              </Typography>
            </Box>
          </BezelCard>

          <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
            {WCAG_CHECKLIST.map((category, index) => {
              const categoryProgress = getCategoryProgress(category);
              return (
                <BezelCard key={category.id} padding="none" reveal={index + 1} sx={{ overflow: 'hidden' }}>
                  <Accordion
                    expanded={expandedCategory === category.id}
                    onChange={(_, isExpanded) =>
                      setExpandedCategory(isExpanded ? category.id : false)
                    }
                    disableGutters
                    elevation={0}
                    square
                    sx={{
                      bgcolor: 'transparent',
                      backgroundImage: 'none',
                      '&::before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<Icon name="expand_more" />}
                      sx={{ px: { xs: 2, sm: 3 }, py: 1, minHeight: 72 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1, minWidth: 0 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                            {category.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {category.description}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 72, textAlign: 'right', flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {categoryProgress.completed} / {categoryProgress.total}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={categoryProgress.percentage}
                            aria-label={`${category.name} progress`}
                            sx={{
                              height: 4,
                              borderRadius: 999,
                              mt: 0.75,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: 'text.secondary' },
                            }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box component="ul" sx={{ m: 0, p: 0 }}>
                        {category.items.map((item) => (
                          <WcagChecklistItem
                            key={item.id}
                            criterion={item}
                            completed={progress[item.id]?.completed || false}
                            notes={progress[item.id]?.notes || ''}
                            onToggle={(checked) => toggleItem(item.id, checked)}
                            onNotesChange={(value) => updateNotes(item.id, value)}
                          />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </BezelCard>
              );
            })}
          </Box>
        </Box>
      ) : (
        <CustomChecklistManager />
      )}
    </PageCanvas>
  );
}
