"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserGames } from "@/lib/api/games";
import type { GameResponse, GameType, GameStatus } from "@/types/api";
import { Clock, History } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";

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
    return <LoadingState message="Loading game history..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="card-brutal p-6 text-center bg-pastel-pink border-3 border-border shadow-brutal">
          <p className="font-display font-bold text-danger">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-black text-3xl flex items-center gap-3 text-border uppercase tracking-wide">
        <div className="p-2 bg-pastel-blue rounded-brutal border-2 border-border shadow-brutal-sm">
          <History className="w-6 h-6 text-border" />
        </div>
        Game History
      </h1>

      {games.length === 0 ? (
        <div className="card-brutal p-8 text-center bg-surface flex flex-col items-center gap-3 border-dashed border-3 border-border/40">
          <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-1 bg-pastel-yellow border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E]">
            EMPTY ARCHIVE
          </span>
          <h2 className="font-display font-black text-2xl text-border mt-1">No games recorded yet</h2>
          <p className="font-body text-text-secondary text-sm max-w-xs">
            Your match record will appear here after your first completed game.
          </p>
          <Link href="/daily" className="btn-brutal bg-primary px-6 py-2.5 text-xs font-bold mt-2 text-border uppercase tracking-wider">
            Play Daily Wordle
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/history/${game.id}`}
              className="card-brutal card-interactive p-4 flex items-center justify-between block"
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
