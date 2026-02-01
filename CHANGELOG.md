## 1.0.0 (2026-02-01)

### Features

* Add Analyze Report and Action Plan pages, and update the Gemini Streaming Demo component. ([d751f61](https://github.com/ericthayer/univia/commit/d751f61f1b8a88d35f7991b0d173a5a3dc9d7a4d))
* add authentication callback page and integrate error handling into sign-in flow. ([18a02c5](https://github.com/ericthayer/univia/commit/18a02c5322e523cf02c3e0ab20f37049d99be7c3))
* Add home and space_dashboard icons and update the dashboard navigation item to use the new home icon. ([c8bed6f](https://github.com/ericthayer/univia/commit/c8bed6f3d23d38ef8395bf43a99c15287caa223d))
* Enhance authentication callback to include session retry logic and improved error handling with specific redirects. ([a8bd38a](https://github.com/ericthayer/univia/commit/a8bd38a805fa6321da9187bda11fe216d23c625b))
* Improve Supabase OAuth flow by requesting offline access and consent, and enhancing error handling in the authentication callback. ([1f8984c](https://github.com/ericthayer/univia/commit/1f8984c2bbd4704c2f119f01a665f7cf5f0d4150))
* Introduce Gemini API integration with a streaming demo page, `useGemini` hook, and a new `AuditSummaryCard` component. ([bd32689](https://github.com/ericthayer/univia/commit/bd326897d95c8956e19ba951929a176d7e559e08))
* Replace auth modal with dedicated sign-up, sign-in, and password recovery pages. ([270e19a](https://github.com/ericthayer/univia/commit/270e19a9699b74efcbb6b313d5a03b883c6875e6))
* Update user tier configurations with new pricing and features, rename `TIER_CONFIG` to `USER_TIERS`, and add `tiny` and `xxl` Material-UI breakpoint overrides. ([af06c48](https://github.com/ericthayer/univia/commit/af06c48fcd5a57d5f3a5aa8bf12b792fb0b7150b))

### Bug Fixes

* Adjust UserMenu dropdown horizontal and vertical positioning. ([00df506](https://github.com/ericthayer/univia/commit/00df5061666257c9f0e080a01939039a88dd39f6))
* Adjust z-index values for DocumentUploadDrawer and Header components to ensure correct layering and remove unused imports from DocumentUploadDrawer. ([02d735c](https://github.com/ericthayer/univia/commit/02d735c31dd1f6976766d71a240a40d1f94a0fd6))
* update GitHub svg icon path ([60f587a](https://github.com/ericthayer/univia/commit/60f587acd59db76acf247d96f33a70911d98263a))
* update mobile navigation backdrop from blocking content ([6b25521](https://github.com/ericthayer/univia/commit/6b255214abd9463f3247e11f9db5920c35c27430))

### Performance Improvements

* add agents-config ([c3b96e2](https://github.com/ericthayer/univia/commit/c3b96e26c768cf815853185ee0a28f58a0f50c48))
* add agents-config ([#10](https://github.com/ericthayer/univia/issues/10)) ([c04123a](https://github.com/ericthayer/univia/commit/c04123a9c322488179017bd541d9957d08217085))
* update scaffolding skill ([182d439](https://github.com/ericthayer/univia/commit/182d439ba9566c23c5c06a6f16285e0ad43611e8))

### Documentation

* add gemini integration demos ([57f781b](https://github.com/ericthayer/univia/commit/57f781b6ff8c4d84dec7c01a9ec1f1021c984646))
* update guides and copilot instructions ([1d5fe47](https://github.com/ericthayer/univia/commit/1d5fe47a69582cb748163cd923357440817bef1c))

### Code Refactoring

* Streamline Vite build configuration, simplify `USER_TIERS` export, and remove `sideEffects` from package.json. ([bcf9a08](https://github.com/ericthayer/univia/commit/bcf9a0875118de6359bfbf00367922b75cebe382))
