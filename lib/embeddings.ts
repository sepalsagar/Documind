import { GoogleGenAI } from '@google/genai';

export const EMBEDDING_MODEL = 'gemini-embedding-2-preview';

let genAIClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  if (genAIClient) {
    return genAIClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is missing. Please configure GEMINI_API_KEY to generate embeddings.'
    );
  }

  genAIClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return genAIClient;
}

/**
 * Generates vector embeddings for a given text using Gemini's embedding model.
 *
 * @param text The input text to embed.
 * @returns Array of floating-point numbers representing the dense vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Cannot generate embedding for empty text string.');
  }

  const ai = getGenAIClient();

  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: trimmed,
    });

    const values =
      response.embeddings?.[0]?.values || (response as any).embedding?.values;

    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error(
        'Gemini API returned an empty or invalid embedding vector payload.'
      );
    }

    return values;
  } catch (error: any) {
    throw new Error(
      `Failed to generate Gemini embedding with model '${EMBEDDING_MODEL}': ${
        error?.message || error
      }`
    );
  }
}

/**
 * Generates embeddings for an array of texts with controlled concurrency.
 * Avoids overwhelming the API rate limits while keeping ingestion performant.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  concurrency = 2
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);
    const promises = batch.map(async (text, batchIndex) => {
      const overallIndex = i + batchIndex;
      const vector = await generateEmbedding(text);
      results[overallIndex] = vector;
    });

    await Promise.all(promises);
  }

  return results;
}
