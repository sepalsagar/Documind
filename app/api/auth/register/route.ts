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
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (name.length < 2 || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      return NextResponse.json({ error: 'Please provide a valid name, email, and password of at least 8 characters.' }, { status: 422 });
    }
    await connectToDatabase();
    if (await User.exists({ email })) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    const response = NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email } }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, createAuthToken({ id: user._id.toString(), email: user.email }), authCookieOptions);
    return response;
  } catch (error) {
    console.error('Registration failed', error);
    return toAuthErrorResponse(error, 'Unable to create account.');
  }
}
