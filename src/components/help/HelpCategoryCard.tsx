import { Card, CardContent, Typography, Box } from '@mui/material';
import type { HelpCategory } from '../../config/helpContent';
import Icon from '../ui/Icon';

interface HelpCategoryCardProps {
  category: HelpCategory;
  onClick?: () => void;
}

export default function HelpCategoryCard({ category, onClick }: HelpCategoryCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        '&:focus-within': {
          outline: '3px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${category.title} help articles`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Icon name={category.icon} style={{ fontSize: 40 }} />
          </Box>
        </Box>
        <Typography variant="h6" component="h3" fontWeight={600} gutterBottom>
          {category.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {category.description}
        </Typography>
      </CardContent>
    </Card>
  );
}
