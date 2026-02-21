/**
 * TEST-ONLY FEATURE: Date Override for Routine Testing
 * 
 * This hook provides a temporary date adjustment mechanism for testing routine system bugs.
 * It allows developers to simulate different dates to test daily rollover logic, streak calculations,
 * and routine completion state without waiting for actual day boundaries.
 * 
 * REMOVAL PLAN:
 * When this test feature is no longer needed, follow these steps:
 * 1. Delete this file (frontend/src/hooks/useTestDate.ts)
 * 2. Delete frontend/src/components/TestDatePicker.tsx
 * 3. Remove TestDatePicker import and usage from frontend/src/components/Header.tsx
 * 4. Remove test date state management from frontend/src/pages/TaskManager.tsx
 * 5. Remove testDate prop from frontend/src/components/MorningRoutine.tsx
 * 6. Remove testDate parameters from routine hooks in frontend/src/hooks/useQueries.ts
 * 7. Search codebase for "TEST-ONLY" comments to find all related code
 * 8. Delete frontend/docs/test-date-removal-plan.md
 * 
 * SCOPE: This test date override affects ONLY routine-related logic:
 * - Morning/evening routine completion checks
 * - Routine streak calculations
 * - Routine daily rollover logic (resetting checkboxes)
 * 
 * It does NOT affect:
 * - Task completion timestamps
 * - Today Earns calculation
 * - Payroll submission dates
 * - Spend tracking dates
 */

import { useState, useEffect } from 'react';

const TEST_DATE_STORAGE_KEY = 'test-date-override';

export function useTestDate() {
  const [testDate, setTestDateState] = useState<Date | null>(() => {
    // Initialize from sessionStorage on mount
    const stored = sessionStorage.getItem(TEST_DATE_STORAGE_KEY);
    if (stored) {
      try {
        return new Date(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    // Persist to sessionStorage whenever testDate changes
    if (testDate) {
      sessionStorage.setItem(TEST_DATE_STORAGE_KEY, testDate.toISOString());
    } else {
      sessionStorage.removeItem(TEST_DATE_STORAGE_KEY);
    }
  }, [testDate]);

  const setTestDate = (date: Date | null) => {
    setTestDateState(date);
  };

  const clearTestDate = () => {
    setTestDateState(null);
  };

  /**
   * Returns the effective date for routine operations.
   * If a test date is set, returns that date; otherwise returns null (use real system date).
   */
  const getEffectiveDate = (): Date | null => {
    return testDate;
  };

  return {
    testDate,
    setTestDate,
    clearTestDate,
    getEffectiveDate,
  };
}
