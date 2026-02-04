import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserMetadata {
    principal: Principal;
    isAdmin: boolean;
    profile?: UserProfile;
}
export interface TaskUpdateInput {
    title: string;
    isLongTask: boolean;
    order: bigint;
    completed: boolean;
    description: string;
    important: boolean;
    urgent: boolean;
    listId: ListId;
}
export interface Task {
    id: TaskId;
    weight: number;
    title: string;
    isLongTask: boolean;
    order: bigint;
    completed: boolean;
    description: string;
    important: boolean;
    urgent: boolean;
    listId: ListId;
}
export interface SpendPreset {
    id: bigint;
    name: string;
    category: string;
    amount: number;
}
export interface SpendInput {
    category: string;
    amount: number;
    spendType: SpendType;
}
export interface PayrollRecord {
    total: bigint;
    submitted: boolean;
    date: bigint;
    details: {
        morning: bigint;
        evening: bigint;
        priorities: bigint;
    };
}
export interface MorningRoutine {
    id: RoutineId;
    weight: bigint;
    order: bigint;
    text: string;
    completed: boolean;
    section: RoutineSection;
    streakCount: bigint;
}
export interface TaskCreateInput {
    title: string;
    isLongTask: boolean;
    order: bigint;
    description: string;
    important: boolean;
    urgent: boolean;
    listId: ListId;
}
export interface SpendRecord {
    id: SpendId;
    date: bigint;
    category: string;
    amount: number;
    spendType: SpendType;
}
export type TaskId = bigint;
export type ListId = bigint;
export interface List {
    id: ListId;
    name: string;
    important: boolean;
    urgent: boolean;
    quadrant: boolean;
}
export type RoutineId = bigint;
export type SpendId = bigint;
export interface MonetarySettings {
    maxDailyPriorities: bigint;
    maxMorningRoutine: bigint;
    maxMoneyPerDay: bigint;
    totalBalance: bigint;
    maxEveningRoutine: bigint;
}
export interface UserProfile {
    earningsEnabled: boolean;
    name: string;
    tier: UserTier;
    email?: string;
}
export enum RoutineSection {
    top = "top",
    bottom = "bottom"
}
export enum SpendType {
    normal = "normal",
    preDeducted = "preDeducted"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum UserTier {
    gold = "gold",
    diamond = "diamond",
    basic = "basic",
    silver = "silver"
}
export interface backendInterface {
    addPayroll(dailyIncome: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeMorningRoutine(id: RoutineId, completed: boolean): Promise<void>;
    completeTask(id: TaskId, completed: boolean): Promise<void>;
    createList(name: string): Promise<ListId>;
    createMorningRoutine(text: string, section: RoutineSection): Promise<RoutineId>;
    createPreset(preset: SpendPreset): Promise<bigint>;
    createSpend(input: SpendInput): Promise<string>;
    createTask(input: TaskCreateInput): Promise<TaskId>;
    deleteList(id: ListId): Promise<void>;
    deleteMorningRoutine(id: RoutineId): Promise<void>;
    deletePreset(id: bigint): Promise<void>;
    deleteSpend(spendId: SpendId): Promise<void>;
    deleteTask(id: TaskId): Promise<void>;
    editPayrollLog(date: bigint, updatedTotal: bigint): Promise<void>;
    ensureAllQuadrants(): Promise<void>;
    getAllLists(): Promise<Array<List>>;
    getAllMorningRoutines(): Promise<Array<MorningRoutine>>;
    getAllSpendPresets(): Promise<Array<SpendPreset>>;
    getAllSpends(): Promise<Array<SpendRecord>>;
    getAllTasks(): Promise<Array<Task>>;
    getAllTasksByList(listId: ListId): Promise<Array<Task>>;
    getAllUserMetadata(): Promise<Array<[Principal, UserProfile]>>;
    getAllUserMetadataWithRoles(): Promise<Array<UserMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDefaultOrder(): Promise<bigint>;
    getDefaultPosition(): Promise<bigint>;
    getEarningsEnabled(): Promise<boolean>;
    getList(id: ListId): Promise<List>;
    getMonetarySettings(): Promise<MonetarySettings>;
    getMorningRoutine(id: RoutineId): Promise<MorningRoutine>;
    getMorningRoutinesBySection(section: RoutineSection): Promise<Array<MorningRoutine>>;
    getPayrollHistory(): Promise<Array<PayrollRecord>>;
    getPreset(id: bigint): Promise<SpendPreset | null>;
    getTask(id: TaskId): Promise<Task>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    moveTask(taskId: TaskId, destinationListId: ListId): Promise<void>;
    performRoutineDailyResetIfNeeded(): Promise<void>;
    promoteToAdmin(target: Principal): Promise<void>;
    removeAdmin(target: Principal): Promise<void>;
    reorderTask(taskId: TaskId, newPosition: bigint): Promise<void>;
    resetNewDay(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveMonetarySettings(settings: MonetarySettings): Promise<void>;
    setUserTier(targetUser: Principal, newTier: UserTier): Promise<void>;
    submitPayrollLog(date: bigint): Promise<bigint>;
    toggleEarningsSystem(enabled: boolean): Promise<boolean>;
    updateMorningRoutine(id: RoutineId, text: string, section: RoutineSection): Promise<void>;
    updatePreset(id: bigint, updatedPreset: SpendPreset): Promise<void>;
    updateRoutineItemPosition(routineId: RoutineId, positionIndex: bigint): Promise<void>;
    updateTask(id: TaskId, updatedTask: TaskUpdateInput): Promise<void>;
    updateTaskPosition(taskId: TaskId, positionIndex: bigint): Promise<void>;
}
