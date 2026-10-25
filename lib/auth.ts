import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// This value must exist only in the server environment. Do not use a client
// exposed NEXT_PUBLIC_ variable or a source-controlled fallback.
const JWT_SECRET = process.env.JWT_SECRET;

function jwtSecret(): string {
  if (!JWT_SECRET || JWT_SECRET === '<generate-a-strong-random-secret-here>') {
    throw new Error('JWT_SECRET must be configured with a strong secret.');
  }
  return JWT_SECRET;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  isDemo?: boolean;
  expiresAt?: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret()) as TokenPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest | Request): string | null {
  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    // Client components can rely on the secure session cookie and may send an
    // empty placeholder header.  Let the cookie be considered in that case.
    if (bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined') {
      return bearerToken;
    }
  }

  // 2. Check cookies
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/documind_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

export function getUserFromRequest(req: NextRequest | Request): TokenPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
