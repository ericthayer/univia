---
name: scaffold_component
description: Create a new React component following strict Univia/MUI v7.3 standards.
---

# `scaffold_component` (Univia Local)

Use this skill when the user asks to "create a component", "make a new page", or "add a UI element" within the Univia project. This skill is pre-configured with MUI v7.3+ patterns.

## Usage
1.  **Ask for the Component Name** if not provided.
2.  **Determine the Path**: Default to `src/components/` or the current feature directory.
3.  **Generate the File**: Create a new file named `[ComponentName].tsx`.
4.  **Write the Code**: Use the MUI-native template below.

## Template Rules
- **Framework**: Use Material-UI (MUI v7.3+) components.
- **Layout**: Prefer `Box` and `Grid` (v2) for structural layout.
- **Filename**: PascalCase (e.g., `UserProfile.tsx`).
- **Interface**: Define `[ComponentName]Props`. Use strict types (no `any`).
- **Accessibility**: Use semantic MUI components (`Button`, `TextField`, etc.) and provide `aria-label` or `label` as required by the `web-interface-guidelines`.
- **Theming**: 
  - Use `sx` prop with theme tokens or CSS variables (e.g., `var(--mui-palette-primary-main)`).
  - Respect the design language in `src/theme/`:
    - **Border Radius**: Use `var(--mui-shape-borderRadius)` (default 4, buttons 6).
    - **Colors**: Use `primary`, `secondary`, `success`, `warning`, `error` tokens.
    - **Typography**: Follow the hierarchy (h1-h6, body1, body2) defined in `theme.ts`.
    - **Backgrounds**: Use `var(--mui-palette-background-default)` or `var(--mui-palette-background-paper)`.

## Code Template

```tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

/**
 * Props for the [ComponentName] component.
 */
export interface [ComponentName]Props {
  /** ARIA label for accessibility if the component is interactive but has no visible text */
  'aria-label'?: string;
  /** Primary title or heading for the component */
  title?: string;
  /** Optional children for the component */
  children?: React.ReactNode;
}

/**
 * [Brief description of the component]
 * Follows MUI v7.3+, Univia design tokens (src/theme), and GEMINI.md standards.
 */
export const [ComponentName]: React.FC<[ComponentName]Props> = ({
  'aria-label': ariaLabel,
  title,
  children,
  ...props
}) => {
  return (
    <Card 
      component="section"
      className="[component-name-kebab-case]"
      sx={{
        borderRadius: 'var(--mui-shape-borderRadius)',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
      {...props}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {title && (
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              mb: 2, 
              fontWeight: 700,
              color: 'text.primary'
            }}
          >
            {title}
          </Typography>
        )}
        
        <Box 
          role="region" 
          aria-label={ariaLabel || title || "[Default Label]"}
        >
          {children || (
            <Typography variant="body2" color="text.secondary">
              New component content goes here.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
```


## Post-Generation Checklist
- [x] File created as `.tsx`?
- [x] MUI v7.3 components used correctly?
- [x] Grid v2 utilized for layouts?
- [x] Accessibility (ARIA/Labels) verified?
- [x] No `any` types used?
