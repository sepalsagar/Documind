import mongoose from 'mongoose';

/**
 * Global MongoDB / Mongoose connection cache for Next.js App Router.
 * Prevents opening multiple connection pools across serverless invocations / hot reloads.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/** Thrown when a required server environment variable is missing. */
export class DatabaseConfigurationError extends Error {}

/** Thrown when MongoDB is configured but cannot be reached from this runtime. */
export class DatabaseConnectionError extends Error {}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new DatabaseConfigurationError(
      'MONGODB_URI environment variable is not defined. Configure MONGODB_URI in your deployment environment settings.'
    );
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      // Fail fast so a serverless runtime returns a clear error instead of a platform timeout.
      serverSelectionTimeoutMS: 10000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (cause) {
    cached!.promise = null;
    const error = new DatabaseConnectionError(
      'Unable to connect to MongoDB. Verify MONGODB_URI and that MongoDB Atlas network access allows this deployment.'
    );
    (error as { cause?: unknown }).cause = cause;
    throw error;
  }

  return cached!.conn;
}
