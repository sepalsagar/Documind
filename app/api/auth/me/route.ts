import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { elapsed, logTiming, serverTiming } from '@/lib/timing';

export async function GET(req: NextRequest) {
  const started = performance.now();
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('Server-Timing', serverTiming({ verify: elapsed(started), total: elapsed(started) }));
      return response;
    }

    if (authUser.isDemo) {
      if (!authUser.expiresAt || authUser.expiresAt <= Date.now()) {
        const response = NextResponse.json({ error: 'Demo expired' }, { status: 401 });
        response.cookies.set('documind_token', '', { httpOnly: true, maxAge: 0, path: '/' });
        response.headers.set('Server-Timing', serverTiming({ verify: elapsed(started), db: elapsed(started), total: elapsed(started) }));
        return response;
      }
      const { findUserById } = await import('@/lib/store');
      const user = await findUserById(authUser.userId);
      if (!user) {
        const response = NextResponse.json({ error: 'Demo expired' }, { status: 401 });
        response.cookies.set('documind_token', '', { httpOnly: true, maxAge: 0, path: '/' });
        response.headers.set('Server-Timing', serverTiming({ verify: elapsed(started), db: elapsed(started), total: elapsed(started) }));
        return response;
      }
    }

    const response = NextResponse.json({
      user: {
        id: authUser.userId,
        name: authUser.name,
        email: authUser.email,
        isDemo: Boolean(authUser.isDemo),
        expiresAt: authUser.expiresAt,
      },
    });
    const timings = { verify: elapsed(started), total: elapsed(started) };
    response.headers.set('Server-Timing', serverTiming(timings));
    logTiming('/api/auth/me', timings);
    return response;
  } catch (error: any) {
    const response = NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
    response.headers.set('Server-Timing', serverTiming({ total: elapsed(started) }));
    return response;
  }
}
