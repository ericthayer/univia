import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import type { HelpTip } from '../../config/helpContent';
import Icon from '../ui/Icon';

interface HelpTipCardProps {
  tip: HelpTip;
}

export default function HelpTipCard({ tip }: HelpTipCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: 4,
        borderColor: 'primary.main',
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Icon name={tip.icon} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {tip.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tip.description}
            </Typography>
            {tip.keyboardShortcut && (
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  display: 'inline-block',
                  px: 1,
                  py: 0.5,
                  bgcolor: 'action.hover',
                  borderRadius: 0.5,
                  fontFamily: 'monospace',
                }}
              >
                {tip.keyboardShortcut}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
