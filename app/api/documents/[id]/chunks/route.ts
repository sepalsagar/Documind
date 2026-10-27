import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDocumentById, getDocumentChunks } from '@/lib/store';
import { elapsed, logTiming, serverTiming } from '@/lib/timing';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const started = performance.now();
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await getDocumentById(id, authUser.userId);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    }

    const chunks = await getDocumentChunks(id);

    // Return lightweight chunk metadata for visualization
    const chunkMetadata = chunks.slice(0, 20).map((c) => ({
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber,
      tokenCount: c.tokenCount,
      snippet: c.text.slice(0, 100) + '...',
    }));

    const response = NextResponse.json({
      documentId: id,
      totalChunks: chunks.length,
      returnedChunks: chunkMetadata.length,
      chunks: chunkMetadata,
    });
    const timings = { total: elapsed(started) };
    response.headers.set('Server-Timing', serverTiming(timings));
    logTiming('/api/documents/:id/chunks', timings);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
