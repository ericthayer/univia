---
trigger: always_on
description: Web performance and Core Web Vitals optimization guidelines.
---

**OBJECTIVE:**
Ensuring fast load times, smooth interactions, and stable layouts for both 3D and standard web content.

**REASON:**
Large bundles, data tables, charts, and uploaded documents can degrade performance, leading to poor Core Web Vitals scores and high bounce rates, especially on mobile devices.

**DESCRIPTION:**
Rules for asset budgeting, layout stability, resource prioritization, and responsive React rendering.

**INSTRUCTIONS:**

### Core Web Vitals
- **Prevent Layout Shifts (CLS)**: Always set explicit `width` and `height` dimensions (or aspect ratio) on the canvas container to reserve space before the scene initializes.
- **Optimize LCP**: Identify the largest above-fold element (often a hero texture or font), and utilize the CSS property, [content visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility) to help with more performant rendering. Use `<link rel="preload">` for these critical assets and **Inline Critical CSS** in the HTML `<head>` for a near-instant first paint.

### Asset Budgeting
- **Asset Optimization**: Prefer appropriately sized, compressed images and avoid shipping non-critical assets in the initial bundle.
- **Lazy Loading**: Use dynamic imports with `React.lazy()` for non-critical routes and feature-heavy components.

### Rendering Performance
- **Font Display**: Use `font-display: swap` for all web fonts to ensure text is visible while the custom font (and 3D scene) loads.
- **Avoid Long Tasks**: Ensure heavy computations and large renders do not block the main thread for more than 50ms. Prefer pagination, virtualization, memoization, or chunking where appropriate.
- **Asset Caching**: Leverage service workers or strong Cache-Control headers for 3D assets that don't change frequently.