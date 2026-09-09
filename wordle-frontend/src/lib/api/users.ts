import { get } from "./client";
import type { UserResponse, PublicUserProfileResponse, StatsResponse } from "@/types/api";

export function getMe(): Promise<UserResponse> {
  return get<UserResponse>("/api/users/me");
}

export function getPublicProfile(username: string): Promise<PublicUserProfileResponse> {
  return get<PublicUserProfileResponse>(`/api/users/${encodeURIComponent(username)}`);
}

export function getUserStats(username: string): Promise<StatsResponse> {
  return get<StatsResponse>(`/api/users/${encodeURIComponent(username)}/stats`);
}
