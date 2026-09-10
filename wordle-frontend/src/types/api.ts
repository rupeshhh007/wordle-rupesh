// ============ ENUMS ============

export type GameType = "DAILY" | "PRACTICE" | "ARENA";

export type GameStatus = "IN_PROGRESS" | "WON" | "LOST" | "ABANDONED" | "DRAW";

export type LetterResult = "CORRECT" | "PRESENT" | "ABSENT";

export type ArenaMatchStatus =
  | "WAITING"
  | "IN_PROGRESS"
  | "PLAYER1_WON"
  | "PLAYER2_WON"
  | "DRAW"
  | "CANCELLED";

export type ArenaWinner = "PLAYER1" | "PLAYER2" | "DRAW";

// ============ AUTH ============

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  rating: number;
}

export interface PublicUserProfileResponse {
  id: number;
  username: string;
  rating: number;
  rank: number;
}

// ============ GAME ============

export interface StartGameRequest {
  gameType: GameType;
}

export interface GameResponse {
  id: number;
  gameType: GameType;
  status: GameStatus;
  attemptCount: number;
  startedAt: string;
  opponentUsername?: string;
  word?: string;
}

export interface GameDetailsResponse {
  id: number;
  gameType: GameType;
  status: GameStatus;
  attemptCount: number;
  startedAt: string;
  completedAt: string | null;
  guesses: GuessResponse[];
  word?: string;
}

export interface GuessRequest {
  guess: string;
}

export interface GuessResponse {
  guess: string;
  result: LetterResult[];
  attemptNumber: number;
  gameStatus: GameStatus;
  word?: string;
}

// ============ DAILY ============

export interface DailyGuessRequest {
  guess: string;
}

// ============ ARENA ============

export interface ArenaGuessRequest {
  guess: string;
}

export interface ArenaMatchResponse {
  id: number;
  player1: string;
  player2: string | null;
  status: ArenaMatchStatus;
  winner: ArenaWinner | null;
  player1Attempts: number;
  player2Attempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  isPrivate?: boolean;
  private?: boolean;
  inviteCode?: string;
  rematchRequestedByPlayer1?: boolean;
  rematchRequestedByPlayer2?: boolean;
  nextMatchId?: number | null;
  lobbyClosed?: boolean;
  playerLeft?: string;
  word?: string;
}

export interface ArenaMatchDetailsResponse {
  id: number;
  player1: string;
  player2: string | null;
  status: ArenaMatchStatus;
  winner: ArenaWinner | null;
  player1Attempts: number;
  player2Attempts: number;
  player1Guesses: ArenaGuessHistoryResponse[];
  player2Guesses: ArenaGuessHistoryResponse[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  isPrivate?: boolean;
  private?: boolean;
  inviteCode?: string;
  rematchRequestedByPlayer1?: boolean;
  rematchRequestedByPlayer2?: boolean;
  nextMatchId?: number | null;
  lobbyClosed?: boolean;
  playerLeft?: string;
  word?: string;
}

export interface ArenaGuessResponse {
  guess: string;
  result: LetterResult[];
  attemptNumber: number;
  matchStatus: ArenaMatchStatus;
  word?: string;
}

export interface ArenaGuessHistoryResponse {
  guess: string;
  result: LetterResult[];
  attemptNumber: number;
}

// ============ STATS ============

export interface StatsResponse {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  guessDistribution: Record<number, number>;
}

// ============ LEADERBOARD ============

export interface LeaderboardEntryResponse {
  rank: number;
  userId: number;
  username: string;
  rating: number;
}

export interface MyLeaderboardResponse {
  rank: number;
  userId: number;
  username: string;
  rating: number;
}

// ============ ERROR ============

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ============ BOARD RENDERING (normalized, API-agnostic) ============

/** Normalized type for rendering a single board row.
 *  Both GuessResponse and ArenaGuessHistoryResponse map to this. */
export interface BoardGuess {
  word: string;
  result: LetterResult[];
}

/** Helper to convert GuessResponse to BoardGuess */
export function toBoardGuess(g: GuessResponse): BoardGuess {
  return { word: g.guess, result: g.result };
}

/** Helper to convert ArenaGuessHistoryResponse to BoardGuess */
export function arenaToBoardGuess(g: ArenaGuessHistoryResponse): BoardGuess {
  return { word: g.guess, result: g.result };
}

// ============ WEBSOCKET EVENTS ============

export type MatchEventType =
  | "MATCH_STARTED"
  | "GUESS_SUBMITTED"
  | "MATCH_COMPLETED"
  | "MATCH_FORFEITED"
  | "MATCH_CANCELLED"
  | "REMATCH_REQUESTED"
  | "REMATCH_ACCEPTED"
  | "REMATCH_CANCELLED"
  | "PLAYER_LEFT_LOBBY";

export interface MatchEventDto {
  eventType: MatchEventType;
  matchId: number;
  match?: ArenaMatchResponse;
  player?: string;
  playerAttempts?: number;
  lastGuessEvaluation?: LetterResult[];
  message?: string;
  timestamp?: number;
}

export type ChallengeEventType =
  | "CHALLENGE_RECEIVED"
  | "CHALLENGE_ACCEPTED"
  | "CHALLENGE_DECLINED"
  | "CHALLENGE_CANCELLED";

export interface ChallengeEventDto {
  type: ChallengeEventType;
  challenger: string;
  challengerRating?: number;
  targetUser: string;
  matchId: number;
  inviteCode: string;
  message?: string;
  timestamp?: number;
}

export interface PresenceEventDto {
  username: string;
  status: "ONLINE" | "OFFLINE";
  timestamp: number;
}


