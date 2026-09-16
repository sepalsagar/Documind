import { NextResponse } from 'next/server';
import { AuthConfigurationError } from '@/lib/auth';
import { DatabaseConfigurationError, DatabaseConnectionError } from '@/lib/db';

/**
 * Maps internal authentication/database failures onto clear, non-secret server
 * responses. A misconfigured deployment should be diagnosable from the response
 * instead of failing with an opaque generic 500.
 */
export function toAuthErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthConfigurationError) {
    return NextResponse.json(
      { error: 'Server configuration error: JWT_SECRET is not configured for this deployment.' },
      { status: 503 }
    );
  }
  if (error instanceof DatabaseConfigurationError) {
    return NextResponse.json(
      { error: 'Server configuration error: MONGODB_URI is not configured for this deployment.' },
      { status: 503 }
    );
  }
  if (error instanceof DatabaseConnectionError) {
    return NextResponse.json(
      {
        error:
          'Database unreachable: the server could not connect to MongoDB. Verify MONGODB_URI and MongoDB Atlas network access for this deployment.',
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
