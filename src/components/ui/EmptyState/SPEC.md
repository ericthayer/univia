# EmptyState

**Intent:** The single empty-state pattern for lists on the refreshed pages (audit history, metrics, demand letters, user directory, access denied).

**Usage**

```tsx
<EmptyState icon="history" title="No Audit History" description="Run your first audit to start building your history." action={<ArrowButton onClick={…}>Run Audit</ArrowButton>} />
```

**Accessibility:** The icon is decorative (`aria-hidden`). Title is a paragraph so it never breaks the page outline; the enclosing section's heading remains the landmark.

**Changelog**
- 2026-10-29 — Created.
