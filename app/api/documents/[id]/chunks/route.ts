import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { DocumentModel } from '@/models/Document';
import { DocumentChunkModel } from '@/models/DocumentChunk';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    await connectToDatabase();

    // Verify document belongs to current user
    const doc = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(authUser.id),
    }).lean();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // Retrieve chunks ordered by chunkIndex, excluding embedding vectors
    const chunks = await DocumentChunkModel.find({
      documentId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(authUser.id),
    })
      .select('pageNumber pageEnd chunkIndex text wordCount createdAt')
      .sort({ chunkIndex: 1 })
      .lean();

    const formattedChunks = chunks.map((chunk, index) => {
      // Create readable preview title
      const previewTitle =
        chunk.text.length > 50 ? `${chunk.text.substring(0, 47)}...` : chunk.text;

      return {
        id: chunk._id.toString(),
        pageNumber: chunk.pageNumber,
        pageEnd: chunk.pageEnd,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        wordCount: chunk.wordCount,
        // Workspace UI compatibility fields:
        chunkNumber: chunk.chunkIndex + 1,
        tokens: Math.round(chunk.wordCount * 1.3),
        positionPercent: Math.min(
          99,
          Math.max(1, Math.round(((index + 1) / Math.max(chunks.length, 1)) * 100))
        ),
        // Similarity is only available after a RAG query; do not fabricate it for browsing.
        similarityMatch: 0,
        sectionTitle: previewTitle,
        sectionType: `Page ${chunk.pageNumber}`,
        content: chunk.text,
      };
    });

    return NextResponse.json(
      {
        documentId: id,
        count: chunks.length,
        chunks: formattedChunks,
      },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve document chunks.';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Internal server error.' },
      { status: 500 }
    );
  }
}
