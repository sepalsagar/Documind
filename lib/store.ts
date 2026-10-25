import { connectToDatabase } from './db';
import { UserModel, IUser } from '../models/User';
import { DocumentModel, IDocument, DocumentStatus } from '../models/Document';
import { DocumentChunkModel, IDocumentChunk } from '../models/DocumentChunk';

// In-Memory fallback store
export interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface MemoryDocument {
  _id: string;
  userId: string;
  title: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  chunkCount: number;
  status: DocumentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryDocumentChunk {
  _id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  text: string;
  embedding: number[];
  tokenCount: number;
  createdAt: Date;
}

declare global {
  var documindStore: {
    users: Map<string, MemoryUser>;
    documents: Map<string, MemoryDocument>;
    chunks: Map<string, MemoryDocumentChunk>;
  } | undefined;
}

if (!global.documindStore) {
  global.documindStore = {
    users: new Map(),
    documents: new Map(),
    chunks: new Map(),
  };
}

const memoryStore = global.documindStore;

// Helper to generate simple ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// User Operations
export async function createUser(data: { name: string; email: string; passwordHash: string }): Promise<{
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}> {
  const db = await connectToDatabase();
  const lowerEmail = data.email.toLowerCase().trim();

  if (db) {
    try {
      const user = await UserModel.create({
        name: data.name.trim(),
        email: lowerEmail,
        passwordHash: data.passwordHash,
      });
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      };
    } catch (e) {
      // Fallback
    }
  }

  // Memory fallback
  const existing = Array.from(memoryStore.users.values()).find((u) => u.email === lowerEmail);
  if (existing) {
    throw new Error('A user with this email address already exists.');
  }

  const id = generateId();
  const newUser: MemoryUser = {
    _id: id,
    name: data.name.trim(),
    email: lowerEmail,
    passwordHash: data.passwordHash,
    createdAt: new Date(),
  };

  memoryStore.users.set(id, newUser);
  return {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };
}

export async function findUserByEmail(email: string): Promise<MemoryUser | null> {
  const db = await connectToDatabase();
  const lowerEmail = email.toLowerCase().trim();

  if (db) {
    try {
      const user = await UserModel.findOne({ email: lowerEmail }).lean();
      if (user) {
        return {
          _id: (user as any)._id.toString(),
          name: (user as any).name,
          email: (user as any).email,
          passwordHash: (user as any).passwordHash,
          createdAt: (user as any).createdAt,
        };
      }
    } catch (e) {
      // Fallback
    }
  }

  const found = Array.from(memoryStore.users.values()).find((u) => u.email === lowerEmail);
  return found || null;
}

export async function findUserById(id: string): Promise<MemoryUser | null> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const user = await UserModel.findById(id).lean();
      if (user) {
        return {
          _id: (user as any)._id.toString(),
          name: (user as any).name,
          email: (user as any).email,
          passwordHash: (user as any).passwordHash,
          createdAt: (user as any).createdAt,
        };
      }
    } catch (e) {
      // Fallback
    }
  }

  const found = memoryStore.users.get(id);
  return found || null;
}

// Document Operations
export async function createDocument(data: {
  userId: string;
  title: string;
  originalName: string;
  fileSize: number;
  pageCount?: number;
  status?: DocumentStatus;
}): Promise<MemoryDocument> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const doc = await DocumentModel.create({
        userId: data.userId,
        title: data.title,
        originalName: data.originalName,
        fileSize: data.fileSize,
        pageCount: data.pageCount || 1,
        chunkCount: 0,
        status: data.status || 'Processing',
      });
      return {
        _id: doc._id.toString(),
        userId: doc.userId,
        title: doc.title,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        pageCount: doc.pageCount,
        chunkCount: doc.chunkCount,
        status: doc.status as DocumentStatus,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } catch (e) {
      // Fallback
    }
  }

  const id = generateId();
  const newDoc: MemoryDocument = {
    _id: id,
    userId: data.userId,
    title: data.title,
    originalName: data.originalName,
    fileSize: data.fileSize,
    pageCount: data.pageCount || 1,
    chunkCount: 0,
    status: data.status || 'Processing',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.documents.set(id, newDoc);
  return newDoc;
}

