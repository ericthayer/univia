import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { AuditInstance } from '../../../config/fixGuides';
import { codeBlockSx } from './codeBlockSx';

interface InstanceListProps {
  instances: AuditInstance[];
}

const KIND_LABEL: Record<AuditInstance['kind'], string> = {
  element: 'Element',
  resource: 'File',
  message: 'Message',
};

/** The specific places this rule failed, each with a plain-language reading when we have one. */
export function InstanceList({ instances }: InstanceListProps) {
  return (
    <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1.5 }}>
      {instances.map((instance, index) => (
        <Box component="li" key={index} sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            {KIND_LABEL[instance.kind]} {index + 1}
          </Typography>
          <Box component="code" sx={codeBlockSx}>
            {instance.text}
          </Box>
          {instance.diagnosis && (
            <Typography variant="body2" sx={{ mt: 0.75 }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                What this means:{' '}
              </Box>
              {instance.diagnosis}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
