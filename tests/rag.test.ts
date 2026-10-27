import { describe, expect, it } from 'vitest';
import { buildFallbackAnswer, chunkDocument, cosineSimilarity, extractTextFromPdf, isUsableDocumentText } from '../lib/rag';
import { readFileSync } from 'node:fs';
import { createDemoUser, createDocument, createDocumentChunks, getDocumentById, getDocumentChunks, getOrCreateConversation, createConversationMessage, getConversationMessages } from '../lib/store';
import { consumeRateLimit } from '../lib/rate-limit';

describe('RAG primitives', () => {
  it('extracts readable fixture text with page numbers', async () => {
    const extraction = await extractTextFromPdf(readFileSync('scripts/demo-policy.pdf'));
    expect(extraction.pageCount).toBe(4);
    expect(extraction.pages.map((page) => page.pageNumber)).toEqual([1, 2, 3, 4]);
    expect(extraction.fullText).toContain('Northstar Labs');
  });

  it('rejects empty and raw PDF syntax as document text', () => {
    expect(isUsableDocumentText('')).toBe(false);
    expect(isUsableDocumentText('%PDF-1.4 1 0 obj << /Type /Page >> endobj xref')).toBe(false);
    expect(isUsableDocumentText('Employees submit itemized receipts within thirty days.')).toBe(true);
  });

  it('creates overlapping, page-aware chunks', () => {
    const chunks = chunkDocument(
      [{ pageNumber: 2, text: Array.from({ length: 10 }, (_, i) => `word${i}`).join(' ') }],
      6,
      2
    );
    expect(chunks).toHaveLength(2);
    expect(chunks[0].pageNumber).toBe(2);
    expect(chunks[1].text).toContain('word4');
    expect(chunks[1].text).toContain('word9');
  });

  it('returns the expected cosine similarity', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([1, 0], [1, 1])).toBeCloseTo(Math.SQRT1_2);
  });

  it('uses grounded passages and valid page citations in the unavailable-AI fallback', () => {
    const answer = buildFallbackAnswer([
      { chunkIndex: 0, pageNumber: 2, text: 'Leave requests require five working days notice.', tokenCount: 8, similarity: 0.58, similarityScore: 58 },
    ]);
    expect(answer).toContain('Basic answer - AI unavailable.');
    expect(answer).toContain('[1] Page 2: Leave requests require five working days notice.');
    expect(answer).not.toContain('Page 258%');
  });

  it('states when no passage can answer the question', () => {
    expect(buildFallbackAnswer([])).toBe("I couldn't find this in the document.");
  });

  it('does not return another user’s document', async () => {
    const document = await createDocument({
      userId: `owner-${Date.now()}`,
      title: 'Private.pdf',
      originalName: 'Private.pdf',
      fileSize: 10,
      status: 'Ready',
    });
    await expect(getDocumentById(document._id, 'different-user')).resolves.toBeNull();
    await expect(getDocumentById(document._id, document.userId)).resolves.toMatchObject({ _id: document._id });
  });

  it('creates an expiring demo user and clones template chunks with ownership', async () => {
    const template = await createDocument({
      userId: '__demo_template__',
      title: 'Demo policy.pdf',
      originalName: 'Demo policy.pdf',
      fileSize: 1,
      pageCount: 1,
      status: 'Ready',
      isTemplate: true,
    });
    await createDocumentChunks([{
      documentId: template._id,
      chunkIndex: 0,
      pageNumber: 1,
      text: 'Employees accrue leave monthly.',
      embedding: [1, 0],
      tokenCount: 5,
      isTemplate: true,
    }]);
    const demo = await createDemoUser();
    expect(demo.isDemo).toBe(true);
    expect(demo.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(demo.documentId).toBeTruthy();
    const cloned = await getDocumentById(demo.documentId!, demo.id);
    expect(cloned?.userId).toBe(demo.id);
    expect(await getDocumentById(demo.documentId!, 'another-user')).toBeNull();
    expect((await getDocumentChunks(demo.documentId!))).toHaveLength(1);
  });

  it('returns a denied result after a rate limit cap', async () => {
    const key = `test-cap-${Date.now()}`;
    const first = await consumeRateLimit(key, 1, 60_000);
    const second = await consumeRateLimit(key, 1, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });

  it('persists conversation messages and enforces conversation ownership', async () => {
    const owner = `history-owner-${Date.now()}`;
    const document = await createDocument({
      userId: owner,
      title: 'History.pdf',
      originalName: 'History.pdf',
      fileSize: 10,
      status: 'Ready',
    });
    const conversation = await getOrCreateConversation(owner, document._id);
    await createConversationMessage({
      conversationId: conversation._id,
      userId: owner,
      documentId: document._id,
      role: 'user',
      content: 'What is on page one?',
    });
    await createConversationMessage({
      conversationId: conversation._id,
      userId: owner,
      documentId: document._id,
      role: 'assistant',
      content: 'The answer is on page one.',
      sources: [{ page: 1, chunkId: '0', score: 0.9 }],
    });
    await expect(getConversationMessages(conversation._id, owner, document._id)).resolves.toHaveLength(2);
    await expect(getConversationMessages(conversation._id, 'other-user', document._id)).resolves.toHaveLength(0);
  });
});
