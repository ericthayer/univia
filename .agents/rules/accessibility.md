---
description: Accessibility standards for Univia's React and MUI interfaces.
---

**OBJECTIVE:**
Build inclusive interfaces for keyboard users, screen reader users, people with low vision, and people with motion sensitivities.

## Semantic structure

- Use native HTML semantics before ARIA: buttons for actions, links for navigation, labels for controls, and lists/tables for grouped data.
- Maintain a logical heading hierarchy with one page-level `h1`.
- Provide a skip link to the main content and meaningful page titles.

## Interaction and focus

- Every interactive element must be keyboard reachable and operable.
- Preserve visible `:focus-visible` states; never remove an outline without a clear replacement.
- Use MUI components and native controls rather than clickable `div` or `span` elements.
- Icon-only buttons require a concise, descriptive `aria-label`.
- Destructive actions require confirmation or an undo window.

## Forms and content

- Associate every input with a visible label or an accurate accessible name.
- Link validation errors with `aria-describedby` and move focus to the first invalid field on submit.
- Announce loading, errors, and asynchronous updates with `role="status"` or `aria-live="polite"`.
- Keep generated or user-provided content readable when it is empty, long, or unexpectedly formatted.

## Media and motion

- Give images meaningful `alt` text, or `alt=""` when decorative, and explicit dimensions to prevent layout shift.
- Respect `prefers-reduced-motion`; avoid flashing or rapid animation.
- Ensure text and interactive states meet the project's contrast requirements without relying on color alone.

## Ready-to-ship checklist

- [ ] Keyboard navigation and visible focus verified.
- [ ] Labels, accessible names, headings, and landmark structure verified.
- [ ] Async states and validation errors announced.
- [ ] Reduced-motion and responsive behavior checked.