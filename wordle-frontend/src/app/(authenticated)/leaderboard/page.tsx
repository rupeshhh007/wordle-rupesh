"use client";

import { useState, useEffect } from "react";
import { getLeaderboard, getMyRank } from "@/lib/api/leaderboard";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LeaderboardEntryResponse,
  MyLeaderboardResponse,
} from "@/types/api";
import { Trophy, Medal, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderboardEntryResponse[]>([]);
  const [myRank, setMyRank] = useState<MyLeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getLeaderboard(), getMyRank()])
      .then(([leaderboard, rank]) => {
        setEntries(leaderboard);
        setMyRank(rank);
      })
      .catch(() => setError("Failed to load leaderboard."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="font-display text-text-secondary animate-pulse">
          Loading rankings...
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
        <Trophy className="w-8 h-8" />
        Leaderboard
      </h1>

      {/* My Rank Card */}
      {myRank && (
        <div className="card-brutal p-5 bg-pastel-yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm text-text-secondary uppercase font-semibold">
                Your Rank
              </p>
              <p className="font-display font-black text-4xl">
                #{myRank.rank}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-lg">{myRank.username}</p>
              <p className="font-display font-black text-2xl">
                {myRank.rating}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card-brutal overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b-3 border-border bg-bg">
                <th className="text-left px-4 py-3 font-display font-bold text-sm uppercase">
                  Rank
                </th>
                <th className="text-left px-4 py-3 font-display font-bold text-sm uppercase">
                  Player
                </th>
                <th className="text-right px-4 py-3 font-display font-bold text-sm uppercase">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isMe = entry.userId === user?.id;
                return (
                  <tr
                    key={entry.userId}
                    className={`border-b border-border/20 transition-colors ${
                      isMe
                        ? "bg-pastel-yellow font-bold"
                        : "hover:bg-bg"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <RankDisplay rank={entry.rank} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-display font-semibold">
                        {entry.username}
                        {isMe && (
                          <span className="ml-2 text-xs bg-primary text-border px-2 py-0.5 rounded-full border border-border font-bold">
                            YOU
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-black text-lg">
                        {entry.rating}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-border/20">
          {entries.map((entry) => {
            const isMe = entry.userId === user?.id;
            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between px-4 py-3 ${
                  isMe ? "bg-pastel-yellow" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <RankDisplay rank={entry.rank} />
                  <span className="font-display font-semibold">
                    {entry.username}
                  </span>
                </div>
                <span className="font-display font-black text-lg">
                  {entry.rating}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1 font-display font-black text-lg">
        <Crown className="w-5 h-5 text-yellow-500" />
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1 font-display font-black text-lg text-gray-500">
        <Medal className="w-5 h-5" />
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1 font-display font-black text-lg text-amber-700">
        <Medal className="w-5 h-5" />
        {rank}
      </span>
    );
  }
  return (
    <span className="font-display font-bold text-lg text-text-secondary w-8 inline-block">
      {rank}
    </span>
  );
}
