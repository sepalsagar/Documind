'use client';

import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { useEffect } from 'react';
import LoginView from '@/components/views/LoginView';

function LoginContent() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user && !user.isDemo) router.replace('/app');
  }, [router, user]);
  return <LoginView onSwitchToRegister={() => router.push('/register')} />;
}

export default function LoginPage() {
  return <AuthProvider><LoginContent /></AuthProvider>;
}
