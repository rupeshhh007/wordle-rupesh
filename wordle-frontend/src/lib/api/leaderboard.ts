import { get } from "./client";
import type {
  LeaderboardEntryResponse,
  MyLeaderboardResponse,
} from "@/types/api";

export function getLeaderboard(): Promise<LeaderboardEntryResponse[]> {
  return get<LeaderboardEntryResponse[]>("/api/leaderboard");
}

export function getMyRank(): Promise<MyLeaderboardResponse> {
  return get<MyLeaderboardResponse>("/api/leaderboard/me");
}
