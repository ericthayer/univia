# SectionHeader

**Intent:** Title row for a page section or a card: title, optional meta (count), optional trailing action.

**Usage**

```tsx
<SectionHeader title="Recent Audits" meta="22" action={<Button href="/audit">View all</Button>} component="h3" dense />
```

**Accessibility:** Heading level is explicit via `component`. Meta uses tabular numerals.

**Changelog**
- 2026-10-29 — Created.
