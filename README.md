# Univia - Web Accessibility

A production-ready MUI application for managing WCAG compliance, accessibility audits, and analyzing demand letters.

<img width="2296" height="1275" alt="univia-v1 0 0-alpha 6" src="https://github.com/user-attachments/assets/ac1e532b-c06d-42b2-afe1-2ac752ea735f" />


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

## Accessibility

This project follows WCAG 2.1 Level AA standards:
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatibility
