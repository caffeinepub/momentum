# Specification

## Summary
**Goal:** Automatically seed two default empty custom lists (“Week” and “Month”) exactly once for every brand-new authenticated user during initial backend user creation.

**Planned changes:**
- Update the backend first-time user creation flow to create two additional normal (non-quadrant) empty custom lists owned by the new user named exactly “Week” and “Month” with quadrant=false, urgent=false, important=false.
- Ensure this seeding runs for all authenticated users (no admin gating) and only on the one-time user creation path.
- Ensure “Week”/“Month” are never auto-recreated for existing users if they are later deleted or renamed (no per-login/per-fetch repair behavior).

**User-visible outcome:** New users will see the usual 4 quadrant lists plus two additional empty lists named “Week” and “Month”; existing users won’t have these lists re-added automatically if they remove or rename them.
