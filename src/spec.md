# Specification

## Summary
**Goal:** Fix fresh-account login/bootstrap so new users can initialize and load exactly four quadrant lists (1–4) after Internet Identity login without any admin secret/token.

**Planned changes:**
- Backend: Add an idempotent per-user quadrant initialization endpoint that ensures exactly 4 quadrant lists (IDs 1–4) for the caller, without admin/RBAC dependencies.
- Backend: Implement/repair the lists read endpoint used during bootstrap to return all caller lists (including quadrants) with required fields (id, name, quadrant, urgent, important) and no traps for fresh users.
- Backend: Remove the fresh-user deadlock where user/quadrant seeding is gated behind RBAC/admin checks; allow normal authenticated users to proceed through profile + data initialization without CAFFEINE_ADMIN_TOKEN.
- Frontend: Make actor/bootstrap initialization resilient when admin-secret initialization fails/missing, continuing with non-admin flows and English user-facing errors.
- Frontend: Ensure quadrant bootstrap exits loading when 4 quadrants are returned; on failure show one actionable English error, stop looping, and allow retry via refresh.

**User-visible outcome:** After Internet Identity login (including on a brand-new account), the app reliably leaves “Initializing workspace…”, renders the Eisenhower Matrix with 4 quadrant columns, and only shows a single English error with refresh-to-retry if initialization fails.
