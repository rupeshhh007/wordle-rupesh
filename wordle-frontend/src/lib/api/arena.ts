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

export async function getActiveMatch(): Promise<ArenaMatchResponse | null> {
  try {
    const res = await get<ArenaMatchResponse | undefined>("/api/arena/active");
    return res ?? null;
  } catch {
    return null;
  }
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

export function forfeitMatch(matchId: number): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/${matchId}/forfeit`);
}
