import { NextRequest, NextResponse } from 'next/server';
import { toAuthErrorResponse } from '@/lib/api-errors';
import { getAuthUser, isAuthConfigured } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Server configuration error: JWT_SECRET is not configured for this deployment.' },
      { status: 503 }
    );
  }
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  try {
    await connectToDatabase();
    const user = await User.findById(authUser.id).lean();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    return NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
  } catch (error) {
    console.error('Session lookup failed', error);
    return toAuthErrorResponse(error, 'Unable to verify session.');
  }
}
