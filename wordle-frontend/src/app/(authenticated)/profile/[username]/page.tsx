"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPublicProfile, getUserStats } from "@/lib/api/users";
import { challengeUser } from "@/lib/api/arena";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicUserProfileResponse, StatsResponse } from "@/types/api";
import { LoadingState } from "@/components/ui/LoadingState";
import { Avatar } from "@/components/ui/Avatar";
import { OnlineBadge, OnlineDot } from "@/components/ui/OnlineBadge";
import {
  ArrowLeft,
  Trophy,
  Star,
  Swords,
  Gamepad2,
  Target,
  Percent,
  Flame,
  Loader2,
  Crown,
  Medal,
} from "lucide-react";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const router = useRouter();
  const { username: rawUsername } = use(params);
  const username = decodeURIComponent(rawUsername);

  const currentUser = useAuthStore((s) => s.user);
  const isMe = currentUser?.username === username;

  const [profile, setProfile] = useState<PublicUserProfileResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChallenging, setIsChallenging] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    Promise.all([getPublicProfile(username), getUserStats(username)])
      .then(([prof, st]) => {
        setProfile(prof);
        setStats(st);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load player profile.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  const handleChallenge = async () => {
    if (isChallenging) return;
    try {
      setIsChallenging(true);
      const match = await challengeUser(username);
      router.push(`/arena/${match.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to challenge player.");
      setIsChallenging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <LoadingState message={`Loading ${username}'s profile...`} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-8">
        <button
          onClick={() => router.push("/leaderboard")}
          className="btn-brutal bg-surface px-4 py-2 text-xs font-bold text-border flex items-center gap-1.5 shadow-brutal-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
        </button>
        <div className="card-brutal p-8 text-center bg-pastel-pink border-3 border-border shadow-brutal">
          <p className="font-display font-black text-xl text-border mb-2">
            Player Not Found
          </p>
          <p className="font-body text-sm text-border/80 mb-6">
            {error || `We couldn't find any player profile for "${username}".`}
          </p>
          <button
            onClick={() => router.push("/leaderboard")}
            className="btn-brutal bg-primary px-6 py-2.5 text-xs font-bold text-border shadow-brutal-sm"
          >
            Go to Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const maxDistribution = stats
    ? Math.max(...Object.values(stats.guessDistribution), 1)
    : 1;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/leaderboard")}
          className="btn-brutal bg-surface px-4 py-2 text-xs font-bold text-border flex items-center gap-1.5 shadow-brutal-sm hover:bg-bg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
        </button>

        {isMe && (
          <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-1 bg-pastel-yellow border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E]">
            YOUR PROFILE
          </span>
        )}
      </div>

      {/* Main Profile Header Card */}
      <div className="card-brutal p-6 sm:p-8 bg-surface border-3 border-border shadow-brutal">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative inline-flex items-center shrink-0">
            <Avatar username={profile.username} size="lg" />
            <div className="absolute bottom-0 right-0 p-0.5 bg-surface rounded-full">
              <OnlineDot username={profile.username} size="md" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-border tracking-tight">
                {profile.username}
              </h1>
              <OnlineBadge username={profile.username} size="sm" />
              {profile.rank > 0 && profile.rank <= 3 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pastel-yellow border border-border text-xs font-display font-black text-border">
                  {profile.rank === 1 ? (
                    <Crown className="w-3.5 h-3.5 text-yellow-600" />
                  ) : (
                    <Medal className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  TOP {profile.rank}
                </span>
              )}
            </div>

            {/* Badges / Rating & Rank */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-pastel-yellow rounded-brutal border-2 border-border shadow-brutal-sm font-display font-black text-xs sm:text-sm text-border">
                <Star className="w-4 h-4 text-border fill-border" />
                <span>{profile.rating} Rating</span>
              </div>

              {profile.rank > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-pastel-purple rounded-brutal border-2 border-border shadow-brutal-sm font-display font-black text-xs sm:text-sm text-border">
                  <Trophy className="w-4 h-4 text-border" />
                  <span>Rank #{profile.rank}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action: 1v1 Challenge */}
          {!isMe && (
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
              <button
                onClick={handleChallenge}
                disabled={isChallenging}
                className="btn-brutal bg-primary px-5 py-3 w-full sm:w-auto font-display font-black text-xs sm:text-sm text-border flex items-center justify-center gap-2 shadow-brutal-sm hover:brightness-105"
              >
                {isChallenging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Room...
                  </>
                ) : (
                  <>
                    <Swords className="w-4 h-4" />
                    Challenge to 1v1
                  </>
                )}
              </button>
              <span className="text-[10px] font-display font-bold text-border/60 mt-1.5 text-center sm:text-right">
                Creates private lobby for direct duel
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pt-2">
            <h2 className="font-display font-black text-2xl text-border uppercase tracking-tight">
              Player Statistics
            </h2>
          </div>

          {stats.gamesPlayed === 0 ? (
            <div className="card-brutal p-8 text-center bg-surface border-3 border-border shadow-brutal">
              <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-1 bg-pastel-yellow border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-2 inline-block">
                NO MATCHES LOGGED
              </span>
              <p className="font-body text-sm text-border/70 mt-2">
                This player hasn&apos;t completed any games yet.
              </p>
            </div>
          ) : (
            <>
              {/* 6-metric stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  icon={<Gamepad2 className="w-5 h-5 text-border" />}
                  label="Games Played"
                  value={stats.gamesPlayed.toString()}
                  accent="yellow"
                />
                <StatCard
                  icon={<Trophy className="w-5 h-5 text-border" />}
                  label="Victories"
                  value={stats.wins.toString()}
                  accent="green"
                />
                <StatCard
                  icon={<Target className="w-5 h-5 text-border" />}
                  label="Defeats"
                  value={stats.losses.toString()}
                  accent="pink"
                />
                <StatCard
                  icon={<Percent className="w-5 h-5 text-border" />}
                  label="Win Rate"
                  value={`${stats.winRate}%`}
                  accent="blue"
                />
                <StatCard
                  icon={<Flame className="w-5 h-5 text-border" />}
                  label="Current Streak"
                  value={stats.currentStreak.toString()}
                  accent="orange"
                />
                <StatCard
                  icon={<Trophy className="w-5 h-5 text-border" />}
                  label="Best Streak"
                  value={stats.bestStreak.toString()}
                  accent="purple"
                />
              </div>

              {/* Guess Distribution Histogram */}
              <div className="card-brutal p-6 bg-surface border-3 border-border shadow-brutal">
                <h3 className="font-display font-black text-lg text-border uppercase tracking-tight mb-4">
                  Guess Distribution
                </h3>
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5, 6].map((attempt) => {
                    const count = stats.guessDistribution[attempt] ?? 0;
                    const width =
                      maxDistribution > 0
                        ? Math.max((count / maxDistribution) * 100, 8)
                        : 8;
                    return (
                      <div key={attempt} className="flex items-center gap-3">
                        <span className="font-display font-black text-sm w-4 text-right text-border">
                          {attempt}
                        </span>
                        <div className="flex-1">
                          <div
                            className="bg-correct text-white text-right px-2.5 py-1 rounded-sm font-display font-black text-xs border-2 border-border shadow-[1px_1px_0px_#1A1A2E] transition-all duration-500"
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
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = "yellow",
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
    orange: "bg-orange-100",
    purple: "bg-pastel-purple",
  };

  return (
    <div
      className={`card-brutal p-4 sm:p-5 border-3 border-border shadow-brutal flex flex-col justify-between ${accentClasses[accent]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-display font-black text-border/70 uppercase tracking-wider">
          {label}
        </span>
        <div className="p-1.5 bg-surface rounded border-2 border-border shadow-[1px_1px_0px_#1A1A2E]">
          {icon}
        </div>
      </div>
      <p className="font-display font-black text-2xl sm:text-3xl text-border tracking-tight">
        {value}
      </p>
    </div>
  );
}
