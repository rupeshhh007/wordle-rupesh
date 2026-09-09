'use client';

import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { ChallengeNotificationToast } from '@/components/notifications/ChallengeNotificationToast';
import { PresenceListener } from '@/components/presence/PresenceListener';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-bg">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
        <MobileNav />
        <ChallengeNotificationToast />
        <PresenceListener />
      </div>
    </AuthGuard>
  );
}
