import { useState, useEffect } from 'react';

const LEGACY_STORAGE_KEY = 'planModeTipShown';

function getUserStorageKey(principalId: string | null): string | null {
  if (!principalId) return null;
  return `planModeTipShown_${principalId}`;
}

export function usePlanModeTip(principalId: string | null = null) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const userKey = getUserStorageKey(principalId);
    
    // If no principal (not logged in), don't show the tip
    if (!userKey) {
      setShouldShow(false);
      setIsChecking(false);
      return;
    }

    try {
      // Check if user-specific key exists
      const userShown = localStorage.getItem(userKey);
      
      if (userShown !== null) {
        // User-specific key exists, use it
        setShouldShow(userShown !== 'true');
      } else {
        // User-specific key doesn't exist, check legacy key for migration
        const legacyShown = localStorage.getItem(LEGACY_STORAGE_KEY);
        
        if (legacyShown === 'true') {
          // Migrate: mark as shown for this user and clear legacy key
          localStorage.setItem(userKey, 'true');
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          setShouldShow(false);
        } else {
          // No legacy data, show the tip for this new user
          setShouldShow(true);
        }
      }
    } catch (error) {
      console.warn('Failed to read planModeTipShown from localStorage:', error);
      setShouldShow(false);
    } finally {
      setIsChecking(false);
    }
  }, [principalId]);

  const markAsShown = () => {
    const userKey = getUserStorageKey(principalId);
    if (!userKey) return;

    try {
      localStorage.setItem(userKey, 'true');
      setShouldShow(false);
    } catch (error) {
      console.warn('Failed to write planModeTipShown to localStorage:', error);
    }
  };

  return {
    shouldShow,
    isChecking,
    markAsShown,
  };
}
