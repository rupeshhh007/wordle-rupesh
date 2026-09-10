"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, AlertCircle, XCircle } from "lucide-react";
import { startGame, submitGuess, abandonGame, getGame } from "@/lib/api/games";
import {
  toBoardGuess,
  GuessResponse,
  GameStatus,
  LetterResult,
} from "@/types/api";
import { GameBoard } from "@/components/game/GameBoard";
import { Keyboard } from "@/components/game/Keyboard";
import { useGameInput } from "@/hooks/useGameInput";
import { Modal } from "@/components/ui/Modal";

// Helper to update keyboard state with priority: CORRECT > PRESENT > ABSENT
const updateKeyboardState = (
  currentState: Map<string, LetterResult>,
  guesses: GuessResponse[]
): Map<string, LetterResult> => {
  const newState = new Map(currentState);

  guesses.forEach((guess) => {
    // Assuming guess is a string and result is an array of LetterResult
    for (let i = 0; i < 5; i++) {
      if (!guess.guess || !guess.result) break;
      const char = guess.guess[i].toUpperCase();
      const result = guess.result[i];
      const currentResult = newState.get(char);

      if (currentResult === "CORRECT") continue;
      if (currentResult === "PRESENT" && result === "ABSENT") continue;
      if (currentResult === "PRESENT" && result === "PRESENT") continue;

      newState.set(char, result);
    }
  });

  return newState;
};

