'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';

function DemoButtonAction({ className = '' }: { className?: string }) {
  const { demo } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await demo();
    if (result.success) router.push('/app');
    setLoading(false);
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      {loading ? 'Starting demo…' : 'Try the demo'}
    </button>
  );
}

export default function DemoButton({ className = '' }: { className?: string }) {
  return <AuthProvider><DemoButtonAction className={className} /></AuthProvider>;
}
