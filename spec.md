# Specification

## Summary
**Goal:** Fix the Skipped Day Reset feature so that it correctly unchecks all routine checkboxes and resets the streak counter to 0, both in the backend and the frontend UI.

**Planned changes:**
- Fix backend Skipped Day Reset logic to set all morning and evening routine checkbox states to unchecked (false) and reset the streak counter to 0.
- Fix the frontend Start New Day dialog handler so that after the skipped day reset mutation completes, the React Query caches for routines and streak data are invalidated/updated, causing the UI to reflect all checkboxes as unchecked and the streak count as 0.

**User-visible outcome:** When a user triggers a Skipped Day Reset, all routine checkboxes immediately appear unchecked and the streak count displays 0, both immediately in the UI and after subsequent page reloads.
