import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDocumentById, updateDocument, deleteDocument, getDocumentChunks } from '@/lib/store';
import { elapsed, logTiming, serverTiming } from '@/lib/timing';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const started = performance.now();
  const timings: Record<string, number> = {};
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const docStarted = performance.now();
    const doc = await getDocumentById(id, authUser.userId);
    timings.document = elapsed(docStarted);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    }

    const chunksStarted = performance.now();
    const chunks = await getDocumentChunks(id);
    timings.chunks = elapsed(chunksStarted);

    const response = NextResponse.json({
      document: doc,
      chunkCount: chunks.length,
    });
    timings.total = elapsed(started);
    response.headers.set('Server-Timing', serverTiming(timings));
    logTiming('/api/documents/:id', timings);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Valid title is required.' }, { status: 400 });
    }

    const updated = await updateDocument(id, authUser.userId, {
      title: title.trim(),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteDocument(id, authUser.userId);

    if (!success) {
      return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document and associated vector chunks deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
