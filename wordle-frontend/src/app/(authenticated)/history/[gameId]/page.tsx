"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getGame } from "@/lib/api/games";
import type { GameDetailsResponse } from "@/types/api";
import { toBoardGuess } from "@/types/api";
import { GameBoard } from "@/components/game/GameBoard";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In Progress",
  WON: "Won",
  LOST: "Lost",
  ABANDONED: "Abandoned",
  DRAW: "Draw",
};

const TYPE_LABELS: Record<string, string> = {
  DAILY: "Daily",
  PRACTICE: "Practice",
  ARENA: "Arena",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const gameIdNum = parseInt(gameId, 10);

  const [game, setGame] = useState<GameDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNaN(gameIdNum)) {
      setError("Invalid game ID.");
      setIsLoading(false);
      return;
    }

    getGame(gameIdNum)
      .then(setGame)
      .catch(() => setError("Game not found."))
      .finally(() => setIsLoading(false));
  }, [gameIdNum]);

  if (isLoading) {
    return <LoadingState message="Loading game details..." />;
  }

  if (error || !game) {
    return (
      <div className="space-y-4">
        <Link
          href="/history"
          className="inline-flex items-center gap-2 font-display font-semibold text-text-secondary hover:text-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>
        <div className="card-brutal p-6 text-center bg-pastel-pink">
          <p className="font-display font-bold">{error || "Game not found."}</p>
        </div>
      </div>
    );
  }

  const boardGuesses = game.guesses.map(toBoardGuess);

  return (
    <div className="space-y-6">
      <Link
        href="/history"
        className="inline-flex items-center gap-2 font-display font-semibold text-text-secondary hover:text-border"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to History
      </Link>

      {/* Game Info Card */}
      <div className="card-brutal p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-display font-bold border-2 border-border bg-pastel-blue">
              {TYPE_LABELS[game.gameType] || game.gameType}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-display font-bold border-2 border-border ${
                game.status === "WON"
                  ? "bg-correct text-white"
                  : game.status === "LOST"
                  ? "bg-danger text-white"
                  : game.status === "DRAW"
                  ? "bg-pastel-purple text-border"
                  : "bg-pastel-yellow"
              }`}
            >
              {STATUS_LABELS[game.status] || game.status}
            </span>
          </div>
          {game.gameType === "ARENA" && (
            <Link
              href={`/arena/${game.id}`}
              className="btn-brutal bg-pastel-pink px-4 py-1.5 text-xs font-bold text-border shadow-brutal-sm"
            >
              View 1v1 Arena Duel
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-display text-xs uppercase text-text-secondary font-semibold">
              Attempts
            </p>
            <p className="font-display font-bold text-lg">
              {game.attemptCount}/6
            </p>
          </div>
          <div>
            <p className="font-display text-xs uppercase text-text-secondary font-semibold">
              Started
            </p>
            <p className="font-body">{formatDate(game.startedAt)}</p>
          </div>
          {game.completedAt && (
            <div>
              <p className="font-display text-xs uppercase text-text-secondary font-semibold">
                Completed
              </p>
              <p className="font-body">{formatDate(game.completedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex justify-center">
        <GameBoard
          guesses={boardGuesses}
          currentGuess=""
          maxAttempts={6}
          isActive={false}
        />
      </div>
    </div>
  );
}
