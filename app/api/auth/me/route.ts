import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.isDemo) {
      if (!authUser.expiresAt || authUser.expiresAt <= Date.now()) {
        const response = NextResponse.json({ error: 'Demo expired' }, { status: 401 });
        response.cookies.set('documind_token', '', { httpOnly: true, maxAge: 0, path: '/' });
        return response;
      }
      const { findUserById } = await import('@/lib/store');
      const user = await findUserById(authUser.userId);
      if (!user) {
        const response = NextResponse.json({ error: 'Demo expired' }, { status: 401 });
        response.cookies.set('documind_token', '', { httpOnly: true, maxAge: 0, path: '/' });
        return response;
      }
    }

    return NextResponse.json({
      user: {
        id: authUser.userId,
        name: authUser.name,
        email: authUser.email,
        isDemo: Boolean(authUser.isDemo),
        expiresAt: authUser.expiresAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