export async function getUserDocuments(
  userId: string,
  filter?: { search?: string; status?: string }
): Promise<MemoryDocument[]> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const query: any = { userId };
      if (filter?.status && filter.status !== 'All') {
        query.status = filter.status;
      }
      if (filter?.search) {
        query.title = { $regex: filter.search, $options: 'i' };
      }

      const docs = await DocumentModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map((d: any) => ({
        _id: d._id.toString(),
        userId: d.userId,
        title: d.title,
        originalName: d.originalName,
        fileSize: d.fileSize,
        pageCount: d.pageCount,
        chunkCount: d.chunkCount,
        status: d.status,
        errorMessage: d.errorMessage,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));
    } catch (e) {
      // Fallback
    }
  }

  let list = Array.from(memoryStore.documents.values()).filter((d) => d.userId === userId);

  if (filter?.status && filter.status !== 'All') {
    list = list.filter((d) => d.status === filter.status);
  }

  if (filter?.search) {
    const term = filter.search.toLowerCase();
    list = list.filter(
      (d) => d.title.toLowerCase().includes(term) || d.originalName.toLowerCase().includes(term)
    );
  }

  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return list;
}

export async function getDocumentById(id: string, userId: string): Promise<MemoryDocument | null> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const doc = await DocumentModel.findOne({ _id: id, userId }).lean();
      if (doc) {
        return {
          _id: (doc as any)._id.toString(),
          userId: (doc as any).userId,
          title: (doc as any).title,
          originalName: (doc as any).originalName,
          fileSize: (doc as any).fileSize,
          pageCount: (doc as any).pageCount,
          chunkCount: (doc as any).chunkCount,
          status: (doc as any).status,
          errorMessage: (doc as any).errorMessage,
          createdAt: (doc as any).createdAt,
          updatedAt: (doc as any).updatedAt,
        };
      }
    } catch (e) {
      // Fallback
    }
  }

  const doc = memoryStore.documents.get(id);
  if (doc && doc.userId === userId) {
    return doc;
  }
  return null;
}

export async function updateDocument(
  id: string,
  userId: string,
  updates: Partial<MemoryDocument>
): Promise<MemoryDocument | null> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const updated = await DocumentModel.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (updated) {
        return {
          _id: (updated as any)._id.toString(),
          userId: (updated as any).userId,
          title: (updated as any).title,
          originalName: (updated as any).originalName,
          fileSize: (updated as any).fileSize,
          pageCount: (updated as any).pageCount,
          chunkCount: (updated as any).chunkCount,
          status: (updated as any).status,
          errorMessage: (updated as any).errorMessage,
          createdAt: (updated as any).createdAt,
          updatedAt: (updated as any).updatedAt,
        };
      }
    } catch (e) {
      // Fallback
    }
  }

  const doc = memoryStore.documents.get(id);
  if (doc && doc.userId === userId) {
    const updatedDoc: MemoryDocument = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
    };
    memoryStore.documents.set(id, updatedDoc);
    return updatedDoc;
  }
  return null;
}

export async function deleteDocument(id: string, userId: string): Promise<boolean> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const res = await DocumentModel.deleteOne({ _id: id, userId });
      if (res.deletedCount > 0) {
        await DocumentChunkModel.deleteMany({ documentId: id });
        return true;
      }
    } catch (e) {
      // Fallback
    }
  }

  const doc = memoryStore.documents.get(id);
  if (doc && doc.userId === userId) {
    memoryStore.documents.delete(id);
    // Delete all chunks associated with this document
    for (const [chunkId, chunk] of memoryStore.chunks.entries()) {
      if (chunk.documentId === id) {
        memoryStore.chunks.delete(chunkId);
      }
    }
    return true;
  }
  return false;
}

// Chunk Operations
export async function createDocumentChunks(
  chunksData: Array<{
    documentId: string;
    chunkIndex: number;
    pageNumber: number;
    text: string;
    embedding: number[];
    tokenCount: number;
  }>
): Promise<void> {
  const db = await connectToDatabase();

  if (db) {
    try {
      await DocumentChunkModel.insertMany(chunksData);
      return;
    } catch (e) {
      // Fallback
    }
  }

  for (const c of chunksData) {
    const id = generateId();
    memoryStore.chunks.set(id, {
      _id: id,
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber,
      text: c.text,
      embedding: c.embedding,
      tokenCount: c.tokenCount,
      createdAt: new Date(),
    });
  }
}

export async function getDocumentChunks(documentId: string): Promise<MemoryDocumentChunk[]> {
  const db = await connectToDatabase();

  if (db) {
    try {
      const chunks = await DocumentChunkModel.find({ documentId }).sort({ chunkIndex: 1 }).lean();
      return chunks.map((c: any) => ({
        _id: c._id.toString(),
        documentId: c.documentId,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        text: c.text,
        embedding: c.embedding,
        tokenCount: c.tokenCount,
        createdAt: c.createdAt,
      }));
    } catch (e) {
      // Fallback
    }
  }

  const chunks = Array.from(memoryStore.chunks.values())
    .filter((c) => c.documentId === documentId)
    .sort((a, b) => a.chunkIndex - b.chunkIndex);

  return chunks;
}
