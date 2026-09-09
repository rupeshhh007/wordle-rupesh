"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getMatch,
  getMatchDetails,
  submitArenaGuess,
  cancelMatch,
  forfeitMatch,
} from "@/lib/api/arena";
import { getMe } from "@/lib/api/users";
import { ApiError, ConcurrentModificationError } from "@/lib/api/client";
import {
  ArenaMatchResponse,
  ArenaMatchDetailsResponse,
  ArenaMatchStatus,
  ArenaGuessHistoryResponse,
  LetterResult,
  arenaToBoardGuess,
} from "@/types/api";
import { GameBoard } from "@/components/game/GameBoard";
import { Keyboard } from "@/components/game/Keyboard";
import { useGameInput } from "@/hooks/useGameInput";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingState } from "@/components/ui/LoadingState";
import { Avatar } from "@/components/ui/Avatar";
import { Flag, Eye, ArrowLeft } from "lucide-react";

/** Max seconds to wait in WAITING state before auto-cancelling. */
const WAITING_TIMEOUT_SECONDS = 180;

function isTerminal(status: ArenaMatchStatus): boolean {
  return ["PLAYER1_WON", "PLAYER2_WON", "DRAW", "CANCELLED"].includes(status);
}

function getMyResult(
  match: ArenaMatchResponse,
  isPlayer1: boolean
): "win" | "loss" | "draw" | null {
  if (match.status === "DRAW") return "draw";
  if (match.status === "PLAYER1_WON") return isPlayer1 ? "win" : "loss";
  if (match.status === "PLAYER2_WON") return isPlayer1 ? "loss" : "win";
  return null;
}

/**
 * Safely parse date from server, ensuring it is parsed as UTC even if
 * the backend omitted the 'Z' timezone indicator (e.g. from LocalDateTime).
 */
