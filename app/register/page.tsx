'use client';

import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { useEffect } from 'react';
import RegisterView from '@/components/views/RegisterView';

function RegisterContent() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user && !user.isDemo) router.replace('/app');
  }, [router, user]);
  return <RegisterView onSwitchToLogin={() => router.push('/login')} />;
}

export default function RegisterPage() {
  return <AuthProvider><RegisterContent /></AuthProvider>;
}
