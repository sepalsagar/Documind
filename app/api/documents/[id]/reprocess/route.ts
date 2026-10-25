import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDocumentById, getDocumentChunks, updateDocument } from '@/lib/store';
import { containsPdfSyntax } from '@/lib/rag';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocumentById(id, authUser.userId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    }

    const chunks = await getDocumentChunks(id);
    const containsRawPdf = chunks.some((chunk) => containsPdfSyntax(chunk.text));
    if (!containsRawPdf) {
      return NextResponse.json({
        flagged: false,
        message: 'This document does not match the known raw-PDF extraction issue.',
      });
    }

    const updated = await updateDocument(id, authUser.userId, {
      status: 'Failed',
      errorMessage: 'This document was indexed from raw PDF file data. Please upload the original PDF again to re-process it.',
    });

    return NextResponse.json({
      flagged: true,
      document: updated,
      message: 'The document was flagged for re-upload. Your existing data was kept.',
    });
  } catch (error) {
    console.error('Document reprocess flagging error:', error);
    return NextResponse.json(
      { error: 'Unable to flag this document right now. Please try again.' },
      { status: 500 }
    );
  }
}
