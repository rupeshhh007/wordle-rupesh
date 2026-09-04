'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Swords, BarChart3, User } from 'lucide-react';

const MOBILE_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/daily', label: 'Daily', icon: Calendar },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

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
              className={`flex flex-col items-center gap-0.5 p-1 ${
                isActive ? 'text-primary' : 'text-border/60 hover:text-border'
              }`}
            >
              <Icon size={24} className={isActive ? 'text-border' : ''} />
              <span className={`text-[10px] font-display font-semibold ${isActive ? 'text-border' : ''}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
