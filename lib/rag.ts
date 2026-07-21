import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';
import { DocumentChunkModel } from '@/models/DocumentChunk';

export const DEFAULT_TOP_K = 5;
export const MAX_TOP_K = 8;
export const MIN_SIMILARITY = 0.45;
export interface RetrievedChunk { chunkId: string; pageStart: number; pageEnd: number; chunkIndex: number; text: string; similarity: number }

export function clampTopK(topK: unknown): number {
  const value = typeof topK === 'number' && Number.isFinite(topK) ? Math.floor(topK) : DEFAULT_TOP_K;
  return Math.min(MAX_TOP_K, Math.max(1, value));
}
export function buildChunkOwnershipFilter(userId: string, documentId: string) {
  return { userId: new mongoose.Types.ObjectId(userId), documentId: new mongoose.Types.ObjectId(documentId) };
}
export function cosineSimilarity(a: number[], b: number[]): number | null {
  if (!a.length || !b.length || a.length !== b.length) return null;
  let dot = 0, aMagnitude = 0, bMagnitude = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i])) return null;
    dot += a[i] * b[i]; aMagnitude += a[i] ** 2; bMagnitude += b[i] ** 2;
  }
  return aMagnitude && bMagnitude ? dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude)) : null;
}
export function rankRelevantChunks(queryEmbedding: number[], chunks: Array<{ _id: { toString(): string }; pageNumber: number; pageEnd: number; chunkIndex: number; text: string; embedding: number[] }>, topK: number): RetrievedChunk[] {
  return chunks.map((chunk) => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding || []);
    return similarity === null || similarity < MIN_SIMILARITY ? null : { chunkId: chunk._id.toString(), pageStart: chunk.pageNumber, pageEnd: chunk.pageEnd, chunkIndex: chunk.chunkIndex, text: chunk.text, similarity };
  }).filter((chunk): chunk is RetrievedChunk => chunk !== null).sort((a, b) => b.similarity - a.similarity).slice(0, clampTopK(topK));
}
export async function retrieveRelevantChunks({ userId, documentId, query, topK = DEFAULT_TOP_K }: { userId: string; documentId: string; query: string; topK?: number }): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(query);
  await connectToDatabase();
  const chunks = await DocumentChunkModel.find(buildChunkOwnershipFilter(userId, documentId)).select('+embedding pageNumber pageEnd chunkIndex text').lean();
  return rankRelevantChunks(queryEmbedding, chunks, topK);
}
export function validateCitations(answer: string, sourceIds: Iterable<number>): string {
  const allowed = new Set(sourceIds);
  return answer.replace(/\[(\d+)\]/g, (citation, rawId) => allowed.has(Number(rawId)) ? citation : '');
}
