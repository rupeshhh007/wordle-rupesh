import { get } from "./client";
import type { UserResponse } from "@/types/api";

export function getMe(): Promise<UserResponse> {
  return get<UserResponse>("/api/users/me");
}
