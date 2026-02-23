# Specification

## Summary
**Goal:** Add a storage monitoring system with an admin dashboard to track canister resource usage and user data statistics.

**Planned changes:**
- Add backend query functions to calculate and return storage metrics (stable memory, heap memory, user count, routine count, task count, cycle balance)
- Add backend query function to return per-user storage breakdown with Principal ID, routine/task counts, and estimated storage size
- Implement access control on all monitoring functions to restrict access to canister owner only
- Create new AdminDashboard page at /admin route displaying overview cards with key metrics
- Add storage usage visualization showing memory usage as percentage of 4GB limit with progress bar
- Add per-user data breakdown table sorted by storage usage
- Display canister cycle balance with formatted units
- Implement frontend access control for admin dashboard to show unauthorized message for non-admin users
- Add navigation link to admin dashboard in Header component, visible only to admin users

**User-visible outcome:** The app owner can navigate to an admin dashboard to view comprehensive storage and resource monitoring, including total memory usage, user statistics, per-user storage breakdown, and cycle balance, with all data protected by admin-only access control.
