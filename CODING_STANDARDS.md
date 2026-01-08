# Coding Standards

## MUI Grid Component (CRITICAL)

**Always use the new MUI v7 Grid syntax with the `size` prop.**

### ✅ Correct Usage

```tsx
<Grid container spacing={3}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <YourComponent />
  </Grid>
</Grid>
```

### ❌ Incorrect Usage (Old API)

```tsx
// DO NOT USE - This is the deprecated MUI Grid v6 API
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4}>
    <YourComponent />
  </Grid>
</Grid>
```

### Why This Matters

- The old `item` prop is deprecated in MUI v7
- Using the old API causes TypeScript errors
- The new `size` prop provides better type safety
- ESLint will error if you use the old syntax

### Quick Reference

| Breakpoint | Description | Size (px) |
|------------|-------------|-----------|
| xs | Extra small | 0+ |
| sm | Small | 600+ |
| md | Medium | 900+ |
| lg | Large | 1200+ |
| xl | Extra large | 1536+ |

### Common Patterns

**Full width on mobile, half on tablet, third on desktop:**
```tsx
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
```

**Half width on mobile and up:**
```tsx
<Grid size={{ xs: 6 }}>
```

**Full width on mobile, quarter on desktop:**
```tsx
<Grid size={{ xs: 12, md: 3 }}>
```

## Card Interactions

**Always use `CardActionArea` for clickable cards, not `onClick` on Card.**

### ✅ Correct Usage

```tsx
<Card>
  <CardActionArea onClick={handleClick}>
    <CardContent>
      {/* Card content */}
    </CardContent>
  </CardActionArea>
</Card>
```

### ❌ Incorrect Usage

```tsx
// DO NOT USE - Missing accessibility features
<Card onClick={handleClick} sx={{ cursor: 'pointer' }}>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

### Why This Matters

- `CardActionArea` provides proper keyboard navigation (Tab, Enter, Space)
- Includes ARIA attributes automatically
- Adds ripple effect for better UX
- Improves accessibility for screen readers

## Additional Standards

### Theme System

- Always use theme tokens for colors, spacing, and typography
- Never hardcode CSS values when theme tokens are available
- Use the `sx` prop for component styling

### Accessibility

- Always include ARIA labels for interactive elements
- Use semantic HTML elements
- Ensure proper color contrast ratios
- Test keyboard navigation

### File Organization

- Keep files focused and under 300 lines when possible
- Use the single responsibility principle
- Separate concerns into logical components
- Create dedicated directories for related components

## Enforcement

- ESLint will catch old Grid API usage automatically
- Run `npm run lint` before committing
- Build will fail if standards are violated
- TypeScript strict mode is enabled

## Resources

- [MUI Grid Documentation](https://mui.com/material-ui/react-grid/)
- [MUI Card Documentation](https://mui.com/material-ui/react-card/)
- [MUI Accessibility Guide](https://mui.com/material-ui/guides/accessibility/)
