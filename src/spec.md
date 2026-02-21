# Specification

## Summary
**Goal:** Add a manual daily reset system that allows users to explicitly mark which morning routines they completed and reset for a new day.

**Planned changes:**
- Add a "Reset New Day" button in the app header next to the dark mode toggle
- Make routine checkboxes provide instant visual feedback without saving to backend
- Update strike count badge to show preview (+1) when checked, current count when unchecked
- Implement manual reset workflow: clicking "Reset New Day" saves checked routines (increments strike count by 1), resets unchecked routines to 0, and clears all checkboxes
- Add backend function to handle the daily reset operation with checked routine IDs
- Create React Query mutation hook for the manual reset operation

**User-visible outcome:** Users can check off completed morning routines throughout the day with instant feedback, see a preview of tomorrow's strike count, and manually trigger a "Reset New Day" to save their progress and start fresh.
