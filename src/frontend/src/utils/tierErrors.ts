export function parseTierError(error: any): string {
  const message = error?.message || String(error);
  
  // Task limit errors
  if (message.includes('maximum number of tasks')) {
    const match = message.match(/\((\d+)\)/);
    const limit = match ? match[1] : 'your tier limit';
    return `You have reached the maximum number of tasks (${limit}) for your tier. Please upgrade to add more tasks.`;
  }
  
  // Routine limit errors
  if (message.includes('maximum number of routines')) {
    const match = message.match(/\((\d+)\)/);
    const limit = match ? match[1] : 'your tier limit';
    return `You have reached the maximum number of routines (${limit}) for your tier. Please upgrade to add more routines.`;
  }
  
  // Custom list limit errors
  if (message.includes('maximum number of custom lists')) {
    const match = message.match(/\((\d+)\)/);
    const limit = match ? match[1] : 'your tier limit';
    return `You have reached the maximum number of custom lists (${limit}) for your tier. Please upgrade to add more lists.`;
  }
  
  // Earnings system restriction
  if (message.includes('earnings system is not available')) {
    return 'The earnings system is not available for your tier. Please upgrade to Silver tier or higher to access earnings features.';
  }
  
  // Generic fallback
  return 'An error occurred. Please try again or contact support if the problem persists.';
}
