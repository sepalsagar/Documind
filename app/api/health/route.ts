import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, hasMongoUri, isMongoConnected } from '@/lib/db';
import { consumeRateLimit } from '@/lib/rate-limit';
import { getVercelClientIp } from '@/lib/request';
import { UserModel } from '@/models/User';
import { DocumentModel } from '@/models/Document';
import { MessageModel } from '@/models/Message';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const rate = await consumeRateLimit(`health:${getVercelClientIp(request)}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many health checks.' }, {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      });
    }
  } catch (error) {
    console.error('Health rate limiter unavailable:', error);
  }

  const started = Date.now();
  let dbStatus: 'connected' | 'error' = 'error';
  let pingMs: number | null = null;
  let users = 0;
  let documents = 0;
  let messages = 0;

  try {
    const db = await connectToDatabase();
    if (db && isMongoConnected()) {
      const pingStarted = Date.now();
      await db.connection.db?.command({ ping: 1 });
      pingMs = Date.now() - pingStarted;
      [users, documents, messages] = await Promise.all([
        UserModel.countDocuments(),
        DocumentModel.countDocuments(),
        MessageModel.countDocuments(),
      ]);
      dbStatus = 'connected';
    }
  } catch (error) {
    console.error('Health check database failure:', error);
  }

  return NextResponse.json({
    db: { status: dbStatus, pingMs },
    counts: { users, documents, messages },
    hasMongoUri: hasMongoUri(),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    vercelRegion: process.env.VERCEL_REGION || null,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    responseMs: Date.now() - started,
  }, {
    status: dbStatus === 'connected' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
