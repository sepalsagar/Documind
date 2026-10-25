import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

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
    return null;
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  // If connection failed recently (within 30s), avoid blocking requests with timeouts
  if (Date.now() - cached!.lastFailedAt < 30000) {
    return null;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 1500,
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        console.warn('MongoDB connection unavailable, using optimized local persistent store:', err?.message || 'timeout');
        cached!.lastFailedAt = Date.now();
        cached!.promise = null;
        return null;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.lastFailedAt = Date.now();
    cached!.promise = null;
    return null;
  }

  return cached!.conn;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
