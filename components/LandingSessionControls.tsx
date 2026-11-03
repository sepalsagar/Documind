'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Play } from 'lucide-react';
import { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';

function Controls({ location }: { location: 'header' | 'hero' }) {
  const router = useRouter();
  const { user, loading, demo, logout } = useAuth();
  const [demoError, setDemoError] = useState<string | null>(null);
  const [startingDemo, setStartingDemo] = useState(false);
  const startDemo = async () => {
    setStartingDemo(true); setDemoError(null);
    const result = await demo();
    if (result.success) router.replace('/app'); else setDemoError(result.error || 'Unable to start the demo.');
    setStartingDemo(false);
  };

  if (loading) {
    return <span className={location === 'header' ? 'h-9 w-28 animate-pulse rounded-lg bg-slate-800' : 'h-12 w-36 animate-pulse rounded-xl bg-slate-800'} aria-hidden="true" />;
  }

  if (user?.isDemo) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => router.push('/app')} className={location === 'header' ? 'rounded-lg bg-[#3730a3] px-4 py-2 text-sm font-medium text-white hover:bg-[#312e81]' : 'inline-flex h-12 items-center gap-2 rounded-lg bg-[#3730a3] px-5 text-sm font-medium text-white hover:bg-[#312e81]'}>
          Continue demo
        </button>
        <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#5e554a] hover:bg-[#efe9df] hover:text-[#1f1b16]">
          <LogOut className="h-4 w-4" aria-hidden="true" /> End demo
        </button>
      </div>
    );
  }

  if (user) {
    return <button type="button" onClick={() => router.push('/app')} className="rounded-lg bg-[#3730a3] px-4 py-2 text-sm font-medium text-white hover:bg-[#312e81]">Open workspace</button>;
  }

  if (location === 'hero') {
    return (
      <div><button type="button" onClick={() => void startDemo()} disabled={startingDemo} className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#3730a3]/30 px-5 text-sm font-medium text-[#3730a3] hover:bg-[#eef2ff] disabled:opacity-60">{startingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Explore a demo</button>{demoError && <p role="alert" className="mt-2 max-w-xs text-xs text-rose-700">{demoError}</p>}</div>
    );
  }

  return (
    <div className="landing-session-actions"><Link href="/login">Sign in</Link><Link href="/register" className="landing-signup">Sign up</Link><button type="button" onClick={() => void startDemo()} disabled={startingDemo} className="hidden sm:inline-flex">{startingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Explore demo'}</button>{demoError && <span role="alert" className="sr-only">{demoError}</span>}</div>
  );
}

export default function LandingSessionControls({ location }: { location: 'header' | 'hero' }) {
  return <AuthProvider><Controls location={location} /></AuthProvider>;
}
