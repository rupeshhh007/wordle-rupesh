'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, BarChart3, Calendar, Dumbbell, Flame, Percent, Swords, Trophy } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getMe } from '@/lib/api/users';
import { getStats } from '@/lib/api/stats';

import type { StatsResponse } from '@/types/api';
import { LoadingState } from '@/components/ui/LoadingState';

const tileRows = [
  [
    { letter: 'A', tone: 'bg-surface text-border' },
    { letter: 'R', tone: 'bg-present text-border' },
    { letter: 'E', tone: 'bg-surface text-border' },
    { letter: 'N', tone: 'bg-correct text-white' },
    { letter: 'A', tone: 'bg-surface text-border' },
  ],
  [
    { letter: 'W', tone: 'bg-correct text-white' },
    { letter: 'O', tone: 'bg-correct text-white' },
    { letter: 'R', tone: 'bg-present text-border' },
    { letter: 'D', tone: 'bg-absent text-white' },
    { letter: 'S', tone: 'bg-correct text-white' },
  ],
];

const modeCards = [
  {
    href: '/daily',
    title: 'Daily Challenge',
    label: 'Daily',
    description: 'One shared puzzle, one clean shot at the board.',
    icon: Calendar,
    accent: 'bg-primary',
    shadow: 'shadow-[8px_8px_0px_#1A1A2E]',
    cta: 'Play today',
  },
  {
    href: '/practice',
    title: 'Practice Lab',
    label: 'Train',
    description: 'Unlimited rounds for testing openers and patterns.',
    icon: Dumbbell,
    accent: 'bg-correct',
    shadow: 'shadow-[8px_8px_0px_#1A1A2E]',
    cta: 'Start drill',
  },
  {
    href: '/arena',
    title: 'Arena Duel',
    label: 'Ranked',
    description: 'Queue up, race the same answer, and move the rating.',
    icon: Swords,
    accent: 'bg-pastel-pink',
    shadow: 'shadow-[8px_8px_0px_#1A1A2E]',
    cta: 'Find rival',
  },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [meData, statsData] = await Promise.all([
          getMe(),
          getStats()
        ]);
        setUser(meData);
        setStats(statsData);
      } catch (err: any) {
        setError('Failed to load your arena data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [setUser]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingState message="Loading your arena..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-brutal p-8 text-center bg-pastel-pink/20 max-w-md mx-auto mt-12 border-3 border-border shadow-brutal">
        <p className="font-display font-bold text-xl text-danger mb-2">Oops!</p>
        <p className="font-body text-text-secondary">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-brutal mt-6 bg-surface px-6 py-2 text-border font-bold text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-7 p-3 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-sm border-3 border-border bg-surface shadow-[10px_10px_0px_#1A1A2E]">
        <div className="grid lg:grid-cols-[1fr_360px]">
          <div className="bg-primary p-5 sm:p-8 lg:p-10">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="rounded-sm border-3 border-border bg-surface px-3 py-1 font-display text-xs font-black uppercase text-border shadow-brutal-sm">
                Home Board
              </span>
              <span className="rounded-sm border-3 border-border bg-border px-3 py-1 font-display text-xs font-black uppercase text-white shadow-brutal-sm">
                Live Profile
              </span>
            </div>

            <p className="font-display text-sm font-black uppercase text-border/70">
              Welcome back
            </p>
            <h1 className="mt-1 max-w-3xl break-words font-display text-4xl font-black leading-none tracking-tight text-border sm:text-6xl lg:text-7xl">
              {user?.username || 'Challenger'}
            </h1>
            <p className="mt-5 max-w-xl font-body text-base font-bold leading-7 text-border/80">
              Choose the next run: solve the daily, warm up in practice, or step into a real-time 1v1.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/arena"
                className="btn-brutal inline-flex items-center gap-2 bg-border px-5 py-3 text-sm font-black uppercase text-white"
              >
                Enter Arena
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/daily"
                className="btn-brutal inline-flex items-center gap-2 bg-surface px-5 py-3 text-sm font-black uppercase text-border"
              >
                Daily Puzzle
                <Calendar className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border-t-3 border-border bg-pastel-blue p-5 lg:border-l-3 lg:border-t-0 lg:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-xs font-black uppercase text-border/60">
                  Rating
                </p>
                <p className="font-display text-5xl font-black leading-none text-border">
                  {user?.rating || 1000}
                </p>
              </div>
              <Trophy className="h-12 w-12 text-border" strokeWidth={2.5} />
            </div>

            <div className="grid gap-2" aria-hidden="true">
              {tileRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-2">
                  {row.map((tile, index) => (
                    <span
                      key={`${rowIndex}-${tile.letter}-${index}`}
                      className={`grid aspect-square place-items-center rounded-sm border-3 border-border font-display text-xl font-black shadow-brutal-sm sm:text-2xl ${tile.tone}`}
                    >
                      {tile.letter}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid border-t-3 border-border bg-surface sm:grid-cols-3">
          <div className="border-b-3 border-border p-4 sm:border-b-0 sm:border-r-3">
            <p className="font-display text-xs font-black uppercase text-border/50">Games</p>
            <p className="font-display text-3xl font-black text-border">{stats?.gamesPlayed || 0}</p>
          </div>
          <div className="border-b-3 border-border p-4 sm:border-b-0 sm:border-r-3">
            <p className="font-display text-xs font-black uppercase text-border/50">Win Rate</p>
            <p className="font-display text-3xl font-black text-border">{stats?.winRate || 0}%</p>
          </div>
          <div className="p-4">
            <p className="font-display text-xs font-black uppercase text-border/50">Current Streak</p>
            <p className="font-display text-3xl font-black text-border">{stats?.currentStreak || 0}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs font-black uppercase text-border/50">Pick your lane</p>
            <h2 className="font-display text-2xl font-black uppercase tracking-wide text-border">Game Modes</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modeCards.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className={`group flex min-h-[230px] flex-col justify-between rounded-sm border-3 border-border ${mode.accent} p-5 transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#1A1A2E] active:translate-x-1 active:translate-y-1 active:shadow-none ${mode.shadow}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-sm border-3 border-border bg-surface p-3 shadow-brutal-sm">
                    <Icon className="h-7 w-7 text-border" strokeWidth={2.5} />
                  </div>
                  <span className="rounded-sm border-3 border-border bg-surface px-2.5 py-1 font-display text-xs font-black uppercase text-border shadow-brutal-sm">
                    0{index + 1}
                  </span>
                </div>

                <div>
                  <p className="mb-2 inline-flex rounded-sm border-2 border-border bg-border px-2 py-0.5 font-display text-[11px] font-black uppercase text-white">
                    {mode.label}
                  </p>
                  <h3 className="font-display text-3xl font-black leading-none text-border">
                    {mode.title}
                  </h3>
                  <p className="mt-3 font-body text-sm font-bold leading-6 text-border/75">
                    {mode.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t-3 border-border pt-4 font-display text-sm font-black uppercase text-border">
                  <span>{mode.cta}</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs font-black uppercase text-border/50">Your numbers</p>
            <h2 className="font-display text-2xl font-black uppercase tracking-wide text-border">Performance</h2>
          </div>
        </div>
        {stats?.gamesPlayed === 0 ? (
          <div className="rounded-sm border-3 border-dashed border-border bg-surface p-7 text-center shadow-brutal">
            <span className="inline-flex rounded-sm border-2 border-border bg-pastel-yellow px-3 py-1 font-display text-xs font-black uppercase text-border shadow-brutal-sm">
              Fresh Board
            </span>
            <h3 className="mt-4 font-display text-3xl font-black text-border">No games logged yet</h3>
            <p className="mx-auto mt-2 max-w-md font-body text-sm font-semibold text-border/70">
              Start with the daily puzzle or jump into practice to put your first marks on the board.
            </p>
            <Link href="/daily" className="btn-brutal mt-5 inline-flex bg-primary px-6 py-2.5 text-sm font-black uppercase text-border">
              Play Daily Wordle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-sm border-3 border-border bg-surface p-5 shadow-brutal">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-border/60" />
                <span className="font-display text-xs font-black uppercase text-border/50">Games</span>
              </div>
              <p className="mt-2 font-display text-4xl font-black text-border">{stats?.gamesPlayed || 0}</p>
            </div>
            
            <div className="rounded-sm border-3 border-border bg-pastel-blue p-5 shadow-brutal">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-border/60" />
                <span className="font-display text-xs font-black uppercase text-border/50">Win Rate</span>
              </div>
              <p className="mt-2 font-display text-4xl font-black text-border">{stats?.winRate || 0}%</p>
            </div>
            
            <div className="rounded-sm border-3 border-border bg-pastel-orange p-5 shadow-brutal">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-border/60" />
                <span className="font-display text-xs font-black uppercase text-border/50">Current</span>
              </div>
              <p className="mt-2 font-display text-4xl font-black text-border">{stats?.currentStreak || 0}</p>
            </div>
            
            <div className="rounded-sm border-3 border-border bg-pastel-green p-5 shadow-brutal">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-border/60" />
                <span className="font-display text-xs font-black uppercase text-border/50">Best</span>
              </div>
              <p className="mt-2 font-display text-4xl font-black text-border">{stats?.bestStreak || 0}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
