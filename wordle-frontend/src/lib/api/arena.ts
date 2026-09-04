import { get, post } from "./client";
import type {
  ArenaMatchResponse,
  ArenaMatchDetailsResponse,
  ArenaGuessRequest,
  ArenaGuessResponse,
} from "@/types/api";

export function findMatch(): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>("/api/arena/match");
}

export function getMatch(matchId: number): Promise<ArenaMatchResponse> {
  return get<ArenaMatchResponse>(`/api/arena/${matchId}`);
}

export function getMatchDetails(
  matchId: number
): Promise<ArenaMatchDetailsResponse> {
  return get<ArenaMatchDetailsResponse>(`/api/arena/${matchId}/details`);
}

export function submitArenaGuess(
  matchId: number,
  data: ArenaGuessRequest
): Promise<ArenaGuessResponse> {
  return post<ArenaGuessResponse>(`/api/arena/${matchId}/guesses`, data);
}

export function cancelMatch(matchId: number): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/${matchId}/cancel`);
}
