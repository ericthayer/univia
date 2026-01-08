import { Link, Typography } from '@mui/material';
import type { FeaturedArticle as FeaturedArticleType } from '../../config/helpContent';

interface FeaturedArticleProps {
  article: FeaturedArticleType;
  onClick?: () => void;
}

export default function FeaturedArticle({ article, onClick }: FeaturedArticleProps) {
  return (
    <Link
      component="button"
      onClick={onClick}
      underline="always"
      sx={{
        textAlign: 'left',
        display: 'block',
        py: 0.5,
        color: 'primary.main',
        fontWeight: 500,
        '&:focus': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
          borderRadius: 0.5,
        },
      }}
      aria-label={`Read article: ${article.title}`}
    >
      <Typography component="span">
        {article.title}
      </Typography>
    </Link>
  );
}
