// Local type definitions for types that should be exported from backend but aren't yet
// These mirror the backend types defined in backend/main.mo

import type { Principal } from '@icp-sdk/core/principal';

// Re-export the types that ARE available from backend
export type { List, UserProfile, UserRole, ListId, UserTier } from '@/backend';

// Define types that are NOT exported from backend but are used in the app
export type TaskId = bigint;
export type RoutineId = bigint;
export type SpendId = bigint;

export enum RoutineSection {
  top = 'top',
  bottom = 'bottom'
}

export enum SpendType {
  normal = 'normal',
  preDeducted = 'preDeducted'
}

export interface Task {
  id: TaskId;
  title: string;
  description: string;
  completed: boolean;
  urgent: boolean;
  important: boolean;
  isLongTask: boolean;
  weight: number;
  listId: bigint;
  order: bigint;
}

export interface MorningRoutine {
  id: RoutineId;
  text: string;
  completed: boolean;
  section: RoutineSection;
  order: bigint;
  streakCount: bigint;
  weight: bigint;
  displayMode: bigint;
}

export interface MonetarySettings {
  maxMoneyPerDay: bigint;
  maxMorningRoutine: bigint;
  maxDailyPriorities: bigint;
  maxEveningRoutine: bigint;
  totalBalance: bigint;
}

export interface PayrollRecord {
  date: bigint;
  total: bigint;
  submitted: boolean;
  details: {
    morning: bigint;
    priorities: bigint;
    evening: bigint;
  };
}

export interface SpendRecord {
  id: SpendId;
  date: bigint;
  amount: number;
  category: string;
  spendType: SpendType;
}

export interface SpendPreset {
  id: bigint;
  name: string;
  amount: number;
  category: string;
}

export interface TaskCreateInput {
  title: string;
  description: string;
  urgent: boolean;
  important: boolean;
  isLongTask: boolean;
  listId: bigint;
  order: bigint;
}

export interface TaskUpdateInput {
  title: string;
  description: string;
  completed: boolean;
  urgent: boolean;
  important: boolean;
  isLongTask: boolean;
  listId: bigint;
  order: bigint;
}

export interface SpendInput {
  amount: number;
  category: string;
  spendType: SpendType;
}

// Import UserTier from backend for use in UserMetadata
import type { UserTier } from '@/backend';

export interface UserMetadata {
  principal: Principal;
  profile?: {
    name?: string;
    tier?: UserTier;
    earningsEnabled?: boolean;
  };
  isAdmin: boolean;
}
