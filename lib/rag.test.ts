import { describe, expect, it } from 'vitest';
import { buildChunkOwnershipFilter, clampTopK, cosineSimilarity, rankRelevantChunks, validateCitations } from './rag';

describe('RAG utilities', () => {
  it('calculates cosine similarity deterministically', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });
  it('rejects zero vectors and dimensional mismatches', () => {
    expect(cosineSimilarity([0, 0], [1, 0])).toBeNull();
    expect(cosineSimilarity([1], [1, 0])).toBeNull();
  });
  it('clamps top K to the supported range', () => {
    expect(clampTopK(-1)).toBe(1);
    expect(clampTopK(99)).toBe(8);
    expect(clampTopK(undefined)).toBe(5);
  });
  it('ranks only compatible, sufficiently similar chunks', () => {
    const chunks = [
      { _id: { toString: () => 'best' }, pageNumber: 1, pageEnd: 1, chunkIndex: 0, text: 'best', embedding: [1, 0] },
      { _id: { toString: () => 'second' }, pageNumber: 2, pageEnd: 2, chunkIndex: 1, text: 'second', embedding: [0.8, 0.2] },
      { _id: { toString: () => 'wrong-size' }, pageNumber: 3, pageEnd: 3, chunkIndex: 2, text: 'wrong', embedding: [1] },
    ];
    expect(rankRelevantChunks([1, 0], chunks, 8).map((chunk) => chunk.chunkId)).toEqual(['best', 'second']);
  });
  it('removes citations that were not retrieved', () => {
    expect(validateCitations('Supported [1], invented [9].', [1, 2])).toBe('Supported [1], invented .');
  });
  it('builds a filter scoped to both the authenticated user and requested document', () => {
    const filter = buildChunkOwnershipFilter('507f1f77bcf86cd799439011', '507f191e810c19729de860ea');
    expect(filter.userId.toString()).toBe('507f1f77bcf86cd799439011');
    expect(filter.documentId.toString()).toBe('507f191e810c19729de860ea');
  });
});
