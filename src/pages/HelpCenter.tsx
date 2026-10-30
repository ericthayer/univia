import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import HelpSearchBar from '../components/help/HelpSearchBar';
import HelpCategoryCard from '../components/help/HelpCategoryCard';
import FeaturedArticle from '../components/help/FeaturedArticle';
import HelpTipCard from '../components/help/HelpTipCard';
import { HELP_CATEGORIES, FEATURED_ARTICLES, HELP_TIPS, COMMON_TOPICS } from '../config/helpContent';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { TonePill } from '../components/ui/TonePill/TonePill';

const AUTO_GRID_SX = (min: string) =>
  ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}), 1fr))`,
    gap: 3,
    listStyle: 'none',
    m: 0,
    p: 0,
  }) as const;

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
    <PageCanvas maxWidth="lg">
      <PageHeader eyebrow="Support" title="How can we help?" description="Search the guides or pick a topic below." />

      <Box sx={{ mb: { xs: 5, md: 8 } }}>
        <HelpSearchBar onSearch={handleSearch} />
        <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 0.5 }}>
          <Typography variant="body2" color="text.secondary" id="common-topics-label">
            Common topics
          </Typography>
          <Box
            component="ul"
            aria-labelledby="common-topics-label"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, listStyle: 'none', m: 0, p: 0 }}
          >
            {COMMON_TOPICS.map((topic) => (
              <li key={topic}>
                <ButtonBase
                  onClick={() => handleSearch(topic)}
                  aria-label={`Search for ${topic}`}
                  sx={{
                    minHeight: 44,
                    px: 0.5,
                    borderRadius: 999,
                    '& > span': {
                      transition: (theme) =>
                        `color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}, border-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
                    },
                    '&:hover > span': { color: 'text.primary', borderColor: 'text.secondary' },
                    '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
                  }}
                >
                  <TonePill variant="outline">{topic}</TonePill>
                </ButtonBase>
              </li>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" aria-label="Help categories" sx={{ mb: { xs: 5, md: 8 } }}>
        <Box component="ul" sx={AUTO_GRID_SX('17rem')}>
          {HELP_CATEGORIES.map((category, index) => (
            <Box component="li" key={category.id} sx={{ minWidth: 0 }}>
              <HelpCategoryCard
                category={category}
                reveal={index}
                onClick={() => handleCategoryClick(category.id)}
              />
            </Box>
          ))}
        </Box>
      </Box>

      <BezelCard
        component="section"
        aria-labelledby="featured-articles-title"
        padding="none"
        sx={{ overflow: 'hidden', mb: { xs: 5, md: 8 } }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <SectionHeader id="featured-articles-title" title="Featured articles" meta={FEATURED_ARTICLES.length} dense />
        </Box>
        <Box
          component="ul"
          sx={{ listStyle: 'none', m: 0, p: 0, borderTop: '1px solid', borderColor: 'divider' }}
        >
          {FEATURED_ARTICLES.map((article) => (
            <FeaturedArticle key={article.id} article={article} onClick={() => handleArticleClick(article.id)} />
          ))}
        </Box>
      </BezelCard>

      <Box component="section" aria-labelledby="quick-tips-title">
        <SectionHeader id="quick-tips-title" title="Quick Tips" />
        <Box component="ul" sx={AUTO_GRID_SX('16rem')}>
          {HELP_TIPS.map((tip, index) => (
            <Box component="li" key={tip.id} sx={{ minWidth: 0 }}>
              <HelpTipCard tip={tip} reveal={index} />
            </Box>
          ))}
        </Box>
      </Box>
    </PageCanvas>
  );
}
