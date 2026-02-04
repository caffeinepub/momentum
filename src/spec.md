# Specification

## Summary
**Goal:** Seed a one-time set of onboarding routine instruction items into new users’ Morning and Evening routines at first registration.

**Planned changes:**
- Update the backend new-user provisioning flow to create 3 normal routine items in Morning Routine (section=#top) and 3 normal routine items in Evening Routine (section=#bottom) only when a principal is first seen.
- Seed the exact specified English instruction texts into the created routine items (including the playful line: “Swipe + up... it's shy”).
- Assign deterministic increasing `order` values within each section so seeded items render in the intended stable sequence.
- Ensure seeded items are never auto-recreated on later logins if the user deletes them, and do not affect existing users or the existing one-time Week/Month list creation behavior.

**User-visible outcome:** On first registration, users immediately see 3 Morning and 3 Evening onboarding routine items in the correct order; they can complete, edit, or delete them, and deleted items will not come back on future logins.
