import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  try {
    await connectToDatabase();
    const user = await User.findById(authUser.id).lean();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    return NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
  } catch (error) {
    console.error('Session lookup failed', error);
    return NextResponse.json({ error: 'Unable to verify session.' }, { status: 500 });
  }
}
