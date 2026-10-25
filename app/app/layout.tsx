import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().then((store) => store.get('documind_token')?.value);
  return <AppGate tokenPromise={token}>{children}</AppGate>;
}

async function AppGate({ children, tokenPromise }: { children: React.ReactNode; tokenPromise: Promise<string | undefined> }) {
  const token = await tokenPromise;
  if (!token || !verifyToken(token)) redirect('/login');
  return children;
}
