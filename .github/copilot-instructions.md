# Copilot instructions for Univia

Project-wide guidance lives in the root [`AGENTS.md`](../AGENTS.md). Treat it as the source of truth and follow the detailed rules linked there rather than duplicating them here.

## Accurate project context

- React 18, TypeScript, Vite, and React Router 6; this is not a Next.js app.
- MUI v7.3 with Emotion and theme CSS variables; use the existing theme in `src/theme/`.
- Supabase provides authentication, database/storage access, and Deno Edge Functions.
- Vitest and Testing Library are used for tests.

## High-value rules

- Keep route orchestration in `src/pages/` and `src/App.tsx`; keep reusable UI in `src/components/` using the folder-per-component pattern.
- Put external-service access in `src/services/` and use the existing auth/context boundaries. Preserve Supabase RLS.
- Use strict TypeScript and interfaces for component props. Do not add `any`, unused locals, or unused parameters.
- Use MUI v7 Grid syntax: `<Grid size={{ xs: 12, md: 6 }}>`; never use the old `item` prop.
- Use `CardActionArea` for clickable cards, theme tokens for styling, semantic HTML, accessible labels/focus states, and confirmation for destructive actions.
- Do not introduce Server Components or React 19-only APIs. Avoid unrelated visual or navigation changes.
- Keep `GEMINI_API_KEY` server-side in Supabase; browser code may use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Checks

For behavior changes, add focused tests and run the relevant checks. For broad changes, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. See [`README.md`](../README.md) and [`CODING_STANDARDS.md`](../CODING_STANDARDS.md) for setup and release details.
