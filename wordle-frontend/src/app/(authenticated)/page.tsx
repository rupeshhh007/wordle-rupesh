'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Target, Flame, Trophy, Calendar, Dumbbell, Swords, Star } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getMe } from '@/lib/api/users';
import { getStats } from '@/lib/api/stats';

import type { StatsResponse } from '@/types/api';

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
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="h-4 w-4 animate-bounce rounded-full bg-pastel-pink"></div>
            <div className="h-4 w-4 animate-bounce rounded-full bg-pastel-yellow" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-4 w-4 animate-bounce rounded-full bg-pastel-green" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="font-display font-bold text-lg">Loading your arena...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-brutal p-8 text-center bg-pastel-pink/20 max-w-md mx-auto mt-12">
        <p className="font-display font-bold text-xl text-red-600 mb-2">Oops!</p>
        <p className="font-body text-text-secondary">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-brutal mt-6"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-body text-text-secondary text-lg">Welcome back,</p>
          <h1 className="font-display font-bold text-4xl mt-1">{user?.username || 'Challenger'}</h1>
        </div>
        
        <div className="card-brutal inline-flex items-center gap-2 px-4 py-2 bg-surface">
          <Star className="w-5 h-5 text-pastel-yellow fill-pastel-yellow" />
          <span className="font-display font-bold">Rating:</span>
          <span className="font-body font-black text-xl">{user?.rating || 0}</span>
        </div>
      </div>

      {/* Quick actions row */}
      <section>
        <h2 className="font-display font-bold text-2xl mb-4">Quick Play</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/daily"
            className="card-brutal p-6 bg-pastel-yellow hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg transition-all flex flex-col items-start gap-4"
          >
            <div className="p-3 bg-surface border-3 border-border rounded-brutal shadow-brutal-sm">
              <Calendar className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl">Daily Challenge</h3>
              <p className="font-body text-sm text-text-secondary mt-1">Today&apos;s word awaits</p>
            </div>
          </Link>
          
          <Link 
            href="/practice"
            className="card-brutal p-6 bg-pastel-green hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg transition-all flex flex-col items-start gap-4"
          >
            <div className="p-3 bg-surface border-3 border-border rounded-brutal shadow-brutal-sm">
              <Dumbbell className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl">Practice Mode</h3>
              <p className="font-body text-sm text-text-secondary mt-1">Sharpen your skills</p>
            </div>
          </Link>
          
          <Link 
            href="/arena"
            className="card-brutal p-6 bg-pastel-pink hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg transition-all flex flex-col items-start gap-4"
          >
            <div className="p-3 bg-surface border-3 border-border rounded-brutal shadow-brutal-sm">
              <Swords className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl">Enter Arena</h3>
              <p className="font-body text-sm text-text-secondary mt-1">Challenge other players</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <section>
        <h2 className="font-display font-bold text-2xl mb-4">Your Stats</h2>
        {stats?.gamesPlayed === 0 ? (
          <div className="card-brutal p-8 text-center bg-surface border-dashed border-4 border-border/20">
            <p className="font-display font-bold text-lg text-text-secondary">Play your first game to start building your stats.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-brutal p-5 bg-surface flex flex-col gap-2 relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-text-secondary" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Games Played</span>
              </div>
              <p className="font-display font-black text-3xl mt-2">{stats?.gamesPlayed || 0}</p>
            </div>
            
            <div className="card-brutal p-5 bg-surface flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-text-secondary" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Win Rate</span>
              </div>
              <p className="font-display font-black text-3xl mt-2">{stats?.winRate || 0}%</p>
            </div>
            
            <div className="card-brutal p-5 bg-surface flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Current Streak</span>
              </div>
              <p className="font-display font-black text-3xl mt-2">{stats?.currentStreak || 0} <span className="text-xl font-body text-text-secondary font-medium">days</span></p>
            </div>
            
            <div className="card-brutal p-5 bg-surface flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-display text-sm text-text-secondary uppercase font-bold tracking-wider">Best Streak</span>
              </div>
              <p className="font-display font-black text-3xl mt-2">{stats?.bestStreak || 0} <span className="text-xl font-body text-text-secondary font-medium">days</span></p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
