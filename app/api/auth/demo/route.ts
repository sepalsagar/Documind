import { NextRequest, NextResponse } from 'next/server';
import { createDemoUser } from '@/lib/store';
import { signToken } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rate-limit';
import { getVercelClientIp } from '@/lib/request';

export async function POST(req: NextRequest) {
  const rate = await consumeRateLimit(`demo:create:${getVercelClientIp(req)}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Demo limit reached for this network. Please create a free account to continue.' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }

  try {
    const demo = await createDemoUser();
    const token = signToken({
      userId: demo.id,
      email: demo.email,
      name: demo.name,
      isDemo: true,
      expiresAt: demo.expiresAt.getTime(),
    });
    const response = NextResponse.json({
      success: true,
      user: { id: demo.id, name: demo.name, email: demo.email, isDemo: true },
      documentId: demo.documentId,
    });
    response.cookies.set('documind_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Demo creation error:', error);
    return NextResponse.json({ error: 'The demo is temporarily unavailable. Please try again or create an account.' }, { status: 503 });
  }
}
