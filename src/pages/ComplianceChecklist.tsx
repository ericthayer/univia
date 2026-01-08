import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  TextField,
  LinearProgress,
  Chip,
  Button,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { WCAG_CHECKLIST, ChecklistCategory } from '../config/wcagChecklist';
import CustomChecklistManager from '../components/checklist/CustomChecklistManager';
import { useWCAGProgress } from '../hooks/useWCAGProgress';
import Icon from '../components/ui/Icon';

type ChecklistMode = 'wcag' | 'custom';

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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A':
        return 'error';
      case 'AA':
        return 'warning';
      case 'AAA':
        return 'success';
      default:
        return 'default';
    }
  };

  const overall = getOverallProgress();

  if (loading) {
    return (
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <LinearProgress />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 2 }}>
          <Typography variant="h2" gutterBottom>
            Compliance Checklist
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {mode === 'wcag'
              ? 'Work through this comprehensive checklist to ensure your website meets WCAG accessibility standards. Track your progress and add notes for each item.'
              : 'Create and manage custom compliance checklists for your specific needs. Perfect for internal audits, project tracking, and tailored compliance workflows.'
            }
          </Typography>

          <Box sx={{ display: 'none', gap: 2, flexWrap: 'wrap', mb: 4 }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, newMode) => newMode && setMode(newMode)}
              aria-label="checklist mode"
            >
              <ToggleButton value="wcag" aria-label="WCAG checklist">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon name="fact_check" />
                  WCAG Checklist
                </Box>
              </ToggleButton>
              <ToggleButton value="custom" aria-label="custom checklists" sx={{ display: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon name="playlist_add_check" />
                  Custom Checklists
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            {mode === 'wcag' && (
              <Button
                variant="contained"
                href="/audit"
                startIcon={<Icon name="search" />}
              >
                Run Accessibility Audit
              </Button>
            )}
          </Box>
        </Box>

        
          <Alert severity="info" sx={{ mb: 4 }}>
            <strong>Note:</strong> Your WCAG checklist progress is stored locally in your browser. It will be cleared if you clear your browser data.
          </Alert>

        {mode === 'wcag' ? (
          <>
            <Box
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                mb: 4,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Overall Progress
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {overall.completed} / {overall.total}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={overall.percentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                <Chip label="A: Essential" color="error" size="small" />
                <Chip label="AA: Target" color="warning" size="small" />
                <Chip label="AAA: Enhanced" color="success" size="small" />
              </Box>
            </Box>

            {WCAG_CHECKLIST.map((category) => {
          const categoryProgress = getCategoryProgress(category);
          return (
            <Accordion
              key={category.id}
              expanded={expandedCategory === category.id}
              onChange={(_, isExpanded) =>
                setExpandedCategory(isExpanded ? category.id : false)
              }
              sx={{ mb: 2 }}
            >
              <AccordionSummary
                expandIcon={<Icon name="expand_more" />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {categoryProgress.completed} / {categoryProgress.total}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={categoryProgress.percentage}
                      sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {category.items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: progress[item.id]?.completed ? 'success.50' : 'background.default',
                      borderRadius: 2,
                      border: 1,
                      borderColor: progress[item.id]?.completed ? 'success.main' : 'divider',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox
                        checked={progress[item.id]?.completed || false}
                        onChange={(e) => toggleItem(item.id, e.target.checked)}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                            {item.title}
                          </Typography>
                          <Chip
                            label={item.level}
                            color={getLevelColor(item.level) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.5,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            mb: 2,
                          }}
                        >
                          {item.wcagCriteria}
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Add notes..."
                          value={progress[item.id]?.notes || ''}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}
          </>
        ) : (
          <CustomChecklistManager />
        )}

      </Container>
    </Box>
  );
}
