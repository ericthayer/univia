import { Box, Container, Typography, Grid, Stack, Chip, Divider } from '@mui/material';
import HelpSearchBar from '../components/help/HelpSearchBar';
import HelpCategoryCard from '../components/help/HelpCategoryCard';
import FeaturedArticle from '../components/help/FeaturedArticle';
import HelpTipCard from '../components/help/HelpTipCard';
import { HELP_CATEGORIES, FEATURED_ARTICLES, HELP_TIPS, COMMON_TOPICS } from '../config/helpContent';
import Icon from '../components/ui/Icon';

export default function HelpCenter() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log('Category clicked:', categoryId);
  };

  const handleArticleClick = (articleId: string) => {
    console.log('Article clicked:', articleId);
  };

  return (
    <Box>
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'primary.dark',
            opacity: 0.3,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            opacity: 0.2,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '15%',
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            opacity: 0.3,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: 150,
            height: 150,
            borderRadius: '50%',
            bgcolor: 'warning.main',
            opacity: 0.25,
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            component="h1"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              mb: 4,
            }}
          >
            Hi. How can we help?
          </Typography>

          <Stack justifyContent="center">
            <HelpSearchBar onSearch={handleSearch} />
          </Stack>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.9 }}>
              Common troubleshooting topics:
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
            >
              {COMMON_TOPICS.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  onClick={() => handleSearch(topic)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'inherit',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.contrastText',
                      outlineOffset: 2,
                    },
                  }}
                  aria-label={`Search for ${topic}`}
                />
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {HELP_CATEGORIES.map((category) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
              <HelpCategoryCard
                category={category}
                onClick={() => handleCategoryClick(category.id)}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 6 }} />

        <Box sx={{ mb: 6 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Icon name="article" style={{ color: 'inherit' }} />
            <Typography variant="h5" component="h2" fontWeight={600}>
              Featured articles
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {FEATURED_ARTICLES.map((article) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
                <FeaturedArticle
                  article={article}
                  onClick={() => handleArticleClick(article.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Icon name="tips_and_updates" style={{ color: 'inherit' }} />
            <Typography variant="h5" component="h2" fontWeight={600}>
              Quick Tips
            </Typography>
          </Stack>
          <Grid container spacing={3}>
            {HELP_TIPS.map((tip) => (
              <Grid size={{ xs: 12, md: 4 }} key={tip.id}>
                <HelpTipCard tip={tip} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
