"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getMatch,
  getMatchDetails,
  submitArenaGuess,
} from "@/lib/api/arena";
import { getMe } from "@/lib/api/users";
import { ApiError, ConcurrentModificationError } from "@/lib/api/client";
import {
  ArenaMatchResponse,
  ArenaMatchDetailsResponse,
  ArenaMatchStatus,
  ArenaGuessHistoryResponse,
  ArenaGuessResponse,
  LetterResult,
  BoardGuess,
  arenaToBoardGuess,
} from "@/types/api";
import { GameBoard } from "@/components/game/GameBoard";
import { Keyboard } from "@/components/game/Keyboard";
import { useGameInput } from "@/hooks/useGameInput";
import { useAuthStore } from "@/stores/auth-store";

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

  const mounted = useRef(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const isPlayer1 = match?.player1 === username;
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
    } catch (err: any) {
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
      const myGs = p1 ? detailsRes.player1Guesses : detailsRes.player2Guesses;
      const oppGs = p1 ? detailsRes.player2Guesses : detailsRes.player1Guesses;

      setMyGuesses(myGs);
      setOpponentGuesses(oppGs);

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

  useEffect(() => {
    mounted.current = true;
    loadInitialData();
    return () => {
      mounted.current = false;
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [matchIdNum, username]);

  useEffect(() => {
    if (match?.status === "IN_PROGRESS") {
      if (pollInterval.current) clearInterval(pollInterval.current);

      pollInterval.current = setInterval(async () => {
        try {
          const updatedMatch = await getMatch(matchIdNum);
          if (!mounted.current) return;

          setMatch(updatedMatch);

          if (isTerminal(updatedMatch.status)) {
            if (pollInterval.current) clearInterval(pollInterval.current);
            const detailsRes = await getMatchDetails(matchIdNum);
            setMatchDetails(detailsRes);
            const p1 = updatedMatch.player1 === username;
            const oppGs = p1
              ? detailsRes.player2Guesses
              : detailsRes.player1Guesses;
            setOpponentGuesses(oppGs);
            await fetchUpdatedRating();
          }
        } catch (err: any) {
          // Ignore polling errors
        }
      }, 4000);
    }

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [match?.status, matchIdNum, username]);

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
        if (pollInterval.current) clearInterval(pollInterval.current);
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
        <h2 className="font-display font-bold text-2xl mb-4 text-border animate-pulse">
          Loading match...
        </h2>
      </div>
    );
  }

  if (match?.status === "WAITING") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="font-display font-bold text-2xl mb-4 text-border">
          Waiting for opponent...
        </h2>
        <button
          onClick={() => router.push("/arena")}
          className="btn-brutal bg-primary px-6 py-2 text-border font-bold"
        >
          Back to Arena
        </button>
      </div>
    );
  }

  if (match?.status === "CANCELLED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="font-display font-bold text-2xl mb-4 text-border">
          This match was cancelled.
        </h2>
        <button
          onClick={() => router.push("/arena")}
          className="btn-brutal bg-primary px-6 py-2 text-border font-bold"
        >
          Back to Arena
        </button>
      </div>
    );
  }

  const isMatchTerminal = match && isTerminal(match.status);
  const myResult =
    match && isMatchTerminal ? getMyResult(match, isPlayer1 ?? true) : null;
  const isActive = match?.status === "IN_PROGRESS" && !isSubmitting;

  return (
    <div className="flex flex-col max-w-4xl mx-auto py-4 px-4 w-full h-full min-h-[calc(100vh-80px)]">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-6 bg-surface p-4 rounded-brutal border-3 border-border shadow-brutal">
        <div className="flex flex-col">
          <span className="font-bold text-border">YOU ({username})</span>
          <span className="text-sm font-body text-border/70">
            {myAttempts ?? 0}/6 attempts
          </span>
        </div>
        <div className="font-display font-black text-2xl text-primary text-shadow-brutal">
          VS
        </div>
        <div className="flex flex-col items-end">
          <span className="font-bold text-border">
            {opponentName || "Opponent"}
          </span>
          <span className="text-sm font-body text-border/70">
            {opponentAttempts ?? 0}/6 attempts
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center">
          {isMatchTerminal && (
            <div
              className={`w-full max-w-md p-6 rounded-brutal border-3 border-border shadow-brutal text-center mb-6 animate-bounce ${
                myResult === "win"
                  ? "bg-pastel-green"
                  : myResult === "loss"
                  ? "bg-pastel-pink"
                  : "bg-pastel-yellow"
              }`}
            >
              <h2 className="font-display font-black text-4xl mb-4 text-border">
                {myResult === "win"
                  ? "🏆 Victory!"
                  : myResult === "loss"
                  ? "😔 Defeat"
                  : "🤝 Draw"}
              </h2>
              {updatedRating !== null && (
                <p className="font-display font-bold text-2xl mb-4 text-border">
                  Your Rating: {updatedRating}
                </p>
              )}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => router.push("/arena")}
                  className="btn-brutal bg-primary px-6 py-2 font-bold text-border"
                >
                  Play Again
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="btn-brutal bg-surface px-6 py-2 font-bold text-border"
                >
                  Home
                </button>
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
            <div className="w-full max-w-md mb-4 p-3 rounded-brutal border-3 border-border bg-pastel-pink text-border font-bold text-center">
              {error}
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
                guesses={opponentGuesses.map(arenaToBoardGuess)}
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
