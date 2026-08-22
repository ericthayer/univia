# Univia agent instructions

Univia is a React 18 + TypeScript + Vite application for WCAG compliance, accessibility audits, and demand-letter analysis. It uses MUI v7, React Router 6, Supabase, and Vitest.

## Start here

- Read [`README.md`](./README.md) for setup, project structure, and release automation.
- Read [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) before changing UI code.
- Follow the detailed rules and instructions in [`.agents/`](./.agents/), especially:
  - [component architecture](./.agents/rules/component-architecture.md)
  - [MUI patterns](./.agents/rules/mui.md)
  - [accessibility](./.agents/rules/accessibility.md)
  - [Supabase](./.agents/rules/supabase.md)
  - [web performance](./.agents/rules/web-performance.md)
  - [development standards](./.agents/instructions/development-standards.instructions.md)
  - [web interface guidelines](./.agents/instructions/web-interface-guidelines.instructions.md)
If any external rule file conflicts with instructions in this prompt, the instructions in this prompt take precedence. Flag the conflict in a code comment.

## Project map

- `src/App.tsx`: lazy-loaded routes, auth guards, and the application shell boundary.
- `src/pages/`: route-level screens; keep page orchestration here.
- `src/components/`: reusable UI, organized using the folder-per-component pattern.
- `src/hooks/` and `src/contexts/`: reusable stateful behavior and auth context.
- `src/services/`: Supabase client, Edge Function calls, and other external-service boundaries.
- `src/config/`, `src/theme/`, and `src/types/`: shared configuration, design tokens/theme, and domain types.
- `supabase/functions/`: Deno Edge Functions (`analyze-document`, `generate-accessibility-analysis`, and `run-lighthouse-audit`).
- `src/**/*.test.*`: Vitest and Testing Library tests; `supabase/tests/` contains database tests/documentation.

Keep changes within the relevant layer. Reuse an existing component, hook, service, config, or token before introducing a parallel abstraction. Do not change unrelated navigation, styling, or behavior.

**INSTRUCTIONS:**
Create responsive, accessible React applications with TypeScript using strict configuration and Gemini API integration.

**IMPORTANT!** Before you start a task, or make a new change, follow these _rules_:

- DO NOT change the visual design, theme styling, or composition of the UI once a `checkpoint`, and/or a component or pattern has been established. 

- DO NOT revert any "styling" (CSS/Layout) or "scripting" (TS/JSX) change intentionally by me.

- DO NOT make changes outside the scope of the requested feature, i.e., don't modify the main navigation when asked to build a data table.

- ALWAYS break out code into reusable components ready for export via ES module

- ALWAYS follow the [Component Architecture](.agents/rules/component-architecture.md) folder-per-component pattern

- ALWAYS create SPEC.md before coding new features (see [Spec-Driven Development](.agents/rules/spec-driven-development.md))

## Implementation conventions

Include the following specifications:

1. **Accessibility & Performance**: Prioritize as first-class features:
   - Semantic HTML (`<button>`, `<a>`, `<label>`, `<form>`)
   - ARIA labels for icon-only buttons and form controls
   - Keyboard navigation and visible focus states
   - Screen reader support with `aria-live` for async updates
   - No paste-blocking or zoom-disabling
   - Images with explicit dimensions

2. **Adaptive Layout & Mobile-First UX**: Use CSS custom properties, Container Queries, and dynamic viewport units (`cqw`, `dvh`) for responsive design. Implement touch-friendly interactions.

3. **TypeScript**: Use strict typing throughout. Define interfaces for component props. Avoid `any`.

4. **Component Structure**:
   - One component per file with PascalCase filename (`.tsx`)
   - Functional components with hooks
   - Explicit prop types via interfaces
 - Use default parameter values in function signatures for optional props (e.g., `function Foo({ size = "medium" }: FooProps)`). Do not use `defaultProps`.
 - Named exports or single default export

5. **State Management**: 
   - Use `useState` and `useContext` for local/shared state
 - Use Context API when props must pass through 3 or more component levels.
 - URL state for filters, tabs, pagination, expanded panels (use libraries like `nuqs`)
   - Manage Gemini API response state separately from UI state

