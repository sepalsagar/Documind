import { describe, expect, it } from 'vitest';
import { chunkDocument, cosineSimilarity } from '../lib/rag';
import { createDemoUser, createDocument, createDocumentChunks, getDocumentById, getDocumentChunks } from '../lib/store';
import { consumeRateLimit } from '../lib/rate-limit';

describe('RAG primitives', () => {
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
});
