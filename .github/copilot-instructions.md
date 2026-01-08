# Copilot Instructions for Univia

## Project Overview
Univia is a web accessibility compliance platform built with React 18, TypeScript, MUI v7, and Supabase. It provides WCAG auditing, demand letter analysis, and compliance checklist management.

## Critical Rules (Read First)

### MUI v7 Grid Syntax
**ESLint enforces the new Grid API.** Using the old syntax will cause build errors.

```tsx
// ✅ Correct
<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6 }}>
    <Component />
  </Grid>
</Grid>

// ❌ Wrong - ESLint error
<Grid item xs={12} md={6}>
```

### Clickable Cards
**Always use `CardActionArea` for clickable cards** - provides keyboard nav, ARIA, and ripple effects:

```tsx
// ✅ Correct
<Card>
  <CardActionArea onClick={handleClick}>
    <CardContent>{/* content */}</CardContent>
  </CardActionArea>
</Card>

// ❌ Wrong - missing accessibility
<Card onClick={handleClick} sx={{ cursor: 'pointer' }}>
```

See [CODING_STANDARDS.md](CODING_STANDARDS.md) for complete MUI v7 patterns.

## Architecture

### Three-Tier Structure
```
Frontend (React/MUI) ←→ Supabase Client ←→ Backend (Edge Functions + PostgreSQL)
```

**Frontend** (`src/`):
- React 18 SPA with lazy-loaded routes via React Router v6
- MUI v7 theming with CSS variables for light/dark mode
- Custom hooks for validation, auth state, and data fetching

**Data Layer** (`supabase/`):
- **Postgres**: Schema defined in timestamped migrations (`supabase/migrations/`)
- **Edge Functions** (Deno runtime):
  - `analyze-document`: Gemini AI integration for demand letter analysis
  - `run-lighthouse-audit`: PageSpeed Insights API for WCAG audits
- **Storage**: `documents` bucket for uploaded files (demand letters, PDFs)

**Key Pattern**: Frontend calls Edge Functions via Supabase client, not direct API calls.

### Authentication & User State
- **Context**: `AuthContext` wraps entire app in [App.tsx](src/App.tsx) - provides `user` and `profile`
- **User vs Profile**: `user` is Supabase auth user; `profile` is custom data from `user_profiles` table
- **Session**: Managed by Supabase - persists across page reloads
- **Usage**: `const { user, profile } = useAuth()` in any component

```tsx
// Example: Conditional UI based on auth state
const { user, profile } = useAuth();
if (!user) return <LoginPrompt />;
if (profile?.role === 'admin') return <AdminPanel />;
```

### Navigation & Routing
**Single source of truth**: [src/config/navigation.ts](src/config/navigation.ts) defines both routes and menus.

```typescript
// Routes use ROUTE_PATHS constants
<Route path={ROUTE_PATHS.AUDIT} element={<AccessibilityAudit />} />

// Same config drives sidebar/header navigation via MENU_ITEMS
// Controls visibility: showInHeader, showInSidebar, badge, disabled
```

All pages lazy-loaded in [App.tsx](src/App.tsx):
```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Wrapped in <Suspense fallback={<PageLoader />}>
```

### Theme & Styling
- **MUI v7**: CSS variables enable runtime theme switching (light/dark)
- **Design tokens**: [src/theme/tokens.ts](src/theme/tokens.ts) defines primitives (colors, spacing, shadows)
- **Theme system**: [src/theme/theme.ts](src/theme/theme.ts) configures MUI components
- **Auto mode**: `useSystemColorMode` hook syncs with OS preference

**Rule**: Never hardcode colors/spacing - use `theme.palette.*` or design tokens:
```tsx
// ✅ Correct
<Box sx={{ bgcolor: 'primary.main', p: 3 }}>
// ❌ Wrong
<Box sx={{ backgroundColor: '#1976d2', padding: '24px' }}>
```

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

**Pattern**: Functions invoked via Supabase client from frontend:
```tsx
const { data, error } = await supabase.functions.invoke('analyze-document', {
  body: { fileContent, fileName, fileType }
});
```

## Component Patterns

### Layout Structure
`AppShell` component ([src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx)) provides:
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
6. **Edge Functions**: Call via Supabase client, not direct HTTP requests
7. **Bundle optimization**: Manual chunks defined in [vite.config.ts](vite.config.ts) - vendor libs separated
