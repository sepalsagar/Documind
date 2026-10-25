import { connectToDatabase, isProductionEnvironment } from './db';
import { RateLimitCounterModel } from '../models/RateLimitCounter';

interface MemoryCounter {
  count: number;
  expiresAt: number;
}

declare global {
  var documindRateLimits: Map<string, MemoryCounter> | undefined;
}

const memoryCounters = global.documindRateLimits ??= new Map();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const expiresAt = new Date(now + windowMs);
  const db = await connectToDatabase();

  if (db) {
    try {
      const current = await RateLimitCounterModel.findOneAndUpdate(
        { key, expiresAt: { $gt: new Date(now) } },
        { $inc: { count: 1 }, $setOnInsert: { key, expiresAt } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      const count = current?.count ?? 1;
      return {
        allowed: count <= limit,
        retryAfterSeconds: Math.max(1, Math.ceil(((current?.expiresAt?.getTime() ?? expiresAt.getTime()) - now) / 1000)),
      };
    } catch (error) {
      console.warn('MongoDB rate limiter unavailable; using local fallback:', error);
      if (isProductionEnvironment()) throw error;
    }
  }

  const existing = memoryCounters.get(key);
  const counter = existing && existing.expiresAt > now
    ? existing
    : { count: 0, expiresAt: now + windowMs };
  counter.count += 1;
  memoryCounters.set(key, counter);
  return {
    allowed: counter.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((counter.expiresAt - now) / 1000)),
  };
}
