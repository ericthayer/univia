import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
  import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface LegalDialogProps {
  open: boolean;
  title: 'Terms' | 'Privacy';
  onClose: () => void;
}

export default function LegalDialog({ open, title, onClose }: LegalDialogProps) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const termsContent = `
    TERMS OF SERVICE

    1. ACCEPTANCE OF TERMS
    By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.

    2. USE LICENSE
    Permission is granted to temporarily download one copy of the materials (information or software) on UniVia's application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
    - Modifying or copying the materials
    - Using the materials for any commercial purpose or for any public display
    - Attempting to decompile or reverse engineer any software contained on the application
    - Removing any copyright or other proprietary notations from the materials
    - Transferring the materials to another person or "mirroring" the materials on any other server

    3. DISCLAIMER
    The materials on UniVia's application are provided on an 'as is' basis. UniVia makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

    4. LIMITATIONS
    In no event shall UniVia or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the application.

    5. ACCURACY OF MATERIALS
    The materials appearing on UniVia's application could include technical, typographical, or photographic errors. UniVia does not warrant that any of the materials on the application are accurate, complete, or current.

    6. MODIFICATIONS
    UniVia may revise these terms of service for the application at any time without notice. By using this application, you are agreeing to be bound by the then current version of these terms of service.

    7. GOVERNING LAW
    These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction where UniVia is located, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
  `;

  const privacyContent = `
    PRIVACY POLICY

    1. INTRODUCTION
    UniVia ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.

    2. INFORMATION WE COLLECT
    We may collect information about you in a variety of ways:

    Personal Data:
    - Name
    - Email address
    - Phone number
    - Organization information
    - Any other information you voluntarily provide

    Automatically Collected Information:
    - Device information (device type, operating system, browser type)
    - Log data (IP address, access times, pages viewed)
    - Usage information (features used, interactions with content)
    - Location information (if permitted)

    3. USE OF YOUR INFORMATION
    We use the information we collect to:
    - Provide, maintain, and improve our services
    - Personalize your experience
    - Send administrative information and updates
    - Respond to your inquiries and provide customer support
    - Analyze usage patterns to improve functionality
    - Comply with legal obligations

    4. DISCLOSURE OF YOUR INFORMATION
    We do not sell, trade, or rent your personal information. We may disclose your information:
    - To service providers who assist us in operating the application
    - When required by law or to protect our rights
    - With your explicit consent

    5. SECURITY OF YOUR INFORMATION
    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.

    6. DATA RETENTION
    We retain personal data for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.

    7. YOUR RIGHTS
    You have the right to:
    - Access your personal data
    - Correct inaccurate data
    - Request deletion of your data
    - Opt-out of certain communications
    - Data portability

    To exercise these rights, please contact us using the contact information below.

    8. CONTACT US
    If you have any questions about this Privacy Policy, please contact us at:
    Email: privacy@univia.com
    Address: [Company Address]

    9. POLICY UPDATES
    We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date of this Privacy Policy.
  `;

  const content = title === 'Terms' ? termsContent : privacyContent;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullScreen}
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          fontSize: '1.25rem',
          borderBottom: '1px solid var(--mui-palette-divider)',
          '[data-color-scheme="dark"] &': {
            borderBottom: '1px solid var(--mui-palette-grey-700)',
          }
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          py: 3,
          '& p': {
            mb: 2,
            lineHeight: 1.8,
            fontSize: '0.875rem',
          },
        }}
      >
        {content.split('\n\n').map((paragraph, index) => (
          <p key={index} style={{ whiteSpace: 'pre-wrap' }}>
            {paragraph}
          </p>
        ))}
      </DialogContent>
      <DialogActions
        sx={{
          py: 2,
          px: 3,
          borderTop: '1px solid var(--mui-palette-divider)',
          '[data-color-scheme="dark"] &': {
            borderTop: '1px solid var(--mui-palette-grey-700)',
          }
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
