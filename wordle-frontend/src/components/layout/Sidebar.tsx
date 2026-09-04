'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Dumbbell, Swords, BarChart3, Trophy, Clock, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const PLAY_LINKS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/daily', label: 'Daily', icon: Calendar },
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/arena', label: 'Arena', icon: Swords },
];

const TRACK_LINKS = [
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/history', label: 'History', icon: Clock },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="hidden lg:flex w-64 h-full flex-col bg-surface border-r-3 border-border">
      <div className="p-6 border-b-3 border-border">
        <div className="flex flex-col">
          <span className="text-2xl font-display font-black text-border leading-none">WORDLE</span>
          <span className="text-2xl font-display font-black text-primary leading-none">ARENA</span>
          <div className="h-1 w-12 bg-border mt-1"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        <div>
          <h3 className="text-xs font-display font-bold text-border/60 uppercase tracking-wider mb-3 px-4">Play</h3>
          <nav className="space-y-1">
            {PLAY_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 py-2.5 px-4 rounded-brutal font-display font-semibold transition-colors ${
                    isActive ? 'bg-primary text-border' : 'text-border hover:bg-primary/20'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-border' : 'text-border/70'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <h3 className="text-xs font-display font-bold text-border/60 uppercase tracking-wider mb-3 px-4">Track</h3>
          <nav className="space-y-1">
            {TRACK_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 py-2.5 px-4 rounded-brutal font-display font-semibold transition-colors ${
                    isActive ? 'bg-primary text-border' : 'text-border hover:bg-primary/20'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-border' : 'text-border/70'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t-3 border-border bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-pastel-yellow border-2 border-border flex items-center justify-center shadow-brutal text-lg font-display font-black">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm text-border leading-tight">
                {user?.username || 'User'}
              </span>
              <span className="text-xs font-body font-medium bg-pastel-purple border border-border px-1.5 rounded-sm inline-block mt-0.5">
                Rating: {user?.rating || 1000}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-brutal font-display font-bold text-sm bg-pastel-pink border-2 border-border shadow-[2px_2px_0px_#1A1A2E] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
