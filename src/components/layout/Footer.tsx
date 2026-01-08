import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDialog from './LegalDialog';
import AdminMenu from '../admin/AdminMenu';
import packageJson from '../../../package.json';

export default function Footer() {
  const navigate = useNavigate();
  const [openLegalDialog, setOpenLegalDialog] = useState(false);
  const [legalDialogType, setLegalDialogType] = useState<'Terms' | 'Privacy'>('Terms');

  const handleOpenLegalDialog = (type: 'Terms' | 'Privacy') => {
    setLegalDialogType(type);
    setOpenLegalDialog(true);
  };

  const handleCloseLegalDialog = () => {
    setOpenLegalDialog(false);
  };

  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid var(--mui-palette-divider)',
        backgroundColor: 'background.default',
        py: 2,
        pr: 'env(safe-area-inset-right)',
        pl: 'env(safe-area-inset-left)',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          px: 2,
        }}
      >
        <Stack direction="row" alignItems="center" flex={1} gap={1}>
          <Button
            size="small"
            variant="text"
            onClick={() => handleOpenLegalDialog('Terms')}
          >
            Terms
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => handleOpenLegalDialog('Privacy')}
          >
            Privacy
          </Button>
        </Stack>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button
            size="small"
            variant="text"
            onClick={() => navigate('/pattern-library')}
          >
            v{packageJson.version}
          </Button>
        </Stack>
      </Container>

      <LegalDialog
        open={openLegalDialog}
        title={legalDialogType}
        onClose={handleCloseLegalDialog}
      />
    </Box>
  );
}
