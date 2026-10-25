import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createDocument, createDocumentChunks, updateDocument } from '@/lib/store';
import { extractTextFromPdf, chunkDocument, generateEmbedding } from '@/lib/rag';

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum limit of 10 MB.' },
        { status: 400 }
      );
    }

    const filename = file.name || 'document.pdf';
    const isPdf = filename.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
    if (!isPdf) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a valid PDF document.' },
        { status: 400 }
      );
    }

    // Create initial processing document record
    const title = filename.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' ');
    const doc = await createDocument({
      userId: authUser.userId,
      title: filename,
      originalName: filename,
      fileSize: file.size,
      status: 'Processing',
    });

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // 1. PDF Text Extraction
      const extraction = await extractTextFromPdf(buffer);

      if (!extraction.fullText || extraction.fullText.trim().length === 0) {
        throw new Error('No readable text could be extracted from this PDF.');
      }

      // 2. Chunking
      const chunks = chunkDocument(extraction.pages, 180, 30);
      if (chunks.length === 0) {
        throw new Error('Document produced 0 text chunks.');
      }

      // 3. Embedding Generation
      const chunksData = [];
      for (const c of chunks) {
        const emb = await generateEmbedding(c.text);
        chunksData.push({
          documentId: doc._id,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          text: c.text,
          embedding: emb,
          tokenCount: c.tokenCount,
        });
      }

      // 4. Save Chunks
      await createDocumentChunks(chunksData);

      // 5. Update Document status to Ready
      const updatedDoc = await updateDocument(doc._id, authUser.userId, {
        status: 'Ready',
        pageCount: extraction.pageCount,
        chunkCount: chunksData.length,
      });

      return NextResponse.json({
        success: true,
        document: updatedDoc || doc,
        chunksCreated: chunksData.length,
      });
    } catch (processError: any) {
      console.error('PDF ingestion error:', processError);
      await updateDocument(doc._id, authUser.userId, {
        status: 'Failed',
        errorMessage: processError.message || 'Failed to extract text or generate embeddings.',
      });

      return NextResponse.json(
        {
          error: processError.message || 'Failed to process document text and embeddings.',
          documentId: doc._id,
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}
