import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

/**
 * 1. PDF Text Extraction
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedPdfResult> {
  try {
    // Handle both pdf-parse v2 (class PDFParse) and v1 (function)
    const pdfParseMod: any = await import('pdf-parse');
    let fullText = '';
    let pageCount = 1;
    let extractedPages: ExtractedPage[] = [];

    if (pdfParseMod.PDFParse && typeof pdfParseMod.PDFParse === 'function') {
      const parser = new pdfParseMod.PDFParse({ data: buffer });
      const textResult = await parser.getText();
      fullText = (textResult?.text || '').trim();
      pageCount = Math.max(1, textResult?.total || 1);

      if (Array.isArray(textResult?.pages) && textResult.pages.length > 0) {
        extractedPages = textResult.pages
          .map((p: any, idx: number) => ({
            pageNumber: p.num || idx + 1,
            text: (p.text || '').replace(/\s+/g, ' ').trim(),
          }))
          .filter((p: ExtractedPage) => p.text.length > 0);
      }
    } else {
      const pdfParse = pdfParseMod.default || pdfParseMod;
      if (typeof pdfParse === 'function') {
        const data = await pdfParse(buffer);
        fullText = (data?.text || '').trim();
        pageCount = Math.max(1, data?.numpages || 1);
      }
    }

    if (fullText.length > 0) {
      if (extractedPages.length === 0) {
        const rawPages = fullText.split(/\f|\n\s*\n\s*---\s*Page\s+\d+\s*---\s*\n/gi);
        if (rawPages.length > 1) {
          extractedPages = rawPages
            .map((p: string, idx: number) => ({
              pageNumber: idx + 1,
              text: p.replace(/\s+/g, ' ').trim(),
            }))
            .filter((p: ExtractedPage) => p.text.length > 0);
        } else {
          const charsPerPage = Math.max(1000, Math.ceil(fullText.length / pageCount));
          for (let i = 0; i < pageCount; i++) {
            const slice = fullText.slice(i * charsPerPage, (i + 1) * charsPerPage).trim();
            if (slice.length > 0) {
              extractedPages.push({
                pageNumber: i + 1,
                text: slice.replace(/\s+/g, ' '),
              });
            }
          }
        }
      }

      if (extractedPages.length === 0) {
        extractedPages = [{ pageNumber: 1, text: fullText.replace(/\s+/g, ' ') }];
      }

      return {
        fullText: fullText.replace(/\s+/g, ' '),
        pageCount: Math.max(pageCount, extractedPages.length),
        pages: extractedPages,
      };
    }
  } catch (err: any) {
    console.warn('pdf-parse encountered error or non-standard format, using raw string extractor:', err?.message);
  }

  // Fallback text extraction from raw buffer
  const rawString = buffer.toString('utf-8');
  const cleaned = rawString.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();

  if (cleaned.length > 20) {
    return {
      fullText: cleaned,
      pageCount: 1,
      pages: [{ pageNumber: 1, text: cleaned }],
    };
  }

  throw new Error('Unable to extract text from the provided PDF file. Please ensure the PDF is not password protected or purely scanned images without OCR.');
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
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'YOUR_GEMINI_API_KEY') {
    try {
      const response: any = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text,
      });

      if (response.embedding?.values && response.embedding.values.length > 0) {
        return response.embedding.values;
      }
      if (response.embeddings?.[0]?.values && response.embeddings[0].values.length > 0) {
        return response.embeddings[0].values;
      }
    } catch (err: any) {
      console.warn('Gemini embedding API fallback to semantic vector:', err?.message);
    }
  }

  // Deterministic 128-dimensional semantic embedding generator
  return computeDeterministicVector(text, 128);
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1, // low temperature for deterministic factuality
      },
    });

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
