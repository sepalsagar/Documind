import mongoose from 'mongoose';
import { elapsed } from './timing';

const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
  lastFailedAt: number;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null, lastFailedAt: 0 };
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    if (isProduction) {
      throw new Error('MONGODB_URI is required in production.');
    }
    return null;
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  // If connection failed recently (within 30s), avoid blocking requests with timeouts
  if (Date.now() - cached!.lastFailedAt < 30000) {
    if (isProduction) {
      throw new Error('MongoDB is temporarily unavailable.');
    }
    return null;
  }

  if (!cached!.promise) {
    const connectionStarted = performance.now();
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.info(JSON.stringify({ type: 'db_connection', status: 'connected', durationMs: Math.round(elapsed(connectionStarted)) }));
        return m;
      })
      .catch((err) => {
        console.error(JSON.stringify({ type: 'db_connection', status: 'error', errorClass: err?.name || 'UnknownError', durationMs: Math.round(elapsed(connectionStarted)) }));
        cached!.lastFailedAt = Date.now();
        cached!.promise = null;
        if (isProduction) throw err;
        return null;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.lastFailedAt = Date.now();
    cached!.promise = null;
    if (isProduction) throw e;
    return null;
  }

  return cached!.conn;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function isProductionEnvironment(): boolean {
  return isProduction;
}

export function hasMongoUri(): boolean {
  return Boolean(MONGODB_URI);
}
