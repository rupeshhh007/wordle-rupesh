"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard, getMyRank } from "@/lib/api/leaderboard";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LeaderboardEntryResponse,
  MyLeaderboardResponse,
} from "@/types/api";
import { Trophy, Medal, Crown, ChevronRight } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { Avatar } from "@/components/ui/Avatar";

export default function LeaderboardPage() {
  const router = useRouter();
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
    return <LoadingState message="Loading rankings..." />;
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
      <h1 className="font-display font-black text-3xl sm:text-4xl flex items-center gap-3 text-border uppercase tracking-wide">
        <div className="p-2 bg-pastel-yellow rounded-brutal border-2 border-border shadow-brutal-sm">
          <Trophy className="w-6 h-6 text-border" />
        </div>
        Leaderboard
      </h1>

      {/* My Rank Card */}
      {myRank && (
        <div
          onClick={() => router.push("/profile")}
          className="card-brutal card-interactive p-5 bg-pastel-yellow cursor-pointer hover:brightness-95 transition-all"
        >
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
                    onClick={() => {
                      if (isMe) router.push("/profile");
                      else router.push(`/profile/${encodeURIComponent(entry.username)}`);
                    }}
                    className={`border-b border-border/20 transition-colors cursor-pointer group ${
                      isMe
                        ? "bg-pastel-yellow font-bold hover:bg-pastel-yellow/80"
                        : "hover:bg-pastel-yellow/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <RankDisplay rank={entry.rank} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-display font-semibold inline-flex items-center gap-2 group-hover:underline underline-offset-2">
                        <Avatar username={entry.username} size="sm" />
                        {entry.username}
                        {isMe && (
                          <span className="ml-1 text-xs bg-primary text-border px-2 py-0.5 rounded-full border border-border font-bold">
                            YOU
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-black text-lg inline-flex items-center gap-1.5">
                        {entry.rating}
                        <ChevronRight className="w-4 h-4 text-border/30 group-hover:text-border group-hover:translate-x-0.5 transition-all" />
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
                onClick={() => {
                  if (isMe) router.push("/profile");
                  else router.push(`/profile/${encodeURIComponent(entry.username)}`);
                }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  isMe ? "bg-pastel-yellow hover:bg-pastel-yellow/80" : "hover:bg-pastel-yellow/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RankDisplay rank={entry.rank} />
                  <Avatar username={entry.username} size="sm" />
                  <span className="font-display font-semibold">
                    {entry.username}
                    {isMe && (
                      <span className="ml-1 text-xs bg-primary text-border px-2 py-0.5 rounded-full border border-border font-bold">
                        YOU
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-display font-black text-lg inline-flex items-center gap-1">
                  {entry.rating}
                  <ChevronRight className="w-4 h-4 text-border/30" />
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
