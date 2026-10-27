'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/AuthContext';

function Controls({ location }: { location: 'header' | 'hero' }) {
  const router = useRouter();
  const { user, loading, demo, logout } = useAuth();

  if (loading) {
    return <span className={location === 'header' ? 'h-9 w-28 animate-pulse rounded-lg bg-slate-800' : 'h-12 w-36 animate-pulse rounded-xl bg-slate-800'} aria-hidden="true" />;
  }

  if (user?.isDemo) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => router.push('/app')} className={location === 'header' ? 'rounded-lg bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300' : 'inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3.5 text-sm font-bold text-slate-950 hover:bg-teal-300'}>
          Continue demo
        </button>
        <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden="true" /> End demo
        </button>
      </div>
    );
  }

  if (user) {
    return <button type="button" onClick={() => router.push('/app')} className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300">Open workspace</button>;
  }

  if (location === 'hero') {
    return (
      <button type="button" onClick={() => void demo().then((result) => { if (result.success) router.push('/app'); })} className="inline-flex items-center gap-2 rounded-xl border border-teal-400/40 px-5 py-3.5 text-sm font-bold text-teal-200 hover:bg-teal-400/10">
        <Sparkles className="h-4 w-4" aria-hidden="true" /> Try the demo
      </button>
    );
  }

  return (
    <>
      <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white">Sign in</Link>
      <Link href="/register" className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300">Sign up</Link>
      <button type="button" onClick={() => void demo().then((result) => { if (result.success) router.push('/app'); })} className="hidden rounded-lg border border-teal-400/40 px-3 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-400/10 sm:inline-flex">
        Try the demo
      </button>
    </>
  );
}

export default function LandingSessionControls({ location }: { location: 'header' | 'hero' }) {
  return <AuthProvider><Controls location={location} /></AuthProvider>;
}
