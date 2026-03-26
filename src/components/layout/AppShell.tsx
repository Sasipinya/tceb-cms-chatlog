'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => { if (status === 'unauthenticated') router.replace('/login'); }, [status, router]);

  if (status === 'loading') return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--navy)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)' }}>
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );

  if (status === 'unauthenticated') return null;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--navy)' }}>
      <Sidebar />
      <main className="flex-1 pl-64 min-h-screen">
        <div className="mx-auto max-w-screen-xl px-6 py-6 fade-up">
          {children}
        </div>
      </main>
    </div>
  );
}