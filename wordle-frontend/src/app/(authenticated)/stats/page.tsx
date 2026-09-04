"use client";

import { useState, useEffect } from "react";
import { getStats } from "@/lib/api/stats";
import type { StatsResponse } from "@/types/api";
import { BarChart3, Trophy, Flame, Target, Percent, Gamepad2 } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError("Failed to load statistics."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="font-display text-text-secondary animate-pulse">
          Loading statistics...
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

  if (!stats) return null;

  const maxDistribution = Math.max(
    ...Object.values(stats.guessDistribution),
    1
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-3xl flex items-center gap-3">
        <BarChart3 className="w-8 h-8" />
        Statistics
      </h1>

      {stats.gamesPlayed === 0 ? (
        <div className="card-brutal p-8 text-center">
          <Gamepad2 className="w-16 h-16 mx-auto text-text-secondary mb-4" />
          <p className="font-display font-bold text-xl mb-2">No stats yet</p>
          <p className="text-text-secondary">
            Play your first game to start building your stats.
          </p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={<Gamepad2 className="w-5 h-5" />}
              label="Games Played"
              value={stats.gamesPlayed.toString()}
            />
            <StatCard
              icon={<Trophy className="w-5 h-5" />}
              label="Wins"
              value={stats.wins.toString()}
              accent="green"
            />
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Losses"
              value={stats.losses.toString()}
              accent="pink"
            />
            <StatCard
              icon={<Percent className="w-5 h-5" />}
              label="Win Rate"
              value={`${stats.winRate}%`}
              accent="blue"
            />
            <StatCard
              icon={<Flame className="w-5 h-5" />}
              label="Current Streak"
              value={`${stats.currentStreak}`}
              accent="orange"
            />
            <StatCard
              icon={<Trophy className="w-5 h-5" />}
              label="Best Streak"
              value={`${stats.bestStreak}`}
              accent="yellow"
            />
          </div>

          {/* Guess Distribution */}
          <div className="card-brutal p-6">
            <h2 className="font-display font-bold text-xl mb-4">
              Guess Distribution
            </h2>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((attempt) => {
                const count = stats.guessDistribution[attempt] ?? 0;
                const width =
                  maxDistribution > 0
                    ? Math.max((count / maxDistribution) * 100, 8)
                    : 8;
                return (
                  <div key={attempt} className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm w-4 text-right">
                      {attempt}
                    </span>
                    <div className="flex-1">
                      <div
                        className="bg-correct text-white text-right px-2 py-1 rounded-sm font-display font-bold text-sm border-2 border-border transition-all duration-500"
                        style={{ width: `${width}%` }}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "green" | "pink" | "blue" | "yellow" | "orange" | "purple";
}) {
  const accentClasses: Record<string, string> = {
    green: "bg-pastel-green",
    pink: "bg-pastel-pink",
    blue: "bg-pastel-blue",
    yellow: "bg-pastel-yellow",
    orange: "bg-pastel-orange",
    purple: "bg-pastel-purple",
  };
  const bg = accent ? accentClasses[accent] : "bg-surface";

  return (
    <div className={`card-brutal p-4 ${bg}`}>
      <div className="flex items-center gap-2 text-text-secondary mb-1">
        {icon}
        <span className="font-display text-xs uppercase font-semibold">
          {label}
        </span>
      </div>
      <p className="font-display font-black text-3xl">{value}</p>
    </div>
  );
}
