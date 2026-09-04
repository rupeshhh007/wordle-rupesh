import { get, post } from "./client";
import type {
  StartGameRequest,
  GameResponse,
  GameDetailsResponse,
  GuessRequest,
  GuessResponse,
} from "@/types/api";

export function startGame(data: StartGameRequest): Promise<GameResponse> {
  return post<GameResponse>("/api/games", data);
}

export function submitGuess(
  gameId: number,
  data: GuessRequest
): Promise<GuessResponse> {
  return post<GuessResponse>(`/api/games/${gameId}/guesses`, data);
}

export function getGame(gameId: number): Promise<GameDetailsResponse> {
  return get<GameDetailsResponse>(`/api/games/${gameId}`);
}

export function getUserGames(): Promise<GameResponse[]> {
  return get<GameResponse[]>("/api/games");
}

export function abandonGame(gameId: number): Promise<GameResponse> {
  return post<GameResponse>(`/api/games/${gameId}/abandon`);
}
