// @ts-expect-error pdf-parse lacks direct subpath types
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { generateEmbeddingsBatch } from '@/lib/embeddings';

export interface IngestedChunk {
  pageNumber: number;
  pageEnd: number;
  chunkIndex: number;
  text: string;
  wordCount: number;
  embedding: number[];
}

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

function chunkPage(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const chunks: string[] = [];
  for (let start = 0; start < normalized.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    const end = Math.min(normalized.length, start + CHUNK_SIZE);
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === normalized.length) break;
  }
  return chunks;
}

/** Extracts real text from PDF pages, chunks it, then embeds each chunk for semantic retrieval. */
export async function ingestPdf(buffer: Buffer): Promise<{ pageCount: number; chunks: IngestedChunk[] }> {
  const pages: string[] = [];
  const parsed = await (pdf as any)(buffer, {
    pagerender: async (pageData: any) => {
      const content = await pageData.getTextContent();
      const text = content.items.map((item: { str?: string }) => item.str || '').join(' ');
      pages.push(text);
      return text;
    },
  });
  const texts = pages.flatMap((page, pageIndex) => chunkPage(page).map((text) => ({ text, pageNumber: pageIndex + 1 })));
  if (!texts.length) throw new Error('No extractable text was found in this PDF.');
  const embeddings = await generateEmbeddingsBatch(texts.map((chunk) => chunk.text));
  return {
    pageCount: parsed.numpages || pages.length,
    chunks: texts.map((chunk, chunkIndex) => ({
      pageNumber: chunk.pageNumber,
      pageEnd: chunk.pageNumber,
      chunkIndex,
      text: chunk.text,
      wordCount: chunk.text.split(/\s+/).filter(Boolean).length,
      embedding: embeddings[chunkIndex],
    })),
  };
}
