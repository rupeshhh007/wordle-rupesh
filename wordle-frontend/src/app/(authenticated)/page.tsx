'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Target, Flame, Trophy, Calendar, Dumbbell, Swords, Star, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getMe } from '@/lib/api/users';
import { getStats } from '@/lib/api/stats';

import type { StatsResponse } from '@/types/api';
import { LoadingState } from '@/components/ui/LoadingState';

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
    <div className="flex flex-col gap-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
      {/* Welcome header */}
      <div className="paper-lift isolate card-brutal bg-surface">
        <div className="ink-strip h-3 border-b-3 border-border" aria-hidden="true" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 sm:p-7">
          <div className="min-w-0">
            <span className="stamp-brutal bg-pastel-blue px-3 py-1 text-[11px] text-border">
              <Zap className="h-3.5 w-3.5" />
              Player Dashboard
            </span>
            <h1 className="font-display font-black text-3xl sm:text-5xl mt-3 text-border tracking-tight break-words">
              {user?.username || 'Challenger'}
            </h1>
            <p className="font-body text-sm font-semibold text-border/70 mt-2 max-w-xl">
              Pick a mode, protect your streak, and keep your rating climbing.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2 shrink-0" aria-hidden="true">
            {['W', 'O', 'R', 'D', 'S'].map((letter, index) => (
              <span
                key={letter}
                className={`grid h-11 w-11 place-items-center rounded-sm border-3 border-border font-display text-xl font-black shadow-brutal-sm ${
                  index === 0 || index === 3
                    ? 'bg-correct text-white'
                    : index === 1
                      ? 'bg-present text-border'
                      : 'bg-surface text-border'
                }`}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
        <div className="border-t-3 border-border bg-pastel-yellow px-5 py-3 sm:px-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-border fill-primary" />
            <span className="font-display font-black text-xs uppercase text-border/70">Current Rating</span>
            <span className="font-display font-black text-2xl text-border leading-none">{user?.rating || 0}</span>
          </div>
          <div className="font-display text-xs font-black uppercase text-border/70">
            {stats?.gamesPlayed || 0} logged games
          </div>
        </div>
      </div>

      {/* Quick actions row */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-black text-xl text-border uppercase tracking-wide">Game Modes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/daily"
            className="card-brutal card-interactive bg-pastel-yellow flex flex-col justify-between group min-h-[205px] overflow-hidden"
          >
            <div className="ink-strip h-2 border-b-3 border-border opacity-90" aria-hidden="true" />
            <div className="p-6 flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between w-full">
                <div className="p-3 bg-surface border-3 border-border rounded-brutal shadow-brutal-sm group-hover:scale-105 transition-transform duration-200">
                  <Calendar className="w-7 h-7 text-border" />
                </div>
                <span className="px-2.5 py-0.5 rounded-sm bg-surface border-2 border-border text-xs font-display font-black tracking-wider uppercase text-border shadow-[1px_1px_0px_#1A1A2E]">
                  TODAY&apos;S PUZZLE
                </span>
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-border">Daily Challenge</h3>
                <p className="font-body text-xs text-border/70 mt-1 font-medium">One global word every 24 hours</p>
                <div className="mt-3 font-display font-bold text-xs text-border group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Play Challenge &rarr;
                </div>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/practice"
            className="card-brutal card-interactive bg-pastel-green flex flex-col justify-between group min-h-[205px] overflow-hidden"
          >
            <div className="ink-strip h-2 border-b-3 border-border opacity-90" aria-hidden="true" />
            <div className="p-6 flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between w-full">
                <div className="p-3 bg-surface border-3 border-border rounded-brutal shadow-brutal-sm group-hover:scale-105 transition-transform duration-200">
                  <Dumbbell className="w-7 h-7 text-border" />
                </div>
                <span className="px-2.5 py-0.5 rounded-sm bg-surface border-2 border-border text-xs font-display font-black tracking-wider uppercase text-border shadow-[1px_1px_0px_#1A1A2E]">
                  UNLIMITED
                </span>
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-border">Practice Mode</h3>
                <p className="font-body text-xs text-border/70 mt-1 font-medium">Unlimited rounds to train instincts</p>
                <div className="mt-3 font-display font-bold text-xs text-border group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Start Session &rarr;
                </div>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/arena"
            className="card-brutal card-interactive bg-pastel-pink flex flex-col justify-between group min-h-[205px] overflow-hidden"
          >
            <div className="ink-strip h-2 border-b-3 border-border opacity-90" aria-hidden="true" />
            <div className="p-6 flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between w-full">
                <div className="p-3 bg-surface border-3 border-border rounded-brutal shadow-brutal-sm group-hover:scale-105 transition-transform duration-200">
                  <Swords className="w-7 h-7 text-border" />
                </div>
                <span className="px-2.5 py-0.5 rounded-sm bg-surface border-2 border-border text-xs font-display font-black tracking-wider uppercase text-border shadow-[1px_1px_0px_#1A1A2E]">
                  1V1 RANKED
                </span>
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-border">Arena 1v1</h3>
                <p className="font-body text-xs text-border/70 mt-1 font-medium">Real-time duel for Elo rating</p>
                <div className="mt-3 font-display font-bold text-xs text-border group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Find Opponent &rarr;
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-black text-xl text-border uppercase tracking-wide">Performance Overview</h2>
        </div>
        {stats?.gamesPlayed === 0 ? (
          <div className="card-brutal p-8 text-center bg-surface border-dashed border-3 border-border/40 flex flex-col items-center gap-3">
            <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-1 bg-pastel-yellow border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E]">
              NO MATCHES LOGGED YET
            </span>
            <h3 className="font-display font-black text-2xl text-border mt-1">Ready for your first challenge?</h3>
            <p className="font-body text-text-secondary text-sm max-w-sm">
              Play today&apos;s Daily Wordle or jump into Practice mode to build your stats.
            </p>
            <Link href="/daily" className="btn-brutal bg-primary px-6 py-2.5 text-sm font-bold mt-2 text-border">
              Play Daily Wordle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-brutal card-interactive p-5 bg-surface flex flex-col gap-2 relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-text-secondary" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Games Played</span>
              </div>
              <p className="font-display font-black text-3xl mt-2 text-border">{stats?.gamesPlayed || 0}</p>
            </div>
            
            <div className="card-brutal card-interactive p-5 bg-surface flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-text-secondary" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Win Rate</span>
              </div>
              <p className="font-display font-black text-3xl mt-2 text-border">{stats?.winRate || 0}%</p>
            </div>
            
            <div className="card-brutal card-interactive p-5 bg-surface flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Current Streak</span>
              </div>
              <p className="font-display font-black text-3xl mt-2 text-border">{stats?.currentStreak || 0} <span className="text-xl font-body text-text-secondary font-medium">days</span></p>
            </div>
            
            <div className="card-brutal card-interactive p-5 bg-surface flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Best Streak</span>
              </div>
              <p className="font-display font-black text-3xl mt-2 text-border">{stats?.bestStreak || 0} <span className="text-xl font-body text-text-secondary font-medium">days</span></p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
