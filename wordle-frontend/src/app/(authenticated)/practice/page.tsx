"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, AlertCircle, XCircle } from "lucide-react";
import { startGame, submitGuess, abandonGame } from "@/lib/api/games";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardState, setKeyboardState] = useState<
    Map<string, LetterResult>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);

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

      if (response.gameStatus === "WON" || response.gameStatus === "LOST") {
        setStatus(response.gameStatus);
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
      setGameId(newGame.id);
      setStatus("IN_PROGRESS");
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
      await abandonGame(gameId);
      setStatus("ABANDONED");
      setShowAbandonModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to abandon game");
    }
  };

  const renderStartScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="card-brutal p-8 text-center max-w-md mx-auto flex flex-col items-center gap-6">
        <div className="p-4 bg-pastel-blue rounded-full border-3 border-border shadow-brutal">
          <Dumbbell className="w-16 h-16 text-border" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-display font-bold text-3xl mb-2 text-border">
            Practice Mode
          </h2>
          <p className="font-body text-text-secondary text-lg">
            Unlimited games to sharpen your skills
          </p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-brutal border-2 border-red-600">
            <AlertCircle size={20} />
            <p className="font-body font-medium">{error}</p>
          </div>
        )}
        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="btn-brutal bg-primary text-border font-bold text-lg w-full py-4 mt-2"
        >
          {isLoading ? "Starting practice..." : "New Game"}
        </button>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="flex-1 flex flex-col items-center w-full max-w-lg mx-auto gap-8 pt-4 pb-8">
      <div className="w-full flex justify-between items-center px-4">
        <h1 className="font-display font-bold text-2xl flex items-center gap-3">
          <div className="p-2 bg-pastel-blue rounded-brutal border-2 border-border shadow-[2px_2px_0px_rgba(26,26,46,1)]">
            <Dumbbell size={20} />
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
        <div className="w-full px-4 w-full animate-bounce-in">
          <div className="card-brutal p-6 text-center bg-surface">
            {status === "WON" && (
              <>
                <h3 className="font-display font-bold text-2xl mb-2 text-correct">
                  🎉 Well done!
                </h3>
                <p className="font-body text-border mb-6">
                  You solved it in {guesses.length}{" "}
                  {guesses.length === 1 ? "attempt" : "attempts"}.
                </p>
              </>
            )}
            {status === "LOST" && (
              <>
                <h3 className="font-display font-bold text-2xl mb-2 text-absent">
                  Better luck next time!
                </h3>
                <p className="font-body text-border mb-6">
                  Keep practicing to improve your skills.
                </p>
              </>
            )}
            {status === "ABANDONED" && (
              <>
                <h3 className="font-display font-bold text-2xl mb-2 text-border">
                  Game Abandoned
                </h3>
                <p className="font-body text-border mb-6">
                  You ended this practice session.
                </p>
              </>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePlayAgain}
                className="btn-brutal py-2 bg-primary text-border font-bold"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="btn-brutal py-2 bg-surface text-border font-bold"
              >
                Back Home
              </button>
            </div>
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
