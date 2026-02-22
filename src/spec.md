# Specification

## Summary
**Goal:** Fix the strike count update logic for routine reset buttons so that "Next Day Reset" and "Skipped Day Reset" work correctly across all reset operations.

**Planned changes:**
- Fix backend logic in nextDayReset function to increment strike count by 1 for checked routines and reset to 0 for unchecked routines
- Fix backend logic in skippedDayReset function to reset all routine strike counts to 0
- Ensure strike count updates persist correctly across multiple reset operations, not just on first routine creation
- Preserve existing frontend preview behavior where checking shows strike count + 1 and unchecking shows current strike count

**User-visible outcome:** Users can reliably use "Next Day Reset" to progress their routine streaks and "Skipped Day Reset" to acknowledge missed days, with strike counts updating correctly every time the buttons are clicked.
