import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { FeaturedArticle as FeaturedArticleType } from '../../config/helpContent';
import Icon from '../ui/Icon';

interface FeaturedArticleProps {
  article: FeaturedArticleType;
  onClick?: () => void;
}

/**
 * One row of the featured-articles list. Renders an `<li>`; the parent supplies
 * the `<ul>` and the hairline-bordered surface.
 */
export default function FeaturedArticle({ article, onClick }: FeaturedArticleProps) {
  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        '& + &': { borderTop: '1px solid', borderColor: 'divider' },
      }}
    >
      <ButtonBase
        onClick={onClick}
        aria-label={`Read article: ${article.title}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          width: '100%',
          minHeight: 56,
          px: 3,
          py: 1.5,
          textAlign: 'left',
          color: 'text.primary',
          transition: (theme) =>
            `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
          '&:hover': { bgcolor: 'action.hover' },
          '&.Mui-focusVisible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: -2,
          },
          '&:hover .FeaturedArticle-arrow': { transform: 'translate(2px, -1px)', color: 'text.primary' },
        }}
      >
        <Typography component="span" sx={{ fontWeight: 550 }}>
          {article.title}
        </Typography>
        <Box
          className="FeaturedArticle-arrow"
          aria-hidden="true"
          sx={{
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            color: 'text.secondary',
            fontSize: '1.125rem',
            transition: (theme) =>
              `transform ${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}, color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
          }}
        >
          <Icon name="north_east" />
        </Box>
      </ButtonBase>
    </Box>
  );
}
