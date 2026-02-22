# Specification

## Summary
**Goal:** Replace the header's "Reset New Day" button with a centered "Start New Day" button that opens a popup containing two reset options: "Next Day Reset" (original functionality) and "Skipped Day Reset" (unchecks all routines and resets all streaks to 0).

**Planned changes:**
- Remove the "Reset New Day" button from the Header component
- Add a centered "Start New Day" button in the Header that opens a popup dialog
- Create a popup with two buttons: "Next Day Reset" (original reset) and "Skipped Day Reset"
- Implement backend function to uncheck all routines and reset all streak counts to 0
- Connect the "Skipped Day Reset" button to the new backend function

**User-visible outcome:** Users can click "Start New Day" in the header to open a popup where they choose between a normal next-day reset or a skipped-day reset that also clears all streak progress.
