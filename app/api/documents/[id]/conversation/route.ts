import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDocumentById, getOrCreateConversation, getConversationMessages, clearConversation } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const document = await getDocumentById(id, authUser.userId);
    if (!document) return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    const expiresAt = authUser.isDemo && authUser.expiresAt ? new Date(authUser.expiresAt) : undefined;
    const conversation = await getOrCreateConversation(authUser.userId, id, expiresAt);
    const messages = await getConversationMessages(conversation._id, authUser.userId, id);
    return NextResponse.json({ conversationId: conversation._id, messages });
  } catch (error) {
    console.error('Conversation history error:', error);
    return NextResponse.json({ error: 'Unable to load chat history right now.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const document = await getDocumentById(id, authUser.userId);
    if (!document) return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    const expiresAt = authUser.isDemo && authUser.expiresAt ? new Date(authUser.expiresAt) : undefined;
    const conversation = await getOrCreateConversation(authUser.userId, id, expiresAt);
    await clearConversation(conversation._id, authUser.userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conversation clear error:', error);
    return NextResponse.json({ error: 'Unable to clear this chat right now.' }, { status: 500 });
  }
}
