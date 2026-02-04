import { UserTier } from '@/backend';

export function getUserTierLabel(tier: UserTier | undefined): string {
  if (!tier) return 'Basic';
  
  switch (tier) {
    case UserTier.basic:
      return 'Basic';
    case UserTier.silver:
      return 'Silver';
    case UserTier.gold:
      return 'Gold';
    case UserTier.diamond:
      return 'Diamond';
    default:
      return 'Basic';
  }
}
