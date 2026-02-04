# Specification

## Summary
**Goal:** Persist the Plan Mode onboarding tip dismissal per authenticated user (Internet Identity principal) instead of per browser/device, while keeping existing users’ dismissed state via a client-side migration.

**Planned changes:**
- Change Plan Mode tip persistence to use a per-user localStorage key derived from the logged-in user’s Internet Identity principal.
- Add a client-side migration/fallback: if the old shared localStorage key indicates the tip was dismissed, record dismissal under the current user’s new per-user key (without affecting other users on the same device).
- Keep the Plan Mode tip dialog content unchanged (including the exact text: "The Real Magic Is in Settings.").

**User-visible outcome:** Each user will see the Plan Mode tip independently on shared devices; dismissing it will only hide it for that specific account, and previously dismissed tips stay dismissed after upgrading.
