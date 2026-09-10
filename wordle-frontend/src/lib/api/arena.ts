import { get, post } from "./client";
import type {
  ArenaMatchResponse,
  ArenaMatchDetailsResponse,
  ArenaGuessRequest,
  ArenaGuessResponse,
  ChallengeEventDto,
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

export function getLiveMatches(): Promise<ArenaMatchResponse[]> {
  return get<ArenaMatchResponse[]>("/api/arena/live");
}

export function createPrivateMatch(): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>("/api/arena/private");
}

export function joinPrivateMatch(inviteCode: string): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>("/api/arena/join-private", { inviteCode });
}

export function requestRematch(matchId: number): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/${matchId}/rematch`);
}

export function cancelRematch(matchId: number): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/${matchId}/rematch/cancel`);
}

export function leaveLobby(matchId: number): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/${matchId}/leave`);
}

export function challengeUser(targetUsername: string): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/challenge/${targetUsername}`);
}

export function respondToChallenge(
  matchId: number,
  accept: boolean
): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/challenge/${matchId}/respond`, {
    accept,
  });
}

export function getPendingChallenges(): Promise<ChallengeEventDto[]> {
  return get<ChallengeEventDto[]>("/api/arena/challenge/pending");
}

export function timeoutMatch(matchId: number): Promise<ArenaMatchResponse> {
  return post<ArenaMatchResponse>(`/api/arena/${matchId}/timeout`);
}


