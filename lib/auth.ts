import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

interface AuthPayload { id: string; email?: string }

export const AUTH_COOKIE_NAME = 'auth_token';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function createAuthToken(user: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not configured.');
  return jwt.sign(user, secret, { expiresIn: AUTH_COOKIE_MAX_AGE });
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: AUTH_COOKIE_MAX_AGE,
};

/** Reads the signed session token only from the request cookie. */
export async function getAuthUser(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value || request.cookies.get('token')?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const payload = jwt.verify(token, secret);
    if (!payload || typeof payload === 'string' || typeof payload.id !== 'string') return null;
    return { id: payload.id, email: typeof payload.email === 'string' ? payload.email : undefined };
  } catch { return null; }
}
