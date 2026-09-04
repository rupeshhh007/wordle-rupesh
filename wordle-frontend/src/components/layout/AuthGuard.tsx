'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        setIsReady(true);
      }
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || !isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center">
            <h1 className="font-display text-4xl font-black text-border">WORDLE</h1>
            <h2 className="font-display text-2xl font-black text-primary">ARENA</h2>
          </div>
          <p className="font-body text-border font-semibold animate-pulse mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
