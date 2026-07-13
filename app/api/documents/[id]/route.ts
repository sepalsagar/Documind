import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { DocumentModel } from '@/models/Document';
import { DocumentChunkModel } from '@/models/DocumentChunk';
import { validateDocumentRenameInput } from '@/lib/validation';

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

    const doc = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(authUser.id),
    }).lean();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const formattedDoc = {
      id: doc._id.toString(),
      title: doc.title,
      originalFileName: doc.originalFileName,
      filename: doc.originalFileName,
      fileSize: formatFileSize(doc.fileSize),
      rawFileSize: doc.fileSize,
      pageCount: doc.pageCount || 0,
      chunkCount: 0,
      status: mapStatusToDisplay(doc.status),
      rawStatus: doc.status,
      uploadDate: formatDate(doc.createdAt),
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      sections: [],
      chunks: [],
    };

    return NextResponse.json({ document: formattedDoc }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve document.';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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

    const body = await req.json().catch(() => null);
    const validation = validateDocumentRenameInput(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { error: validation.errors[0] || 'Invalid document title.' },
        { status: 422 }
      );
    }

    await connectToDatabase();

    const updatedDoc = await DocumentModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(authUser.id),
      },
      {
        $set: { title: validation.data.title },
      },
      { new: true }
    ).lean();

    if (!updatedDoc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const formattedDoc = {
      id: updatedDoc._id.toString(),
      title: updatedDoc.title,
      originalFileName: updatedDoc.originalFileName,
      filename: updatedDoc.originalFileName,
      fileSize: formatFileSize(updatedDoc.fileSize),
      rawFileSize: updatedDoc.fileSize,
      pageCount: updatedDoc.pageCount || 0,
      chunkCount: 0,
      status: mapStatusToDisplay(updatedDoc.status),
      rawStatus: updatedDoc.status,
      uploadDate: formatDate(updatedDoc.createdAt),
      createdAt: updatedDoc.createdAt ? new Date(updatedDoc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updatedDoc.updatedAt ? new Date(updatedDoc.updatedAt).toISOString() : new Date().toISOString(),
      sections: [],
      chunks: [],
    };

    return NextResponse.json(
      { message: 'Document updated successfully', document: formattedDoc },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update document.';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
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

    // Verify ownership and delete
    const deletedDoc = await DocumentModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(authUser.id),
    }).lean();

    if (!deletedDoc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    await DocumentChunkModel.deleteMany({ documentId: deletedDoc._id, userId: new mongoose.Types.ObjectId(authUser.id) });

    return NextResponse.json(
      { success: true, message: 'Document deleted successfully', id },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete document.';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Internal server error.' },
      { status: 500 }
    );
  }
}

function mapStatusToDisplay(status: string): 'Ready' | 'Processing' | 'Failed' {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'processing':
    case 'uploaded':
      return 'Processing';
    case 'failed':
      return 'Failed';
    default:
      return 'Ready';
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Just now';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
