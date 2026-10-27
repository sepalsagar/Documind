import { connectToDatabase, isProductionEnvironment } from './db';
import { UserModel, IUser } from '../models/User';
import { DocumentModel, IDocument, DocumentStatus } from '../models/Document';
import { DocumentChunkModel, IDocumentChunk } from '../models/DocumentChunk';
import { ConversationModel } from '../models/Conversation';
import { IMessageSource, MessageModel, MessageRole } from '../models/Message';

// In-Memory fallback store
export interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  isDemo?: boolean;
  expiresAt?: Date;
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
  isDemo?: boolean;
  isTemplate?: boolean;
  expiresAt?: Date;
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
  isDemo?: boolean;
  isTemplate?: boolean;
  expiresAt?: Date;
}

declare global {
  var documindStore: {
    users: Map<string, MemoryUser>;
    documents: Map<string, MemoryDocument>;
    chunks: Map<string, MemoryDocumentChunk>;
    conversations: Map<string, MemoryConversation>;
    messages: Map<string, MemoryMessage>;
  } | undefined;
}

export interface MemoryConversation {
  _id: string;
  userId: string;
  documentId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface MemoryMessage {
  _id: string;
  conversationId: string;
  userId: string;
  documentId: string;
  role: MessageRole;
  content: string;
  sources: IMessageSource[];
  createdAt: Date;
  expiresAt?: Date;
}

if (!global.documindStore) {
  global.documindStore = {
    users: new Map(),
    documents: new Map(),
    chunks: new Map(),
    conversations: new Map(),
    messages: new Map(),
  };
}

const memoryStore = global.documindStore;
let demoTemplatePromise: Promise<void> | null = null;

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
      if (isProductionEnvironment()) throw e;
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

export async function createDemoUser(templateUserId = '__demo_template__'): Promise<{
  id: string;
  name: string;
  email: string;
  isDemo: true;
  expiresAt: Date;
  documentId: string | null;
}> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const email = `demo-${generateId()}@documind.local`;
  const db = await connectToDatabase();

  if (db) {
    try {
      await ensureDemoTemplate(templateUserId);
      const user = await UserModel.create({
        name: 'Demo Researcher',
        email,
        passwordHash: 'demo-account-no-password',
        isDemo: true,
        expiresAt,
      });
      const template = await DocumentModel.findOne({ isTemplate: true, userId: templateUserId }).lean();
      if (!template) {
        return { id: user._id.toString(), name: user.name, email: user.email, isDemo: true, expiresAt, documentId: null };
      }

      async function ensureDemoTemplate(templateUserId: string): Promise<void> {
        if (demoTemplatePromise) return demoTemplatePromise;
        demoTemplatePromise = (async () => {
          const db = await connectToDatabase();
          if (!db) return;
          const existing = await DocumentModel.findOne({ isTemplate: true, userId: templateUserId }).select('_id chunkCount').lean();
          const existingChunkCount = existing ? await DocumentChunkModel.countDocuments({ documentId: existing._id.toString() }) : 0;
          if (existing && existingChunkCount >= 3) return;
          if (existing) {
            await DocumentChunkModel.deleteMany({ documentId: existing._id.toString() });
            await DocumentModel.deleteOne({ _id: existing._id });
          }
          const pages = [
            'Northstar Labs Leave and Expense Policy. The policy explains how full-time employees request paid leave and how business travel expenses are reimbursed.',
            'Leave policy: full-time employees accrue 1.5 paid leave days each month. Submit leave requests five working days before the first day away, except emergencies. Managers approve requests in the team calendar.',
            'Expense policy: business travel requires manager pre-approval. Submit itemized receipts within 30 days and use the company travel card when available. Finance reviews exceptions and People Operations answers leave questions.',
          ];
          const { generateEmbedding } = await import('./rag');
          try {
            const template = await DocumentModel.create({
              userId: templateUserId,
              title: 'Northstar Labs Leave and Expense Policy.pdf',
              originalName: 'northstar-leave-expense-policy.pdf',
              fileSize: 0,
              pageCount: 3,
              chunkCount: pages.length,
              status: 'Ready',
              isTemplate: true,
            });
            await DocumentChunkModel.insertMany(await Promise.all(pages.map(async (text, index) => ({
              documentId: template._id.toString(),
              chunkIndex: index,
              pageNumber: index + 1,
              text,
              embedding: await generateEmbedding(text, 'RETRIEVAL_DOCUMENT'),
              tokenCount: Math.round(text.split(/\s+/).length * 1.3),
              isTemplate: true,
            }))));
          } catch (error: any) {
            if (error?.code !== 11000) throw error;
          }
        })().finally(() => {
          demoTemplatePromise = null;
        });
        return demoTemplatePromise;
      }
      const cloned = await DocumentModel.create({
        userId: user._id.toString(),
        title: template.title,
        originalName: template.originalName,
        fileSize: template.fileSize,
        pageCount: template.pageCount,
        chunkCount: template.chunkCount,
        status: template.status,
        isDemo: true,
        expiresAt,
      });
      const chunks = await DocumentChunkModel.find({ documentId: template._id.toString() }).lean();
      await DocumentChunkModel.insertMany(chunks.map((chunk: any) => ({
        documentId: cloned._id.toString(),
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        text: chunk.text,
        embedding: chunk.embedding,
        tokenCount: chunk.tokenCount,
        isDemo: true,
        expiresAt,
      })));
      return { id: user._id.toString(), name: user.name, email: user.email, isDemo: true, expiresAt, documentId: cloned._id.toString() };
    } catch (error) {
      if (isProductionEnvironment()) throw error;
      console.warn('Demo user creation fell back to memory store:', error);
    }
  }

