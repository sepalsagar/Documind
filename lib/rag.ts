import { extractText } from 'unpdf';

const EMBEDDING_TIMEOUT_MS = 15_000;
const ANSWER_TIMEOUT_MS = 30_000;
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const GROQ_BASE_URL = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const PUTER_BASE_URL = (process.env.PUTER_BASE_URL || 'https://api.puter.com/puterai/openai/v1').replace(/\/$/, '');
const PUTER_MODEL = process.env.PUTER_MODEL || 'gemini:gemini-3.8-flash';
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';

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
 * 3. Embedding Generation via hosted provider / semantic vector model
 */
export type EmbeddingTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

export async function generateEmbedding(text: string, taskType: EmbeddingTask = 'RETRIEVAL_QUERY'): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text], taskType);
  return embedding;
}

export async function generateEmbeddings(
  texts: string[],
  taskType: EmbeddingTask = 'RETRIEVAL_DOCUMENT'
): Promise<number[][]> {
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
  // truncate vectors to the shortest length: that can make incompatible vectors
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
 * 6. Grounded Answer Generation using the configured provider
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

  const systemInstruction = `You are DocuMind, an evidence-first document assistant.
The DOCUMENT CONTEXT is authoritative. Answer the user's question using only that context.
The context may be short, but if it contains any text, summarize the relevant facts instead of refusing.
For broad questions such as the document's objective, premise, or purpose, infer the purpose from the stated policy, findings, or recommendations without adding outside facts.
Only say the document does not contain enough information when the context is empty or truly unrelated.
Always cite document facts with [1], [2], or [3] using the provided Source numbers.`;

  const prompt = `DOCUMENT CONTEXT:
${contextFormatted}

USER QUESTION:
${question}

GROUNDED ANSWER (with citations):`;

  const answer = AI_PROVIDER === 'puter'
    ? await requestPuter(prompt, systemInstruction)
    : AI_PROVIDER === 'openrouter'
      ? await requestOpenRouter(prompt, systemInstruction)
      : AI_PROVIDER === 'groq'
        ? await requestGroq(prompt, systemInstruction)
        : await requestOllama(prompt, systemInstruction);
  if (answer && !isUnsupportedRefusal(answer, retrievedChunks)) {
    return {
      answer: answer.replace(/\[(\d+)\]/g, (match, value) => {
        const sourceNumber = Number(value);
        return sourceNumber >= 1 && sourceNumber <= retrievedChunks.length ? match : '';
      }),
      latencyMs: Date.now() - startTime,
    };
  }
  return {
    answer: buildFallbackAnswer(retrievedChunks),
    latencyMs: Date.now() - startTime,
  };
}

function isUnsupportedRefusal(answer: string, retrievedChunks: RetrievedChunk[]): boolean {
  if (retrievedChunks.some((chunk) => chunk.text.trim().length > 0) === false) return false;
  return answer.trim().length < 240 &&
    /document does not contain enough|not enough information|cannot be determined|can't answer/i.test(answer);
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

  const puterToken = process.env.PUTER_AUTH_TOKEN;
  if (AI_PROVIDER === 'puter' && puterToken) {
    try {
      const response = await fetch(`${PUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${puterToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: PUTER_MODEL,
          stream: true,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
      });
      if (!response.ok || !response.body) throw new Error(`Puter returned ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          const event = JSON.parse(line.slice(6)) as { choices?: Array<{ delta?: { content?: string } }> };
          const text = event.choices?.[0]?.delta?.content;
          if (text) onText(text);
        }
        if (done) break;
      }
      return Date.now() - startTime;
    } catch (error: any) {
      console.warn('Puter streaming failed; trying OpenRouter and Ollama:', error?.message);
    }
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (AI_PROVIDER === 'openrouter' && openRouterKey) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://documind-zeta-fawn.vercel.app',
          'X-Title': 'DocuMind',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          stream: true,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
      });
      if (!response.ok || !response.body) throw new Error(`OpenRouter returned ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          const event = JSON.parse(line.slice(6)) as { choices?: Array<{ delta?: { content?: string } }> };
          const text = event.choices?.[0]?.delta?.content;
          if (text) onText(text);
        }
        if (done) break;
      }
      return Date.now() - startTime;
    } catch (error: any) {
      console.warn('OpenRouter streaming failed; trying Ollama:', error?.message);
    }
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (AI_PROVIDER === 'groq' && groqKey) {
    try {
      const answer = await requestGroq(prompt, systemInstruction);
      if (!answer) throw new Error('Groq returned an empty answer');
      onText(answer);
      return Date.now() - startTime;
    } catch (error: any) {
      console.warn('Groq answer failed; using Ollama fallback:', error?.message);
    }
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        options: { temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
        if (event.message?.content) onText(event.message.content);
      }
      if (done) break;
    }
    if (buffer.trim()) {
      const event = JSON.parse(buffer) as { message?: { content?: string } };
      if (event.message?.content) onText(event.message.content);
    }
    return Date.now() - startTime;
  } catch (error: any) {
    console.warn('Ollama unavailable; using grounded passage fallback:', error?.message);
    onText(buildFallbackAnswer(retrievedChunks));
  }

  return Date.now() - startTime;
}

async function requestOpenRouter(prompt: string, systemInstruction: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://documind-zeta-fawn.vercel.app',
        'X-Title': 'DocuMind',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.1,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || null;
  } catch (error: any) {
    console.warn('OpenRouter answer generation failed:', error?.message);
    return null;
  }
}

async function requestPuter(prompt: string, systemInstruction: string): Promise<string | null> {
  const token = process.env.PUTER_AUTH_TOKEN;
  if (!token) return null;
  try {
    const response = await fetch(`${PUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PUTER_MODEL,
        temperature: 0.1,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Puter returned ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || null;
  } catch (error: any) {
    console.warn('Puter answer generation failed:', error?.message);
    return null;
  }

}

async function requestGroq(prompt: string, systemInstruction: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Groq returned ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || null;
  } catch (error: any) {
    console.warn('Groq answer generation failed:', error?.message);
    return null;
  }
}

async function requestOllama(prompt: string, systemInstruction: string): Promise<string | null> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        options: { temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const data = await response.json() as { message?: { content?: string } };
    return data.message?.content || null;
  } catch (error: any) {
    console.warn('Ollama answer generation failed:', error?.message);
    return null;
  }


}

export function buildFallbackAnswer(retrievedChunks: RetrievedChunk[]): string {
  if (retrievedChunks.length === 0) {
    return "I couldn't find this in the document.";
  }
  const passages = retrievedChunks
    .slice(0, 4)
    .map((chunk, index) => `[${index + 1}] Page ${chunk.pageNumber}: ${chunk.text.trim()}`)
    .join('\n');
  return `Basic answer - AI unavailable. The following relevant passages may help:\n\n${passages}`;
}
