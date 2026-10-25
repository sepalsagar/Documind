import { GoogleGenAI } from '@google/genai';
import { extractText } from 'unpdf';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const EMBEDDING_TIMEOUT_MS = 15_000;
const ANSWER_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedPdfResult {
  fullText: string;
  pageCount: number;
  pages: ExtractedPage[];
}

export interface TextChunk {
  chunkIndex: number;
  pageNumber: number;
  text: string;
  tokenCount: number;
}

export interface RetrievedChunk extends TextChunk {
  similarity: number;
}

export const PDF_SYNTAX_MARKERS = [
  /%PDF-\d\.\d/i,
  /\bobj\s*<</i,
  /\bendobj\b/i,
  /\bxref\b/i,
  /\/Type\s*\/Page\b/i,
];

export function containsPdfSyntax(text: string): boolean {
  return PDF_SYNTAX_MARKERS.some((marker) => marker.test(text));
}

export function isUsableDocumentText(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) return false;
  if (containsPdfSyntax(normalized)) return false;

  const visibleCharacters = normalized.replace(/\s/g, '');
  const letters = (visibleCharacters.match(/[A-Za-z]/g) || []).length;
  return letters >= 20 && letters / Math.max(1, visibleCharacters.length) >= 0.2;
}

export function assertUsableDocumentText(text: string): void {
  if (!isUsableDocumentText(text)) {
    throw new Error(
      'This PDF does not contain readable selectable text. Scanned PDFs need OCR before they can be searched.'
    );
  }
}

/**
 * 1. PDF Text Extraction
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedPdfResult> {
  const textResult = await extractText(new Uint8Array(buffer), { mergePages: false });
  const pageTexts = Array.isArray(textResult.text) ? textResult.text : [textResult.text];
  const pages = pageTexts
    .map((text, index) => ({
      pageNumber: index + 1,
      text: text.replace(/\s+/g, ' ').trim(),
    }))
    .filter((page) => page.text.length > 0);
  const fullText = pages.map((page) => page.text).join(' ').replace(/\s+/g, ' ').trim();
  const pageCount = Math.max(1, textResult.totalPages || 1);

  assertUsableDocumentText(fullText);
  if (pages.length === 0) {
    throw new Error(
      'This PDF did not expose readable page text. Scanned PDFs need OCR before they can be searched.'
    );
  }

  return {
    fullText,
    pageCount: Math.max(pageCount, pages.length),
    pages,
  };
}

/**
 * 2. Text Chunking (with word-token estimation and overlap window)
 */
export function chunkDocument(
  pages: ExtractedPage[],
  chunkSizeWords = 180, // ~240 tokens
  overlapWords = 30
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const words = page.text.split(' ').filter((w) => w.length > 0);
    if (words.length === 0) continue;

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSizeWords, words.length);
      const chunkWords = words.slice(start, end);
      const text = chunkWords.join(' ');
      const tokenCount = Math.round(chunkWords.length * 1.3);

      chunks.push({
        chunkIndex: chunkIndex++,
        pageNumber: page.pageNumber,
        text,
        tokenCount,
      });

      if (end >= words.length) break;
      start += chunkSizeWords - overlapWords;
    }
  }

  return chunks;
}

/**
 * 3. Embedding Generation via Gemini / Semantic Vector Model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'YOUR_GEMINI_API_KEY') {
    try {
      const response: any = await withTimeout(ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: texts,
      }), EMBEDDING_TIMEOUT_MS, 'Embedding request timed out.');

      const values = response.embeddings
        ?.map((embedding: any) => embedding?.values)
        .filter((embedding: any) => Array.isArray(embedding) && embedding.length > 0);
      if (values?.length === texts.length) {
        return values;
      }
      if (texts.length === 1 && response.embedding?.values?.length > 0) {
        return [response.embedding.values];
      }
    } catch (err: any) {
      console.warn('Gemini embedding API fallback to semantic vector:', err?.message);
    }
  }

  return texts.map((text) => computeDeterministicVector(text, 128));
}

/**
 * Deterministic semantic vector function for fast local fallback / offline tests
 */
function computeDeterministicVector(text: string, dimensions = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 1);

  if (tokens.length === 0) {
    return vector;
  }

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[idx] += sign * (1 / Math.sqrt(tokens.length));
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * 4. Cosine Similarity Calculation
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Cosine similarity is meaningful only inside one vector space. Never
  // truncate vectors to the shortest length: that can make a Gemini vector
  // appear comparable to the 128-D offline fallback.
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) return 0;

  const len = vecA.length;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 5. Top-K Semantic Retrieval
 */
