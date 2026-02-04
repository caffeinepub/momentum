# Specification

## Summary
**Goal:** Add the uploaded Momentum logo as a frontend static asset and display it in the global header and login/unauthenticated screen.

**Planned changes:**
- Store `Momentum.png` under `frontend/public` (e.g., `frontend/public/assets/`) so it is served at a stable URL without any backend fetch.
- Update `frontend/src/components/Header.tsx` to render the Momentum logo from the new static asset path with non-distorting sizing (e.g., object-fit) so it looks correct across screen sizes.
- Update `frontend/src/components/UnauthenticatedScreen.tsx` to show the Momentum logo above the login button, centered and displayed large/high-quality without overflow on mobile/desktop.

**User-visible outcome:** Users see Momentum branding in the app header on authenticated pages and a large, centered Momentum logo on the login page without distortion.
