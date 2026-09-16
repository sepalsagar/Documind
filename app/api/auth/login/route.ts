import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { toAuthErrorResponse } from '@/lib/api-errors';
import { authCookieOptions, AUTH_COOKIE_NAME, createAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

// Authentication needs Node APIs (bcrypt, JWT) and must never be served from a cache.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 422 });
    await connectToDatabase();
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    const response = NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
    response.cookies.set(AUTH_COOKIE_NAME, createAuthToken({ id: user._id.toString(), email: user.email }), authCookieOptions);
    return response;
  } catch (error) {
    console.error('Login failed', error);
    return toAuthErrorResponse(error, 'Unable to sign in.');
  }
}