export function retrieveTopK(
  queryEmbedding: number[],
  chunks: Array<{ chunkIndex: number; pageNumber: number; text: string; embedding: number[]; tokenCount?: number }>,
  k = 3
): RetrievedChunk[] {
  // Filter before scoring so incompatible embeddings never reach cosine
  // similarity. An empty result is handled by the chat route as insufficient
  // evidence, rather than producing a misleading answer.
  const compatibleChunks = chunks.filter((c) => c.embedding.length === queryEmbedding.length);
  const scored = compatibleChunks.map((c) => {
    const similarity = cosineSimilarity(queryEmbedding, c.embedding);
    return {
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber,
      text: c.text,
      tokenCount: c.tokenCount || Math.round(c.text.split(' ').length * 1.3),
      similarity: Number(similarity.toFixed(4)),
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}

/**
 * 6. Grounded Answer Generation using Gemini
 */
export async function generateGroundedAnswer(
  question: string,
  retrievedChunks: RetrievedChunk[]
): Promise<{ answer: string; latencyMs: number }> {
  const startTime = Date.now();

  const contextFormatted = retrievedChunks
    .map(
      (c, idx) =>
        `[Source ${idx + 1}] (Page ${c.pageNumber}, Chunk #${c.chunkIndex + 1}):\n${c.text}`
    )
    .join('\n\n');

  const systemInstruction = `You are DocuMind, an AI Document Assistant.
Answer the user's question using ONLY the provided document context.
Do not invent information or extrapolate beyond the provided text.
If the answer cannot be determined from the provided context, say that the document does not contain enough information to answer the question.
When stating facts from the context, always include bracket citations like [1], [2], or [3] directly referencing the corresponding Source number.`;

  const prompt = `DOCUMENT CONTEXT:
${contextFormatted}

USER QUESTION:
${question}

GROUNDED ANSWER (with citations):`;

  try {
    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1, // low temperature for deterministic factuality
      },
    }), ANSWER_TIMEOUT_MS, 'Answer generation timed out.');

    // Keep citation identifiers in the answer within the deterministic source
    // list returned by the route.  A model-generated [4] cannot point to a
    // source when only three passages were retrieved.
    const answer = (response.text || 'I could not find sufficient information in the provided document context.')
      .replace(/\[(\d+)\]/g, (match, value) => {
        const sourceNumber = Number(value);
        return sourceNumber >= 1 && sourceNumber <= retrievedChunks.length ? match : '';
      });
    const latencyMs = Date.now() - startTime;

    return {
      answer,
      latencyMs,
    };
  } catch (err: any) {
    console.warn('Gemini API call failed, generating contextual fallback:', err?.message);
    const latencyMs = Date.now() - startTime;
    // Contextual grounded synthesis fallback
    if (retrievedChunks.length === 0) {
      return {
        answer: 'The document does not contain enough information to answer this question.',
        latencyMs,
      };
    }

    const firstChunk = retrievedChunks[0];
    return {
      answer: `Based on the document context [1]: "${firstChunk.text.slice(0, 200)}..."`,
      latencyMs,
    };
  }
}

export async function streamGroundedAnswer(
  question: string,
  retrievedChunks: RetrievedChunk[],
  onText: (text: string) => void
): Promise<number> {
  const startTime = Date.now();
  const contextFormatted = retrievedChunks
    .map((c, idx) => `[Source ${idx + 1}] (Page ${c.pageNumber}, Chunk #${c.chunkIndex + 1}):\n${c.text}`)
    .join('\n\n');
  const prompt = `DOCUMENT CONTEXT:\n${contextFormatted}\n\nUSER QUESTION:\n${question}\n\nGROUNDED ANSWER (with citations):`;
  const systemInstruction = `You are DocuMind, an AI Document Assistant. Answer using ONLY the provided document context. If the answer cannot be determined, say so. Cite facts with [1], [2], or [3].`;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY' || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    onText(`Based on the document context [1]: "${retrievedChunks[0]?.text.slice(0, 200) || 'No relevant passage found'}..."`);
    return Date.now() - startTime;
  }

  try {
    const stream = await withTimeout(ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { systemInstruction, temperature: 0.1 },
    }), ANSWER_TIMEOUT_MS, 'Answer generation timed out.');
    for await (const response of stream) {
      if (response.text) onText(response.text);
    }
  } catch (error: any) {
    console.warn('Gemini streaming failed, using contextual fallback:', error?.message);
    onText(`Based on the document context [1]: "${retrievedChunks[0]?.text.slice(0, 200) || 'No relevant passage found'}..."`);
  }
  return Date.now() - startTime;
}
