import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ingestPdf } from '@/lib/ingestion';
import { DocumentChunkModel } from '@/models/DocumentChunk';
import { DocumentModel, IDocument } from '@/models/Document';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatDocument(document: IDocument & { _id: mongoose.Types.ObjectId }, chunkCount: number) {
  return {
    id: document._id.toString(), title: document.title, filename: document.originalFileName,
    originalFileName: document.originalFileName, rawFileSize: document.fileSize,
    fileSize: `${(document.fileSize / 1024 / 1024).toFixed(2)} MB`, pageCount: document.pageCount,
    chunkCount, status: document.status === 'ready' ? 'Ready' : document.status === 'failed' ? 'Failed' : 'Processing',
    rawStatus: document.status, uploadDate: new Date(document.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString(), embeddingModel: 'semantic-embedding-v1',
  };
}

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  try {
    await connectToDatabase();
    const documents = await DocumentModel.find({ userId: authUser.id }).sort({ createdAt: -1 }).lean();
    const ids = documents.map((document) => document._id);
    const counts = await DocumentChunkModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { userId: new mongoose.Types.ObjectId(authUser.id), documentId: { $in: ids } } },
      { $group: { _id: '$documentId', count: { $sum: 1 } } },
    ]);
    const countByDocument = new Map(counts.map((count) => [count._id.toString(), count.count]));
    return NextResponse.json({ documents: documents.map((document) => formatDocument(document, countByDocument.get(document._id.toString()) || 0)) });
  } catch (error) {
    console.error('Document list failed', error);
    return NextResponse.json({ error: 'Unable to retrieve documents.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  let documentId: mongoose.Types.ObjectId | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const requestedTitle = typeof formData.get('title') === 'string' ? String(formData.get('title')).trim() : '';
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
      return NextResponse.json({ error: 'Please upload a non-empty PDF no larger than 10 MB.' }, { status: 422 });
    }
    await connectToDatabase();
    const document = await DocumentModel.create({ userId: authUser.id, title: (requestedTitle || file.name.replace(/\.pdf$/i, '')).slice(0, 255), originalFileName: file.name.slice(0, 255), mimeType: 'application/pdf', fileSize: file.size, status: 'processing' });
    documentId = document._id;
    const ingested = await ingestPdf(Buffer.from(await file.arrayBuffer()));
    await DocumentChunkModel.insertMany(ingested.chunks.map((chunk) => ({ ...chunk, userId: authUser.id, documentId: document._id })));
    document.status = 'ready'; document.pageCount = ingested.pageCount; await document.save();
    return NextResponse.json({ document: formatDocument(document, ingested.chunks.length) }, { status: 201 });
  } catch (error) {
    console.error('Document ingestion failed', error);
    if (documentId) await DocumentModel.findByIdAndUpdate(documentId, { status: 'failed' }).catch(() => undefined);
    return NextResponse.json({ error: 'Unable to ingest this PDF.' }, { status: 500 });
  }
}
