import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface List {
    id: ListId;
    name: string;
    important: boolean;
    urgent: boolean;
    quadrant: boolean;
}
export interface UserProfile {
    earningsEnabled: boolean;
    name: string;
    tier: UserTier;
}
export type ListId = bigint;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllUserLists(): Promise<Array<List> | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    maybeInitializeAllQuadrants(): Promise<Array<List> | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