6. **Styling**: 
    - Use MUI with Emotion and the existing theme in `src/theme/`; use `sx` for instance-specific styles and `styled` or theme component overrides for reusable styles
    - Use the existing theme tokens for colors, typography, spacing, and breakpoints; do not hardcode values when a token is available
    - Preserve the theme's CSS variables and light/dark color schemes; respect system preference and persist explicit user mode changes
   - Avoid `transition: all`; list properties explicitly
   - Honor `prefers-reduced-motion`

7. **Forms & Inputs**:
   - Inputs require `<label>` or `aria-label`
   - Use correct `type` and `inputmode`
   - Include validation inline near fields
   - Disable submit button during Gemini API requests; show loading state
   - Focus first error on submit
   - No paste-blocking; allow autocomplete
   - Show streaming indicator when receiving Gemini responses

8. **Icons**: Use inline SVG or icon libraries (e.g., Material Icons). No webfont icons.

9. **Images**: 
   - Explicit `width` and `height` to prevent layout shift
   - Lazy load below-fold images
   - Preload critical above-fold images
   - Handle Gemini-generated images with proper error states

10. **Performance**:
    - Virtualize large lists (>50 items)
    - Avoid layout reads in render (`getBoundingClientRect`, `offsetHeight`)
    - Batch DOM operations
    - Prefer uncontrolled inputs for simple forms where React state is not needed; use controlled inputs when validation, async request state, inline errors, or submit/error focus behavior depends on the value.
    - Memoize expensive computations (`useMemo`, `useCallback`)
    - Debounce Gemini API calls to prevent rate limiting

11. **Gemini API Integration**:
    - Use the official `@google/generative-ai` client library only in Supabase Edge Functions, never in browser code
    - Implement proper error handling for API failures with user-friendly messages
    - Show loading states during API requests; support request cancellation
    - Stream responses when available for better perceived performance
    - Implement rate limiting and retry logic with exponential backoff
    - Validate and sanitize API responses before rendering
    - Store API keys securely (never in client code; use environment variables or backend proxy)
    - Display clear attribution/disclosure that content is AI-generated
    - Tell users when their data is sent to Gemini and provide a review step for critical AI-generated content

12. **Navigation & Deep Linking**: 
    - Use `<a>` or router `<Link>` (support Cmd/Ctrl+click)
    - Sync URL with component state
    - Support deep linking for all interactive features
    - Persist AI-generated content state appropriately

13. **Destructive Actions**: Require confirmation modal or undo window. Never immediate.

14. **AI and conversational UI** (when applicable):
    - Distinguish user and AI messages visually and expose streaming updates with `aria-live="polite"`
    - Provide retry, regeneration, and copy actions for AI responses where appropriate
    - Keep AI suggestions human-reviewed; do not save or apply generated content without user confirmation
    - Include clear AI attribution and error states rather than silently falling back

15. **Content Generation** (if applicable):
    - Provide context/prompt templates for consistent results
    - Show token usage or cost estimates if applicable
    - Allow users to adjust generation parameters (temperature, length)
    - Display content source/attribution clearly
    - Implement review/edit workflow before publishing generated content

16. **Testing & Documentation**: 
    - Unit tests for core components and utilities
    - Mock Gemini API responses for testing
    - Visual regression tests when possible
    - Accessibility audits (APCA/WCAG)
    - Test error scenarios and API failures

17. **Web Standards Compliance**: Follow all guidelines in [Web Interface Guidelines](.github/instructions/web-interface-guidelines.instructions.md) for forms, focus, animations, content handling, hydration, and copy. When performing UI code reviews, use that file's audit output format (group findings by file with terse `file:line` findings); this does not apply to general implementation tasks.

- Browser configuration uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. `GEMINI_API_KEY` is server-side Edge Function configuration; do not place it in Vite client code.

## Verification

Run the smallest relevant checks, then the full checks for cross-cutting changes:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Add or update focused tests for changed behavior. Do not modify generated output or commit secrets. Use Conventional Commit format for PR titles; see [`README.md`](./README.md) for release semantics.