export default function PracticePage() {
  const router = useRouter();
  const [gameId, setGameId] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [guesses, setGuesses] = useState<GuessResponse[]>([]);
  const [solutionWord, setSolutionWord] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardState, setKeyboardState] = useState<
    Map<string, LetterResult>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const savedGameId =
      typeof window !== "undefined"
        ? localStorage.getItem("wordle_practice_active_game_id")
        : null;

    if (!savedGameId) return;

    const loadSavedGame = async () => {
      try {
        setIsLoading(true);
        const game = await getGame(Number(savedGameId));
        if (!mounted) return;

        setGameId(game.id);
        setStatus(game.status);
        if (game.word) setSolutionWord(game.word);

        if (game.guesses && game.guesses.length > 0) {
          setGuesses(game.guesses);
          setKeyboardState(updateKeyboardState(new Map(), game.guesses));
        }

        if (game.status === "WON" || game.status === "LOST" || game.status === "ABANDONED") {
          localStorage.removeItem("wordle_practice_active_game_id");
        }
      } catch (e) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("wordle_practice_active_game_id");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSavedGame();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (guess: string) => {
    if (!gameId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitGuess(gameId, {
        guess: guess.toLowerCase(),
      });
      const newGuesses = [...guesses, response];
      setGuesses(newGuesses);
      setKeyboardState(updateKeyboardState(keyboardState, [response]));

      if (response.word) {
        setSolutionWord(response.word);
      }

      if (response.gameStatus === "WON" || response.gameStatus === "LOST") {
        setStatus(response.gameStatus);
        if (typeof window !== "undefined") {
          localStorage.removeItem("wordle_practice_active_game_id");
        }
      }
      clearGuess();
    } catch (err: any) {
      setError(err.message || "Failed to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { currentGuess, handleKeyPress, shake, clearGuess } = useGameInput({
    onSubmit: handleSubmit,
    isActive: status === "IN_PROGRESS" && !isSubmitting,
  });

  const handleStartGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newGame = await startGame({ gameType: "PRACTICE" });
      if (typeof window !== "undefined") {
        localStorage.setItem("wordle_practice_active_game_id", String(newGame.id));
      }
      setGameId(newGame.id);
      setStatus("IN_PROGRESS");
      setSolutionWord(null);
      setGuesses([]);
      setKeyboardState(new Map());
      clearGuess();
    } catch (err: any) {
      setError(err.message || "Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    handleStartGame();
  };

  const handleAbandon = async () => {
    if (!gameId) return;
    try {
      const res = await abandonGame(gameId);
      if (res.word) {
        setSolutionWord(res.word);
      }
      setStatus("ABANDONED");
      if (typeof window !== "undefined") {
        localStorage.removeItem("wordle_practice_active_game_id");
      }
      setShowAbandonModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to abandon game");
    }
  };

  const renderStartScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="card-brutal p-8 text-center max-w-md mx-auto flex flex-col items-center gap-5 bg-surface border-3 border-border shadow-brutal">
        <div className="p-4 bg-pastel-blue rounded-brutal border-3 border-border shadow-brutal-sm">
          <Dumbbell className="w-12 h-12 text-border" strokeWidth={2} />
        </div>
        <div>
          <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-blue border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] inline-block mb-2">
            PRACTICE MODE
          </span>
          <h2 className="font-display font-black text-3xl text-border tracking-tight">
            Infinite Practice
          </h2>
          <p className="font-body text-text-secondary text-sm mt-1">
            Unlimited games to sharpen your vocabulary and logic
          </p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-danger bg-pastel-pink px-4 py-2 rounded-brutal border-2 border-border font-body font-bold text-sm w-full text-center justify-center">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}
        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="btn-brutal bg-primary text-border font-bold text-base w-full py-3.5 mt-2"
        >
          {isLoading ? "Starting round..." : "New Game"}
        </button>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="flex-1 flex flex-col items-center w-full max-w-lg mx-auto gap-8 pt-4 pb-8">
      <div className="w-full flex justify-between items-center px-4">
        <h1 className="font-display font-black text-xl flex items-center gap-2.5 text-border uppercase tracking-wide">
          <div className="p-1.5 bg-pastel-blue rounded-md border-2 border-border shadow-[1px_1px_0px_#1A1A2E]">
            <Dumbbell size={18} className="text-border" />
          </div>
          Practice Mode
        </h1>
      </div>

      <div className="flex-1 w-full flex flex-col justify-center">
        <GameBoard
          guesses={guesses.map(toBoardGuess)}
          currentGuess={currentGuess}
          isActive={status === "IN_PROGRESS" && !isSubmitting}
          shake={shake}
          maxAttempts={6}
        />
      </div>

      {status === "WON" || status === "LOST" || status === "ABANDONED" ? (
        <div className="relative w-full px-4">
          <div className="card-brutal p-6 text-center bg-surface border-3 border-border shadow-brutal flex flex-col items-center">
            {status === "WON" && (
              <>
                <span className="px-3 py-1 rounded-sm bg-correct text-white border-2 border-border text-xs font-display font-black tracking-wider uppercase mb-3 shadow-[1px_1px_0px_#1A1A2E]">
                  PUZZLE SOLVED
                </span>
                <h3 className="font-display font-black text-3xl text-border">
                  Well done!
                </h3>
                <p className="font-body text-border/80 font-semibold text-sm mt-1 mb-6">
                  You solved it in {guesses.length}{" "}
                  {guesses.length === 1 ? "attempt" : "attempts"}.
                </p>
              </>
            )}
            {status === "LOST" && (
              <>
                <span className="px-3 py-1 rounded-sm bg-absent text-white border-2 border-border text-xs font-display font-black tracking-wider uppercase mb-3 shadow-[1px_1px_0px_#1A1A2E]">
                  ROUND OVER
                </span>
                <h3 className="font-display font-black text-3xl text-border">
                  Better luck next time!
                </h3>
                <p className="font-body text-border/80 font-semibold text-sm mt-1 mb-6">
                  Keep practicing to sharpen your strategy.
                </p>
              </>
            )}
            {status === "ABANDONED" && (
              <>
                <span className="px-3 py-1 rounded-sm bg-pastel-pink text-border border-2 border-border text-xs font-display font-black tracking-wider uppercase mb-3 shadow-[1px_1px_0px_#1A1A2E]">
                  SESSION ABANDONED
                </span>
                <h3 className="font-display font-black text-3xl text-border">
                  Game Ended
                </h3>
                <p className="font-body text-border/80 font-semibold text-sm mt-1 mb-6">
                  You ended this practice session early.
                </p>
              </>
            )}

            {solutionWord && (
              <div className="my-4 flex flex-col items-center">
                <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase mb-1.5">
                  THE WORD WAS
                </span>
                <div className="flex gap-1.5 justify-center">
                  {solutionWord.toUpperCase().split("").map((char, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 bg-correct text-white border-2 border-border shadow-[2px_2px_0px_#1A1A2E] rounded font-display font-black text-xl flex items-center justify-center"
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={handlePlayAgain}
                className="btn-brutal px-6 py-2.5 bg-primary text-border font-bold text-sm"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="btn-brutal px-6 py-2.5 bg-surface text-border font-bold text-sm"
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="mt-8 w-full max-w-lg flex flex-col items-center">
            <Keyboard
              onKeyPress={handleKeyPress}
              keyboardState={keyboardState}
              disabled={true}
            />
          </div>
        </div>
      ) : (
        <div className="w-full px-2 flex flex-col items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 font-body font-medium bg-red-50 px-4 py-2 rounded-brutal border-2 border-red-600 mb-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <Keyboard
            onKeyPress={handleKeyPress}
            keyboardState={keyboardState}
            disabled={status !== "IN_PROGRESS"}
          />

          <button
            onClick={() => setShowAbandonModal(true)}
            className="flex items-center gap-2 text-text-secondary hover:text-border font-body font-medium transition-colors mt-4"
          >
            <XCircle size={18} />
            Abandon Game
          </button>
        </div>
      )}

      {/* Abandon Modal */}
      {showAbandonModal && (
        <Modal
          isOpen={showAbandonModal}
          onClose={() => setShowAbandonModal(false)}
          title="Abandon Game?"
        >
          <p className="font-body text-border mb-6">
            Are you sure? This game will be marked as abandoned and will count
            towards your statistics.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAbandonModal(false)}
              className="btn-brutal bg-surface text-border font-bold px-6 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleAbandon}
              className="btn-brutal bg-danger text-white font-bold px-6 py-2"
            >
              Abandon
            </button>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <div className="min-h-full flex flex-col bg-bg">
      {status === null ? renderStartScreen() : renderGame()}
    </div>
  );
}
