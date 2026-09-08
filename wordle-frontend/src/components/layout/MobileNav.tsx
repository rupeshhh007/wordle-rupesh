'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Swords, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar } from '@/components/ui/Avatar';

const MOBILE_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/daily', label: 'Daily', icon: Calendar },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t-3 border-border z-50">
      <div className="flex justify-around items-center px-2 py-2">
        {MOBILE_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 p-1 transition-all ${
                isActive ? 'text-border' : 'text-border/60 hover:text-border'
              }`}
            >
              <div className={`p-1 rounded-md transition-all ${isActive ? 'bg-primary border border-border shadow-[1px_1px_0px_#1A1A2E] -translate-y-0.5' : ''}`}>
                <Icon size={20} className="text-border" />
              </div>
              <span className={`text-xs font-display ${isActive ? 'font-bold text-border' : 'font-semibold'}`}>
                {link.label}
              </span>
            </Link>
          );
        })}

        {/* Profile tab with Avatar */}
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 p-1 transition-all ${
            pathname === '/profile' ? 'text-border' : 'text-border/60 hover:text-border'
          }`}
        >
          <div className={`p-0.5 rounded-md transition-all ${pathname === '/profile' ? '-translate-y-0.5' : ''}`}>
            <Avatar username={user?.username || 'U'} size="sm" />
          </div>
          <span className={`text-xs font-display ${pathname === '/profile' ? 'font-bold text-border' : 'font-semibold'}`}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
