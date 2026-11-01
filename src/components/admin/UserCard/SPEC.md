# UserCard

**Intent:** One account in the User Management cards view (docs/specs/ui-refresh/SPEC.md §4.4). Replaces the inline `Card` markup that lived in the page.

**Usage**

```tsx
<UserCard user={user} tierColor={getTierColor(user.tier)} statusColor={getStatusColor(user.status)} reveal={index} />
```

**Architecture:** Presentational `BezelCard interactive` rendered as an `<article>`; the page owns data, filters, and chip color mappings.

**Accessibility:** Name is an `h3` under the directory section heading; the article is labelled by the user's name. Dates render in a `<time>` element. Numerals are tabular.

**Changelog**
- 2026-10-29 — Created.
