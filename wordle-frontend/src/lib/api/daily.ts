import { get, post } from "./client";
import type {
  GameResponse,
  GameDetailsResponse,
  DailyGuessRequest,
  GuessResponse,
} from "@/types/api";

export function getDailyGame(): Promise<GameResponse> {
  return get<GameResponse>("/api/daily");
}

export function submitDailyGuess(
  data: DailyGuessRequest
): Promise<GuessResponse> {
  return post<GuessResponse>("/api/daily/guesses", data);
}

export function getDailyResult(): Promise<GameDetailsResponse> {
  return get<GameDetailsResponse>("/api/daily/result");
}