  const userId = generateId();
  memoryStore.users.set(userId, {
    _id: userId,
    name: 'Demo Researcher',
    email,
    passwordHash: 'demo-account-no-password',
    createdAt: new Date(),
    isDemo: true,
    expiresAt,
  });
  let template = Array.from(memoryStore.documents.values()).find((doc) => doc.isTemplate && doc.userId === templateUserId);
  if (!template) {
    const templateId = generateId();
    const templateText = 'Northstar Labs leave policy: employees accrue 1.5 paid leave days each month and should submit requests five working days ahead. Expense policy: business travel needs pre-approval and itemized receipts must be submitted within 30 days.';
    const { generateEmbedding } = await import('./rag');
    template = {
      _id: templateId,
      userId: templateUserId,
      title: 'Northstar Labs Leave & Expense Policy.pdf',
      originalName: 'northstar-leave-expense-policy.pdf',
      fileSize: 0,
      pageCount: 3,
      chunkCount: 1,
      status: 'Ready',
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemplate: true,
    };
    memoryStore.documents.set(templateId, template);
    const chunkId = generateId();
    memoryStore.chunks.set(chunkId, {
      _id: chunkId,
      documentId: templateId,
      chunkIndex: 0,
      pageNumber: 2,
      text: templateText,
      embedding: await generateEmbedding(templateText),
      tokenCount: 34,
      createdAt: new Date(),
      isTemplate: true,
    });
  }
  let documentId: string | null = null;
  if (template) {
    documentId = generateId();
    memoryStore.documents.set(documentId, { ...template, _id: documentId, userId, isDemo: true, isTemplate: false, expiresAt });
    for (const chunk of Array.from(memoryStore.chunks.values()).filter((item) => item.documentId === template._id)) {
      const chunkId = generateId();
      memoryStore.chunks.set(chunkId, { ...chunk, _id: chunkId, documentId, isDemo: true, isTemplate: false, expiresAt });
    }
  }
  return { id: userId, name: 'Demo Researcher', email, isDemo: true, expiresAt, documentId };
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
      if (isProductionEnvironment()) throw e;
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
      if (isProductionEnvironment()) throw e;
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
  isDemo?: boolean;
  isTemplate?: boolean;
  expiresAt?: Date;
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
        isDemo: data.isDemo,
        isTemplate: data.isTemplate,
        expiresAt: data.expiresAt,
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
      if (isProductionEnvironment()) throw e;
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
    isDemo: data.isDemo,
    isTemplate: data.isTemplate,
    expiresAt: data.expiresAt,
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
      if (isProductionEnvironment()) throw e;
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
      if (isProductionEnvironment()) throw e;
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
      if (isProductionEnvironment()) throw e;
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
        const conversations = await ConversationModel.find({ documentId: id, userId }).select('_id').lean();
        await MessageModel.deleteMany({ documentId: id, userId });
        await ConversationModel.deleteMany({ documentId: id, userId });
        return true;
      }
    } catch (e) {
      if (isProductionEnvironment()) throw e;
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
    for (const [conversationId, conversation] of memoryStore.conversations.entries()) {
      if (conversation.documentId === id && conversation.userId === userId) {
        memoryStore.conversations.delete(conversationId);
        for (const [messageId, message] of memoryStore.messages.entries()) {
          if (message.conversationId === conversationId) memoryStore.messages.delete(messageId);
        }
      }
    }
    return true;
  }

  return false;
}

  export async function getOrCreateConversation(
    userId: string,
    documentId: string,
    expiresAt?: Date
  ): Promise<MemoryConversation> {
    const db = await connectToDatabase();
    if (db) {
      try {
        const existing = await ConversationModel.findOne({ userId, documentId }).sort({ updatedAt: -1 }).lean();
        if (existing) return { ...existing, _id: existing._id.toString() } as MemoryConversation;
        const created = await ConversationModel.create({ userId, documentId, expiresAt });
        return {
          _id: created._id.toString(),
          userId: created.userId,
          documentId: created.documentId,
          title: created.title,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          expiresAt: created.expiresAt,
        };
      } catch (error) {
        if (isProductionEnvironment()) throw error;
        console.warn('Conversation persistence unavailable, using local store:', error);
      }
    }
    const existing = Array.from(memoryStore.conversations.values())
      .filter((conversation) => conversation.userId === userId && conversation.documentId === documentId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    if (existing) return existing;
    const now = new Date();
    const conversation = { _id: generateId(), userId, documentId, title: 'New chat', createdAt: now, updatedAt: now, expiresAt };
    memoryStore.conversations.set(conversation._id, conversation);
    return conversation;
  }

  export async function getConversationMessages(
    conversationId: string,
    userId: string,
    documentId: string
  ): Promise<MemoryMessage[]> {
    const db = await connectToDatabase();
    if (db) {
      try {
        const conversation = await ConversationModel.findOne({ _id: conversationId, userId, documentId }).lean();
        if (!conversation) return [];
        const messages = await MessageModel.find({ conversationId, userId, documentId }).sort({ createdAt: 1 }).lean();
        return messages.map((message: any) => ({ ...message, _id: message._id.toString() }));
      } catch (error) {
        if (isProductionEnvironment()) throw error;
        console.warn('Message history unavailable, using local store:', error);
      }
    }
    const conversation = memoryStore.conversations.get(conversationId);
    if (!conversation || conversation.userId !== userId || conversation.documentId !== documentId) return [];
    return Array.from(memoryStore.messages.values())
      .filter((message) => message.conversationId === conversationId && message.userId === userId && message.documentId === documentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  export async function createConversationMessage(data: {
    conversationId: string;
    userId: string;
    documentId: string;
    role: MessageRole;
    content: string;
    sources?: IMessageSource[];
    expiresAt?: Date;
  }): Promise<MemoryMessage> {
    const db = await connectToDatabase();
    if (db) {
      try {
        const message = await MessageModel.create({ ...data, sources: data.sources || [] });
        await ConversationModel.updateOne({ _id: data.conversationId, userId: data.userId, documentId: data.documentId }, { $set: { updatedAt: new Date() } });
        return { ...message.toObject(), _id: message._id.toString() } as MemoryMessage;
      } catch (error) {
        if (isProductionEnvironment()) throw error;
        console.warn('Message persistence unavailable, using local store:', error);
      }
    }
    const message: MemoryMessage = { _id: generateId(), ...data, sources: data.sources || [], createdAt: new Date() };
    memoryStore.messages.set(message._id, message);
    const conversation = memoryStore.conversations.get(data.conversationId);
    if (conversation) conversation.updatedAt = new Date();
    return message;
  }

  export async function clearConversation(conversationId: string, userId: string, documentId: string): Promise<boolean> {
    const db = await connectToDatabase();
    if (db) {
      try {
        const conversation = await ConversationModel.findOne({ _id: conversationId, userId, documentId });
        if (!conversation) return false;
        await MessageModel.deleteMany({ conversationId, userId, documentId });
        conversation.updatedAt = new Date();
        await conversation.save();
        return true;
      } catch (error) {
        if (isProductionEnvironment()) throw error;
        console.warn('Conversation clear unavailable, using local store:', error);
      }
    }
    const conversation = memoryStore.conversations.get(conversationId);
    if (!conversation || conversation.userId !== userId || conversation.documentId !== documentId) return false;
    for (const [messageId, message] of memoryStore.messages.entries()) {
      if (message.conversationId === conversationId) memoryStore.messages.delete(messageId);
    }
    conversation.updatedAt = new Date();
    return true;
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
    isDemo?: boolean;
    isTemplate?: boolean;
    expiresAt?: Date;
  }>
): Promise<void> {
  const db = await connectToDatabase();

  if (db) {
    try {
      await DocumentChunkModel.insertMany(chunksData);
      return;
    } catch (e) {
      if (isProductionEnvironment()) throw e;
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
      isDemo: c.isDemo,
      isTemplate: c.isTemplate,
      expiresAt: c.expiresAt,
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
      if (isProductionEnvironment()) throw e;
    }

  }

  const chunks = Array.from(memoryStore.chunks.values())
    .filter((c) => c.documentId === documentId)
    .sort((a, b) => a.chunkIndex - b.chunkIndex);

  return chunks;
}

export async function getDocumentChunkCount(documentId: string): Promise<number> {
  const db = await connectToDatabase();
  if (db) {
    try {
      return await DocumentChunkModel.countDocuments({ documentId });
    } catch (error) {
      if (isProductionEnvironment()) throw error;
      console.warn('Chunk count lookup fell back to memory store:', error);
    }
  }
  return Array.from(memoryStore.chunks.values()).filter((chunk) => chunk.documentId === documentId).length;
}
