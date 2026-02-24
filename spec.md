# Specification

## Summary
**Goal:** Add safe-area-aware top padding to the Momentum PWA so that header and top UI elements are not clipped by the device's notch or status bar when running in fullscreen/standalone mode on iOS and Android.

**Planned changes:**
- Add `viewport-fit=cover` to the viewport meta tag in `index.html` if not already present
- Apply `padding-top: env(safe-area-inset-top)` to the top-level layout wrapper in the TaskManager and/or Header component using existing safe-area CSS utilities or a new utility class
- Ensure the padding resolves to 0 on desktop/non-fullscreen views (dynamic via `env()`)

**User-visible outcome:** When launching the Momentum PWA in fullscreen or standalone mode on a phone, the header and top navigation elements will no longer be hidden behind the notch or status bar.