function parseUtcDate(dateStr: string | null | undefined): number {
  if (!dateStr) return Date.now();
  const normalized = /[Z+-]/.test(dateStr.slice(10)) ? dateStr : `${dateStr}Z`;
  const parsed = new Date(normalized).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

export default function ArenaMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const router = useRouter();
  const { matchId } = use(params);
  const matchIdNum = parseInt(matchId, 10);

  const user = useAuthStore((s) => s.user);
  const username = user?.username;

  const [match, setMatch] = useState<ArenaMatchResponse | null>(null);
  const [matchDetails, setMatchDetails] =
    useState<ArenaMatchDetailsResponse | null>(null);
  const [myGuesses, setMyGuesses] = useState<ArenaGuessHistoryResponse[]>([]);
  const [opponentGuesses, setOpponentGuesses] = useState<
    ArenaGuessHistoryResponse[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardState, setKeyboardState] = useState<Map<string, LetterResult>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [updatedRating, setUpdatedRating] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isForfeiting, setIsForfeiting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(WAITING_TIMEOUT_SECONDS);

  const mounted = useRef(true);
  const opponentGuessesCountRef = useRef(0);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const waitingTimer = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
    if (waitingTimer.current) {
      clearInterval(waitingTimer.current);
      waitingTimer.current = null;
    }
  }, []);

  const handleCancelMatch = async () => {
    try {
      setIsCancelling(true);
      clearAllTimers();
      await cancelMatch(matchIdNum);
      router.push("/arena");
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || "Failed to cancel match");
        setIsCancelling(false);
      }
    }
  };

  const handleForfeitMatch = async () => {
    if (!match || isForfeiting) return;
    try {
      setIsForfeiting(true);
      clearAllTimers();
      const updatedMatch = await forfeitMatch(matchIdNum);
      if (!mounted.current) return;
      setMatch(updatedMatch);
      const detailsRes = await getMatchDetails(matchIdNum);
      if (!mounted.current) return;
      setMatchDetails(detailsRes);
      const p1 = updatedMatch.player1 === username;
      const oppGs = p1
        ? detailsRes.player2Guesses
        : detailsRes.player1Guesses;
      setOpponentGuesses(oppGs);
      await fetchUpdatedRating();
      setIsForfeiting(false);
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || "Failed to forfeit match");
        setIsForfeiting(false);
      }
    }
  };

  const isPlayer1 = match?.player1 === username;
  const isSpectator = !!match && match.player1 !== username && match.player2 !== username;
  const myAttempts = isPlayer1 ? match?.player1Attempts : match?.player2Attempts;
  const opponentAttempts = isPlayer1
    ? match?.player2Attempts
    : match?.player1Attempts;
  const opponentName = isPlayer1 ? match?.player2 : match?.player1;

  const fetchUpdatedRating = async () => {
    try {
      const me = await getMe();
      if (mounted.current) {
        setUpdatedRating(me.rating);
      }
    } catch {
      // ignore
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [matchRes, detailsRes] = await Promise.all([
        getMatch(matchIdNum),
        getMatchDetails(matchIdNum),
      ]);

      if (!mounted.current) return;

      setMatch(matchRes);
      setMatchDetails(detailsRes);

      const p1 = matchRes.player1 === username;
      const isSpec = matchRes.player1 !== username && matchRes.player2 !== username;

      if (isSpec) {
        setMyGuesses(detailsRes.player1Guesses);
        setOpponentGuesses(detailsRes.player2Guesses);
        opponentGuessesCountRef.current = matchRes.player1Attempts + matchRes.player2Attempts;
      } else {
        const myGs = p1 ? detailsRes.player1Guesses : detailsRes.player2Guesses;
        const oppGs = p1 ? detailsRes.player2Guesses : detailsRes.player1Guesses;

        setMyGuesses(myGs);
        setOpponentGuesses(oppGs);
        opponentGuessesCountRef.current = oppGs.length;

        // Build keyboard state
        const newKbState = new Map<string, LetterResult>();
        myGs.forEach((g) => {
          for (let i = 0; i < g.guess.length; i++) {
            const letter = g.guess[i];
            const result = g.result[i] as LetterResult;
            const existing = newKbState.get(letter);
            if (!existing) {
              newKbState.set(letter, result);
            } else if (existing !== "CORRECT") {
              if (
                result === "CORRECT" ||
                (existing === "ABSENT" && result === "PRESENT")
              ) {
                newKbState.set(letter, result);
              }
            }
          }
        });
        setKeyboardState(newKbState);
      }

      if (isTerminal(matchRes.status)) {
        await fetchUpdatedRating();
      }
      setIsLoading(false);
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || "Failed to load match");
        setIsLoading(false);
      }
    }
  };

  // Mount + load data
  useEffect(() => {
    mounted.current = true;
    loadInitialData();
    return () => {
      mounted.current = false;
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchIdNum, username]);

  // Polling for match state changes
  useEffect(() => {
    if (match?.status === "WAITING" || match?.status === "IN_PROGRESS") {
      if (pollInterval.current) clearInterval(pollInterval.current);

      const intervalMs = match.status === "WAITING" ? 2500 : 3500;

      pollInterval.current = setInterval(async () => {
        try {
          const updatedMatch = await getMatch(matchIdNum);
          if (!mounted.current) return;

          const isSpec = updatedMatch.player1 !== username && updatedMatch.player2 !== username;

          if (isSpec) {
            const totalAttempts = updatedMatch.player1Attempts + updatedMatch.player2Attempts;
            if (
              totalAttempts > opponentGuessesCountRef.current ||
              (match.status === "WAITING" && updatedMatch.status === "IN_PROGRESS") ||
              isTerminal(updatedMatch.status)
            ) {
              opponentGuessesCountRef.current = totalAttempts;
              const detailsRes = await getMatchDetails(matchIdNum);
              if (!mounted.current) return;
              setMatchDetails(detailsRes);
              setMyGuesses(detailsRes.player1Guesses);
              setOpponentGuesses(detailsRes.player2Guesses);
            }
          } else {
            const p1 = updatedMatch.player1 === username;
            const oppAttempts = p1
              ? updatedMatch.player2Attempts
              : updatedMatch.player1Attempts;

            // If opponent submitted a new guess OR match transitioned to IN_PROGRESS
            if (
              oppAttempts > opponentGuessesCountRef.current ||
              (match.status === "WAITING" && updatedMatch.status === "IN_PROGRESS")
            ) {
              opponentGuessesCountRef.current = oppAttempts;
              const detailsRes = await getMatchDetails(matchIdNum);
              if (!mounted.current) return;
              setMatchDetails(detailsRes);
              const oppGs = p1
                ? detailsRes.player2Guesses
                : detailsRes.player1Guesses;
              setOpponentGuesses(oppGs);
            }
          }

          setMatch(updatedMatch);

          if (isTerminal(updatedMatch.status)) {
            clearAllTimers();
            const detailsRes = await getMatchDetails(matchIdNum);
            if (!mounted.current) return;
            setMatchDetails(detailsRes);
            if (isSpec) {
              setMyGuesses(detailsRes.player1Guesses);
              setOpponentGuesses(detailsRes.player2Guesses);
            } else {
              const p1 = updatedMatch.player1 === username;
              const oppGs = p1
                ? detailsRes.player2Guesses
                : detailsRes.player1Guesses;
              setOpponentGuesses(oppGs);
              opponentGuessesCountRef.current = oppGs.length;
              await fetchUpdatedRating();
            }
          }
        } catch {
          // Ignore polling errors
        }
      }, intervalMs);
    }

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.status, matchIdNum, username]);

  // WAITING timeout countdown (only for actual participants)
  useEffect(() => {
    if (match?.status === "WAITING" && !isSpectator) {
      const createdAtMs = parseUtcDate(match.createdAt);
      const now = Date.now();
      const elapsedSec = Math.max(0, Math.floor((now - createdAtMs) / 1000));

      // Calculate initial remaining seconds; keep at least 30s so user is never instantly ejected
      const initialRemaining = Math.max(30, WAITING_TIMEOUT_SECONDS - elapsedSec);
      setRemainingSeconds(initialRemaining);

      waitingTimer.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (waitingTimer.current) clearInterval(waitingTimer.current);
            handleCancelMatch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (waitingTimer.current) {
        clearInterval(waitingTimer.current);
        waitingTimer.current = null;
      }
    }

    return () => {
      if (waitingTimer.current) {
        clearInterval(waitingTimer.current);
        waitingTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.status, match?.createdAt]);

  // Warn user before leaving during an in-progress match
  useEffect(() => {
    if (match?.status !== "IN_PROGRESS") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [match?.status]);

  const handleSubmitGuess = async (guess: string) => {
    if (!match) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitArenaGuess(matchIdNum, {
        guess: guess.toLowerCase(),
      });

      if (!mounted.current) return;

      const newGuessHistory: ArenaGuessHistoryResponse = {
        guess: response.guess,
        result: response.result,
        attemptNumber: response.attemptNumber,
      };

      setMyGuesses((prev) => [...prev, newGuessHistory]);

      // Update keyboard
      const newKbState = new Map(keyboardState);
      for (let i = 0; i < response.guess.length; i++) {
        const letter = response.guess[i].toUpperCase();
        const result = response.result[i] as LetterResult;
        const existing = newKbState.get(letter);
        if (!existing) {
          newKbState.set(letter, result);
        } else if (existing !== "CORRECT") {
          if (
            result === "CORRECT" ||
            (existing === "ABSENT" && result === "PRESENT")
          ) {
            newKbState.set(letter, result);
          }
        }
      }
      setKeyboardState(newKbState);

      if (isTerminal(response.matchStatus)) {
        clearAllTimers();
        const [updatedMatch, detailsRes] = await Promise.all([
          getMatch(matchIdNum),
          getMatchDetails(matchIdNum),
        ]);
        setMatch(updatedMatch);
        setMatchDetails(detailsRes);
        const p1 = updatedMatch.player1 === username;
        const oppGs = p1 ? detailsRes.player2Guesses : detailsRes.player1Guesses;
        setOpponentGuesses(oppGs);
        await fetchUpdatedRating();
      }

      setIsSubmitting(false);
      clearGuess();
    } catch (err: any) {
      if (!mounted.current) return;

      setIsSubmitting(false);
      if (err instanceof ConcurrentModificationError) {
        const updatedMatch = await getMatch(matchIdNum);
        setMatch(updatedMatch);
        if (isTerminal(updatedMatch.status)) {
          clearAllTimers();
          const detailsRes = await getMatchDetails(matchIdNum);
          setMatchDetails(detailsRes);
          const p1 = updatedMatch.player1 === username;
          const oppGs = p1
            ? detailsRes.player2Guesses
            : detailsRes.player1Guesses;
          setOpponentGuesses(oppGs);
          await fetchUpdatedRating();
        }
        setError("Match state changed. Please resubmit your guess.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const { currentGuess, handleKeyPress, clearGuess } = useGameInput({
    onSubmit: handleSubmitGuess,
    isActive: match?.status === "IN_PROGRESS" && !isSubmitting,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingState message="Connecting to arena match..." />
      </div>
    );
  }

  if (match?.status === "WAITING") {
    if (isSpectator) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="card-brutal p-8 text-center max-w-lg mx-auto w-full border-3 border-border shadow-brutal bg-surface flex flex-col items-center">
            <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-yellow border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-3">
              SPECTATOR MODE
            </span>
            <h2 className="font-display font-black text-2xl text-border tracking-tight mb-1">
              Waiting for Match to Begin
            </h2>
            <p className="text-border/60 mb-6 font-display font-bold text-xs uppercase tracking-wider">
              Host: {match.player1} &bull; Match #{match.id}
            </p>
            <p className="font-body text-sm text-border/80 mb-6">
              Player 1 is waiting for an opponent. As soon as another player joins, the live duel will start on this screen!
            </p>
            <button
              onClick={() => router.push("/arena")}
              className="btn-brutal bg-surface px-8 py-2.5 font-bold text-border text-sm shadow-brutal-sm"
            >
              Back to Arena
            </button>
          </div>
        </div>
      );
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card-brutal p-8 text-center max-w-lg mx-auto w-full border-3 border-border shadow-brutal bg-surface flex flex-col items-center">
          <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-yellow border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-3">
            LOBBY OPEN
          </span>
          <h2 className="font-display font-black text-2xl text-border tracking-tight mb-1">
            Waiting for Opponent
          </h2>
          <p className="text-border/60 mb-4 font-display font-bold text-xs uppercase tracking-wider">
            Match #{match.id} &bull; 1v1 Ranked
          </p>

          <div className="w-full py-4 mb-6 bg-bg rounded-brutal border-2 border-border/40 text-center">
            <p className="font-display font-black text-2xl text-border tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            <p className="font-body text-xs text-text-secondary mt-1">
              Auto-cancel if no opponent joins
            </p>
          </div>

          <button
            onClick={handleCancelMatch}
            disabled={isCancelling}
            className="btn-brutal bg-pastel-pink px-8 py-3 w-full font-bold text-border text-sm disabled:opacity-70"
          >
            {isCancelling ? "Cancelling..." : "Cancel Match"}
          </button>
        </div>
      </div>
    );
  }

  if (match?.status === "CANCELLED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card-brutal p-8 text-center max-w-md mx-auto w-full border-3 border-border shadow-brutal bg-surface flex flex-col items-center">
          <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-pink border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-3">
            SESSION ENDED
          </span>
          <h2 className="font-display font-black text-2xl mb-2 text-border">
            Match Cancelled
          </h2>
          <p className="font-body text-text-secondary text-sm mb-6">
            This match was cancelled before completion.
          </p>
          <button
            onClick={() => router.push("/arena")}
            className="btn-brutal bg-primary px-8 py-2.5 text-border font-bold text-sm w-full"
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  if (isSpectator && match) {
    const p1Guesses = myGuesses;
    const p2Guesses = opponentGuesses;
    const p1Name = match.player1;
    const p2Name = match.player2 || "Waiting for opponent...";
    const isCompleted = isTerminal(match.status);

    let resultBannerText = "";
    let resultBannerColor = "bg-pastel-yellow";
    if (match.status === "PLAYER1_WON") {
      resultBannerText = `${p1Name} WON THE DUEL!`;
      resultBannerColor = "bg-pastel-green";
    } else if (match.status === "PLAYER2_WON") {
      resultBannerText = `${p2Name} WON THE DUEL!`;
      resultBannerColor = "bg-pastel-green";
    } else if (match.status === "DRAW") {
      resultBannerText = "MATCH ENDED IN A DRAW";
      resultBannerColor = "bg-pastel-yellow";
    }

    return (
      <div className="flex flex-col max-w-5xl mx-auto py-6 px-4 w-full">
        {/* Spectator Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b-3 border-border">
          <button
            onClick={() => router.push("/arena")}
            className="btn-brutal bg-surface px-4 py-2 text-xs font-bold text-border flex items-center gap-1.5 shadow-brutal-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Arena
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-pastel-blue rounded-brutal border-2 border-border shadow-brutal-sm text-xs font-display font-black text-border uppercase tracking-wider">
              <Eye className="w-4 h-4" /> Spectator Mode
            </span>
            {match.status === "IN_PROGRESS" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-pastel-yellow rounded-brutal border-2 border-border text-xs font-display font-black text-border uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> LIVE
              </span>
            )}
            <span className="text-xs font-display font-bold text-border/60">
              Match #{match.id}
            </span>
          </div>
        </div>

        {/* Conclusion Banner */}
        {isCompleted && (
          <div
            className={`w-full p-6 rounded-brutal border-3 border-border shadow-brutal text-center mb-8 flex flex-col items-center ${resultBannerColor}`}
          >
            <span className="px-3 py-1 rounded-sm bg-surface border-2 border-border text-xs font-display font-black tracking-wider uppercase shadow-[1px_1px_0px_#1A1A2E] mb-2 inline-block">
              MATCH CONCLUDED
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-border uppercase tracking-tight">
              {resultBannerText}
            </h2>
            <button
              onClick={() => router.push("/arena")}
              className="btn-brutal bg-primary px-6 py-2 text-xs font-bold text-border mt-4 shadow-brutal-sm"
            >
              Back to Arena Lobby
            </button>
          </div>
        )}

        {/* Dual Board Arena Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Player 1 Side */}
          <div className="bg-surface p-6 rounded-brutal border-3 border-border shadow-brutal flex flex-col items-center">
            <div className="flex items-center gap-3 w-full pb-4 mb-4 border-b-2 border-border">
              <Avatar username={p1Name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-sm bg-pastel-yellow border border-border text-xs font-display font-black tracking-wider uppercase text-border">
                    PLAYER 1
                  </span>
                  {match.winner === "PLAYER1" && (
                    <span className="text-xs font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded border border-green-700">
                      WINNER
                    </span>
                  )}
                </div>
                <span className="font-display font-black text-lg text-border truncate block mt-0.5">
                  {p1Name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-display font-bold text-border/60 block">Attempts</span>
                <span className="font-display font-black text-sm text-border">
                  {match.player1Attempts} / 6
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <GameBoard
                guesses={p1Guesses.map((g) => ({
                  word: g.guess,
                  result: g.result,
                }))}
                currentGuess=""
                isActive={false}
              />
            </div>
          </div>

          {/* Player 2 Side */}
          <div className="bg-surface p-6 rounded-brutal border-3 border-border shadow-brutal flex flex-col items-center">
            <div className="flex items-center gap-3 w-full pb-4 mb-4 border-b-2 border-border">
              <Avatar username={p2Name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-sm bg-pastel-pink border border-border text-xs font-display font-black tracking-wider uppercase text-border">
                    PLAYER 2
                  </span>
                  {match.winner === "PLAYER2" && (
                    <span className="text-xs font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded border border-green-700">
                      WINNER
                    </span>
                  )}
                </div>
                <span className="font-display font-black text-lg text-border truncate block mt-0.5">
                  {p2Name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-display font-bold text-border/60 block">Attempts</span>
                <span className="font-display font-black text-sm text-border">
                  {match.player2Attempts} / 6
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <GameBoard
                guesses={p2Guesses.map((g) => ({
                  word: g.guess,
                  result: g.result,
                }))}
                currentGuess=""
                isActive={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMatchTerminal = match && isTerminal(match.status);
  const myResult =
    match && isMatchTerminal ? getMyResult(match, isPlayer1 ?? true) : null;
  const isActive = match?.status === "IN_PROGRESS" && !isSubmitting;

  return (
    <div className="flex flex-col max-w-4xl mx-auto py-4 px-4 w-full h-full min-h-[calc(100vh-80px)]">
      {/* Header scoreboard */}
      <div className="grid grid-cols-7 items-center mb-6 bg-surface p-4 rounded-brutal border-3 border-border shadow-brutal">
        <div className="col-span-3 flex flex-col">
          <div className="flex items-center gap-2">
            <Avatar username={username || ''} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-sm bg-pastel-yellow border border-border text-xs font-display font-black tracking-wider uppercase text-border">
                  YOU
                </span>
              </div>
              <span className="font-display font-bold text-sm text-border truncate block">{username}</span>
            </div>
          </div>
          <span className="text-xs font-display font-semibold text-border/70 mt-1">
            {myAttempts ?? 0} of 6 attempts
          </span>
        </div>
        
        <div className="col-span-1 text-center font-display font-black text-lg text-border/40 select-none">
          VS
        </div>

        <div className="col-span-3 flex flex-col items-end">
          <div className="flex items-center gap-2">
            <div className="min-w-0 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="px-2 py-0.5 rounded-sm bg-pastel-pink border border-border text-xs font-display font-black tracking-wider uppercase text-border">
                  OPP
                </span>
              </div>
              <span className="font-display font-bold text-sm text-border truncate block">{opponentName || "Waiting..."}</span>
            </div>
            <Avatar username={opponentName || '?'} size="sm" />
          </div>
          <span className="text-xs font-display font-semibold text-border/70 mt-1">
            {opponentAttempts ?? 0} of 6 attempts
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center">
          {isMatchTerminal && (
            <div className="relative w-full max-w-md mb-6">
              <div
                className={`w-full p-6 rounded-brutal border-3 border-border shadow-brutal text-center flex flex-col items-center ${
                  myResult === "win"
                    ? "bg-pastel-green"
                    : myResult === "loss"
                    ? "bg-pastel-pink"
                    : "bg-pastel-yellow"
                }`}
              >
                <span className="px-3 py-1 rounded-sm bg-surface border-2 border-border text-xs font-display font-black tracking-wider uppercase mb-3 shadow-[1px_1px_0px_#1A1A2E]">
                  MATCH RESULT
                </span>

                <h2 className="font-display font-black text-3xl sm:text-4xl text-border uppercase tracking-tight mb-2">
                  {myResult === "win" ? "VICTORY" : myResult === "loss" ? "DEFEAT" : "DRAW"}
                </h2>

                {updatedRating !== null && (
                  <div className="inline-block bg-surface px-4 py-1.5 rounded-brutal border-2 border-border shadow-brutal-sm font-display font-black text-sm text-border mb-4">
                    New Rating: {updatedRating}
                  </div>
                )}

                <div className="flex justify-center gap-4 mt-3 w-full">
                  <button
                    onClick={() => router.push("/arena")}
                    className="btn-brutal bg-primary px-6 py-2.5 font-bold text-border text-sm"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="btn-brutal bg-surface px-6 py-2.5 font-bold text-border text-sm"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8 w-full max-w-sm">
            <GameBoard
              guesses={myGuesses.map(arenaToBoardGuess)}
              currentGuess={currentGuess}
              isActive={isActive}
            />
          </div>

          {error && (
            <div className="w-full max-w-md mb-4 p-3 rounded-brutal border-3 border-border bg-pastel-pink text-border font-bold text-center text-sm">
              {error}
            </div>
          )}

          {/* Forfeit button — only during active IN_PROGRESS */}
          {match?.status === "IN_PROGRESS" && !isMatchTerminal && (
            <div className="w-full max-w-md mb-4 flex justify-center">
              <button
                onClick={handleForfeitMatch}
                disabled={isForfeiting}
                className="btn-brutal bg-surface px-5 py-2 font-bold text-danger text-sm flex items-center gap-1.5 disabled:opacity-70"
              >
                <Flag className="w-4 h-4" />
                {isForfeiting ? "Forfeiting..." : "Forfeit Match"}
              </button>
            </div>
          )}

          <div className="w-full max-w-lg mt-auto pb-8">
            <Keyboard
              onKeyPress={handleKeyPress}
              keyboardState={keyboardState}
              disabled={!isActive}
            />
          </div>
        </div>

        {/* Opponent Area */}
        <div className="w-full lg:w-64 flex flex-col items-center">
          <div className="bg-surface p-4 rounded-brutal border-3 border-border shadow-brutal w-full">
            <h3 className="font-display font-bold text-lg mb-4 text-center text-border border-b-3 border-border pb-2">
              Opponent
            </h3>
            <div className="flex justify-center transform scale-75 origin-top">
              <GameBoard
                guesses={opponentGuesses.map((g) => ({
                  word: match?.status && isTerminal(match.status) ? g.guess : "",
                  result: g.result,
                }))}
                currentGuess=""
                isActive={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
