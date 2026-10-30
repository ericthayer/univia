import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { ChecklistItem } from '../../../config/wcagChecklist';
import { TonePill, TonePillVariant } from '../../ui/TonePill/TonePill';

export interface WcagChecklistItemProps {
  criterion: ChecklistItem;
  completed: boolean;
  notes: string;
  onToggle: (completed: boolean) => void;
  onNotesChange: (notes: string) => void;
}

/**
 * WCAG conformance level by visual weight, so the palette stays monochrome and
 * emphasis tracks importance: A is essential (inverse), AA is the target
 * (tint), AAA is enhanced (outline).
 */
const LEVEL_VARIANT: Record<ChecklistItem['level'], TonePillVariant> = {
  A: 'solid',
  AA: 'tonal',
  AAA: 'outline',
};

export function WcagLevelPill({ level }: { level: ChecklistItem['level'] }) {
  return <TonePill variant={LEVEL_VARIANT[level]}>{level}</TonePill>;
}

/**
 * One WCAG success criterion as a flush list row: checkbox, title with level,
 * description, criteria reference, and a notes field. Render inside a `<ul>`.
 */
export function WcagChecklistItem({ criterion, completed, notes, onToggle, onNotesChange }: WcagChecklistItemProps) {
  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        py: 2.5,
        pl: { xs: 1.5, sm: 2 },
        pr: { xs: 2, sm: 3 },
        transition: (theme) =>
          `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
        bgcolor: completed ? 'action.hover' : 'transparent',
        '& + &': {
          borderTop: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Checkbox
        checked={completed}
        onChange={(e) => onToggle(e.target.checked)}
        slotProps={{ input: { 'aria-label': `Mark "${criterion.title}" as complete` } }}
        sx={{ p: 1.25, mt: -0.5 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 0.5 }}>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{ fontWeight: 600, flex: 1, minWidth: 0, color: completed ? 'text.secondary' : 'text.primary' }}
          >
            {criterion.title}
          </Typography>
          <Box sx={{ flexShrink: 0, pt: 0.25 }}>
            <WcagLevelPill level={criterion.level} />
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {criterion.description}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'inline-block',
            px: 1.25,
            py: 0.5,
            mb: 2,
            borderRadius: 999,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {criterion.wcagCriteria}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add notes…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          size="small"
          slotProps={{ htmlInput: { 'aria-label': `Notes for ${criterion.title}` } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
      </Box>
    </Box>
  );
}

export default WcagChecklistItem;
