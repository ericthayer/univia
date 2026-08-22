---
name: scaffold-component
description: Create an accessible React component using Univia's MUI and folder-per-component conventions.
---

# `scaffold-component`

Use this skill when adding a reusable component to Univia.

## Development process

1. Read [development standards](../../instructions/development-standards.instructions.md), [component architecture](../../rules/component-architecture.md), and [spec-driven development](../../rules/spec-driven-development.md).
2. Create the component specification before implementation at `src/components/[category]/[ComponentName]/[ComponentName].spec.md`.
3. Create the component folder and a PascalCase `.tsx` file. Use MUI components and the existing theme; do not introduce Tailwind or a parallel styling system.
4. Define an exported TypeScript interface for props. Prefer named exports and one major component per file.
5. Use MUI v7 Grid syntax with `size={{ xs: 12, md: 6 }}`; never use `item` or direct breakpoint props.
6. Add focused Vitest and Testing Library tests for behavior, keyboard interaction, and important accessibility states.
7. Update the specification changelog when implementation discoveries change the design.

## Component requirements

- Use semantic HTML and accessible names for all controls.
- Provide visible focus states, responsive behavior, and reduced-motion support.
- Use `CardActionArea` for clickable cards and router `Link`/native anchors for navigation.
- Keep external-service access in `src/services/` and preserve existing auth/context boundaries.
- Keep optional prop defaults explicit and avoid `any`, unused locals, and unused parameters.

## Expected files

```text
src/components/[category]/[ComponentName]/
├── [ComponentName].tsx
├── [ComponentName].test.tsx
├── [ComponentName].spec.md
└── index.ts
```

Add stories only if Storybook is introduced and configured in the repository.