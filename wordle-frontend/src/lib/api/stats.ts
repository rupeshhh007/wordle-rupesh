import { get } from "./client";
import type { StatsResponse } from "@/types/api";

export function getStats(): Promise<StatsResponse> {
  return get<StatsResponse>("/api/users/me/stats");
}
