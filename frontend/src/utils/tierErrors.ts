/**
 * Normalizes backend tier-limit error messages into user-friendly strings.
 */
export function normalizeError(err: unknown): string {
  if (!err) return 'An unexpected error occurred.';

  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : JSON.stringify(err);

  // Tier limit errors
  if (message.includes('maximum number of routines')) {
    return 'Routine limit reached for your tier. Upgrade to add more routines.';
  }
  if (message.includes('maximum number of custom lists')) {
    return 'Custom list limit reached for your tier. Upgrade to add more lists.';
  }
  if (message.includes('maximum number of tasks')) {
    return 'Task limit reached for your tier. Upgrade to add more tasks.';
  }

  // Generic backend trap messages — strip Motoko prefix if present
  const trapMatch = message.match(/Canister.*?trapped.*?:\s*(.+)/i);
  if (trapMatch) return trapMatch[1];

  return message || 'An unexpected error occurred.';
}
