import { describe, expect, it } from 'vitest';
import { chunkDocument, cosineSimilarity } from '../lib/rag';
import { createDocument, getDocumentById } from '../lib/store';

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
});
