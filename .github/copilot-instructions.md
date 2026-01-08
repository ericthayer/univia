# Copilot Instructions for Univia

## Project Overview
Univia is a web accessibility compliance platform built with React 18, TypeScript, MUI v7, and Supabase. It provides WCAG auditing, demand letter analysis, and compliance checklist management.

## Critical: MUI v7 Grid Syntax
**Always use the new Grid syntax with `size` prop.** ESLint will error on the old API.

```tsx
// ✅ Correct
<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6 }}>
    <Component />
  </Grid>
</Grid>

// ❌ Wrong - will fail ESLint
<Grid item xs={12} md={6}>
```

See `CODING_STANDARDS.md` for full details on MUI patterns, including `CardActionArea` for clickable cards.

## Architecture

### Authentication Flow
- `AuthContext` wraps the entire app (`App.tsx`)
- Use `const { user, profile } = useAuth()` in components
- `profile` comes from `user_profiles` table (separate from Supabase auth)
- Auth state persists via Supabase session management

### Data Layer
- **Frontend**: Supabase client (`src/services/supabaseClient.ts`)
- **Backend**: Two Supabase Edge Functions in `supabase/functions/`:
  - `analyze-document`: AI-powered demand letter analysis
  - `run-lighthouse-audit`: PageSpeed Insights integration for accessibility scoring
- **Migrations**: SQL files in `supabase/migrations/` define schema

### Routing
- React Router v6 with lazy-loaded pages (`App.tsx`)
- Route paths defined in `src/config/navigation.ts` as `ROUTE_PATHS`
- Navigation structure also drives sidebar/header menus via `MENU_ITEMS`

### Theme System
- MUI v7 with CSS variables and color scheme selector (`src/theme/theme.ts`)
- Primitive tokens in `src/theme/tokens.ts`
- System color mode detection via `useSystemColorMode` hook
- Always use theme tokens for colors/spacing, never hardcoded values

## Input Validation Pattern
**All user input must be sanitized and validated** per `INPUT_VALIDATION_GUIDE.md`.

```tsx
import { useFormValidation } from '../hooks/useFormValidation';
import { ValidationProcessor } from '../utils/validation';

const { validateField, getFieldError } = useFormValidation();

// Sanitize + validate in one step
const { sanitized, error } = ValidationProcessor.processUrl(rawUrl);
validateField('url', sanitized, error);
```

Common validators/sanitizers in `src/utils/validation.ts`:
- `Sanitizers.url()`, `Sanitizers.email()`, `Sanitizers.text()`
- `Validators.url()`, `Validators.email()`, `Validators.required()`
- `ValidationProcessor` combines both steps

## Development Workflow

### Commands
```bash
npm run dev          # Vite dev server
npm run typecheck    # TypeScript type checking (no emit)
npm run lint         # ESLint with MUI v7 rules
npm run build        # Production build
npm run size-check   # Build + bundle size analysis
```

### Environment Setup
Required `.env` variables (see `src/services/supabaseClient.ts`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Missing env vars will throw a clear error on startup.

### Supabase Edge Functions
- Written in TypeScript for Deno runtime
- Use `jsr:@supabase/functions-js/edge-runtime.d.ts` imports
- CORS headers required for all responses
- Deploy with `supabase functions deploy <function-name>`

## Component Patterns

### Lazy Loading
All pages lazy-loaded in `App.tsx`:
```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Wrapped in <Suspense fallback={<PageLoader />}>
```

### Layout Structure
`AppShell` component (`src/components/layout/AppShell.tsx`) provides:
- Skip-to-main-content link for accessibility
- Header + Sidebar navigation
- Main content area with `id="main-content"` and `role="main"`

### Custom Hooks
- `useFormValidation`: Debounced validation with dirty/touched state
- `useSystemColorMode`: Syncs MUI theme with OS preference
- `useUserAudits`: Fetches audit history from Supabase
- `useWCAGProgress`: Calculates checklist completion
- `useLocalStorageChecklists`: Persists custom checklists

## Key Files
- `CODING_STANDARDS.md`: MUI v7 Grid syntax, Card interactions, theme usage
- `INPUT_VALIDATION_GUIDE.md`: Comprehensive validation system docs
- `src/config/wcagChecklist.ts`: WCAG 2.1 Level A/AA criteria definitions
- `src/config/navigation.ts`: Route paths and menu structure
- `src/types/auth.ts`: User profile TypeScript types

## Common Gotchas
1. **Grid syntax**: ESLint enforces MUI v7 `size` prop - old `item` prop errors
2. **Validation**: Always sanitize before validation using `ValidationProcessor`
3. **Auth context**: `profile` is separate from `user` (database vs auth)
4. **Lazy imports**: Pages must use `lazy()` to maintain bundle size
5. **Theme tokens**: Never hardcode colors - use `theme.palette.*` or design tokens
