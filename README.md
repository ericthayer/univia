# Univia - Web Accessibility

A production-ready MUI application for managing WCAG compliance, accessibility audits, and analyzing demand letters.

<img width="1320" height="679" alt="image" src="https://github.com/user-attachments/assets/ed3eaba1-cfd2-4e29-b22f-983d2ed5a516" />

## Tech Stack

- React 18
- TypeScript
- Material-UI (MUI) v7.3
- Supabase (Database)
- Vite

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type checking
npm run typecheck
```

## Important: Coding Standards

**Before contributing, please read [CODING_STANDARDS.md](./CODING_STANDARDS.md)**

### Quick Reference

1. **Always use the new MUI v7 Grid syntax:**
   ```tsx
   <Grid size={{ xs: 12, md: 6 }}>  // ✅ Correct
   <Grid item xs={12} md={6}>       // ❌ Wrong
   ```

2. **Use CardActionArea for clickable cards:**
   ```tsx
   <Card>
     <CardActionArea onClick={handleClick}>  // ✅ Correct
   ```

3. **ESLint will error on old Grid API usage** - the build will catch mistakes automatically

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── config/         # Configuration files
├── hooks/          # Custom React hooks
├── services/       # API and service integrations
├── theme/          # MUI theme configuration
└── types/          # TypeScript type definitions
```

## Features

- Accessibility audits with Lighthouse integration
- Demand letter management and analysis
- Performance metrics tracking
- Dark/Light mode with system preference detection
- Responsive design (mobile-first)
- Full keyboard navigation support

### Hosted Lighthouse audit configuration

The `run-lighthouse-audit` Edge Function calls the Google PageSpeed Insights API,
which runs Lighthouse remotely. Configure these as Supabase Edge Function
secrets—not as `VITE_*` browser variables:

- `PAGESPEED_API_KEY` — a Google PageSpeed Insights API key with the API enabled
- `SUPABASE_SECRET_KEYS` and `SUPABASE_PUBLISHABLE_KEYS` — the existing JSON key dictionaries, or the compatible `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` fallbacks
- `ALLOWED_ORIGINS` — comma-separated production and local browser origins

The function runs mobile and desktop independently. If one provider run fails,
the completed device report remains available and the results page identifies
the unavailable device. If both runs fail, inspect the Edge Function logs using
the returned `X-Request-ID` and the structured PageSpeed error classification.

## Accessibility

This project follows WCAG 2.1 Level AA standards:
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatibility

## Release Automation

- Semantic Release runs after successful CI on `main`. Manual workflow dispatch is also restricted to `main`.
- Version bumps follow Conventional Commits:
   - `feat` -> minor
   - `fix`, `perf`, `revert` -> patch
   - `refactor`, `docs`, `ci`, `chore`, `style`, `test`, `build` -> no release by default
   - other commit types do not publish a release by default
   - any commit type with a `BREAKING CHANGE:` note publishes a major release
- Releases are published as GitHub tags and GitHub Releases (no npm publish).
- PR titles are validated for Conventional Commit format in CI. Use squash merge so the PR title becomes the commit message on `main`.
- Git tags and GitHub Releases are the release version source of truth. Releases do not update `package.json` or the checked-in `CHANGELOG.md`; the current package metadata may therefore differ from the latest release tag.
- Local preview command: `npm run release:dry-run`
