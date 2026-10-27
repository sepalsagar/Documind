import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createDocument, createDocumentChunks, updateDocument } from '@/lib/store';
import { extractTextFromPdf, chunkDocument, generateEmbeddings } from '@/lib/rag';
import { consumeRateLimit } from '@/lib/rate-limit';
import { elapsed, logTiming, serverTiming } from '@/lib/timing';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PAGE_COUNT = 100;

export async function POST(req: NextRequest) {
  const started = performance.now();
  const timings: Record<string, number> = {};
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    if (authUser.isDemo) {
      return NextResponse.json({ error: 'Demo workspaces cannot upload files. Create a free account to upload your own PDFs.' }, { status: 403 });
    }
    const rate = await consumeRateLimit(`user:upload:${authUser.userId}`, 10, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Upload limit reached. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      });
    }

    const readStarted = performance.now();
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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    timings.read = elapsed(readStarted);
    if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: 'Invalid file format. Please upload a valid PDF document.' }, { status: 400 });
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

    try {
      // 1. PDF Text Extraction
      const extractStarted = performance.now();
      const extraction = await extractTextFromPdf(buffer);
      timings.extract = elapsed(extractStarted);

      if (extraction.pageCount > MAX_PAGE_COUNT) {
        throw new Error(`This PDF has more than ${MAX_PAGE_COUNT} pages. Please upload a shorter document.`);
      }

      // 2. Chunking
      const chunkStarted = performance.now();
      const chunks = chunkDocument(extraction.pages, 180, 30);
      timings.chunk = elapsed(chunkStarted);
      if (chunks.length === 0) {
        throw new Error('Document produced 0 text chunks.');
      }

      // 3. Embedding Generation
      const embedStarted = performance.now();
      const embeddings = await generateEmbeddings(chunks.map((chunk) => chunk.text));
      timings.embed = elapsed(embedStarted);
      const chunksData = chunks.map((c, index) => ({
          documentId: doc._id,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          text: c.text,
          embedding: embeddings[index],
          tokenCount: c.tokenCount,
      }));

      // 4. Save Chunks
      const insertStarted = performance.now();
      await createDocumentChunks(chunksData);
      timings.insert = elapsed(insertStarted);

      // 5. Update Document status to Ready
      const updatedDoc = await updateDocument(doc._id, authUser.userId, {
        status: 'Ready',
        pageCount: extraction.pageCount,
        chunkCount: chunksData.length,
      });

      const response = NextResponse.json({
        success: true,
        document: updatedDoc || doc,
        chunksCreated: chunksData.length,
      });
      timings.total = elapsed(started);
      response.headers.set('Server-Timing', serverTiming(timings));
      logTiming('/api/documents/upload', timings);
      return response;
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
    return NextResponse.json({ error: 'Unable to upload the document right now. Please try again.' }, { status: 500 });
  }
}
