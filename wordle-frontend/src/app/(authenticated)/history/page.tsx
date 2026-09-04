"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserGames } from "@/lib/api/games";
import type { GameResponse, GameType, GameStatus } from "@/types/api";
import { Clock, History } from "lucide-react";

const TYPE_LABELS: Record<GameType, string> = {
  DAILY: "Daily",
  PRACTICE: "Practice",
  ARENA: "Arena",
};

const TYPE_COLORS: Record<GameType, string> = {
  DAILY: "bg-pastel-blue",
  PRACTICE: "bg-pastel-green",
  ARENA: "bg-pastel-pink",
};

const STATUS_LABELS: Record<GameStatus, string> = {
  IN_PROGRESS: "In Progress",
  WON: "Won",
  LOST: "Lost",
  ABANDONED: "Abandoned",
};

const STATUS_COLORS: Record<GameStatus, string> = {
  IN_PROGRESS: "bg-pastel-yellow text-border",
  WON: "bg-correct text-white",
  LOST: "bg-danger text-white",
  ABANDONED: "bg-absent text-white",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserGames()
      .then(setGames)
      .catch(() => setError("Failed to load game history."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="font-display text-text-secondary animate-pulse">
          Loading history...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="card-brutal p-6 text-center bg-pastel-pink">
          <p className="font-display font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-3xl flex items-center gap-3">
        <History className="w-8 h-8" />
        Game History
      </h1>

      {games.length === 0 ? (
        <div className="card-brutal p-8 text-center">
          <Clock className="w-16 h-16 mx-auto text-text-secondary mb-4" />
          <p className="font-display font-bold text-xl mb-2">No games yet</p>
          <p className="text-text-secondary">
            Your arena journey starts here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/history/${game.id}`}
              className="card-brutal p-4 flex items-center justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal-lg transition-all block"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-display font-bold border-2 border-border ${TYPE_COLORS[game.gameType]}`}
                >
                  {TYPE_LABELS[game.gameType]}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-display font-bold border-2 border-border ${STATUS_COLORS[game.status]}`}
                >
                  {STATUS_LABELS[game.status]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="font-display font-semibold">
                  {game.attemptCount}/6
                </span>
                <span className="font-body hidden sm:inline">
                  {formatDate(game.startedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
