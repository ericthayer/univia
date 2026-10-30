import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { srOnly } from '../../ui/srOnly';

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  /** Stable id; the label id is derived from it. */
  id: string;
  /** Short field name shown inside the control, e.g. "Status". */
  label: string;
  value: string;
  options: ReadonlyArray<FilterSelectOption>;
  onChange: (value: string) => void;
}

/**
 * Pill select that shows "Label  Value" inside the field instead of a floating
 * notched label, which does not sit well on a fully rounded outline. The label
 * stays in the DOM (visually hidden) so the combobox keeps its accessible name.
 */
export function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  const labelId = `${id}-label`;
  const current = options.find((option) => option.value === value)?.label ?? value;

  return (
    <FormControl size="small" sx={{ minWidth: { xs: 0, md: 160 }, flex: { xs: '1 1 8.5rem', md: '0 0 auto' } }}>
      <InputLabel id={labelId} sx={srOnly}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        renderValue={() => (
          <>
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {label}
            </Box>
            <Box component="span" sx={{ fontWeight: 600 }}>
              {current}
            </Box>
          </>
        )}
        sx={{
          borderRadius: 999,
          minHeight: 44,
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            pl: 2.5,
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default FilterSelect;
