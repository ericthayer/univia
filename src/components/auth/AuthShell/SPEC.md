# AuthShell

**Intent:** One presentation layer for the auth screens (sign in, sign up, forgot and reset password) so they share the refreshed language: pill inputs, pill provider buttons, hairline dividers, `ArrowButton` primary action, tokens that follow light and dark. Visual only; every handler, redirect, and Supabase call stays in the pages.

**Pieces**

| Export | Use |
|---|---|
| `AuthSplitLayout` | Sign in / sign up. Quiet brand panel at ≥ md (surface tokens, glow, three value lines), form only below md. Form column owns the page `h1`. |
| `AuthCenterLayout` | Forgot / reset. Centered `BezelCard` (max 440px) on the glow canvas. |
| `AuthField`, `PasswordField` | Pill input with a static label above (`htmlFor`), 48px tall. Password toggle is a 40px button with `aria-label="Show password"` and `aria-pressed`. |
| `OAuthButton` | 48px pill outlined provider button. |
| `AuthAlert`, `AuthDivider`, `AuthLogo`, `authLinkSx` | Status message (`role="alert"` for errors), "or" separator, wordmark link, quiet underlined link style. |

**Content rule:** the brand panel states product facts only. No invented people, companies, or customer counts.

**Accessibility:** labels are real `<label for>`; required marker is `aria-hidden` (the input carries `required`); alerts announce; visibility icon is decorative inside a labeled button; touch targets ≥ 40px (inputs and buttons 48px).

**Performance:** no images beyond the wordmark; the glow is a static gradient; only border-color, background-color, and transform animate.

**Changelog**
- 2026-10-29 — Created. Replaces the hardcoded light brand panel, the invented testimonial, and the chevron-icon password toggle.
