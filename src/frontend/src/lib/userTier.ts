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

export function getAllTiers(): Array<{ value: UserTier; label: string }> {
  return [
    { value: UserTier.basic, label: 'Basic' },
    { value: UserTier.silver, label: 'Silver' },
    { value: UserTier.gold, label: 'Gold' },
    { value: UserTier.diamond, label: 'Diamond' },
  ];
}
