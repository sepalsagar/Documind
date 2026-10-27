import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDocumentById, getDocumentChunks, getOrCreateConversation, createConversationMessage } from '@/lib/store';
import { generateEmbedding, retrieveTopK, streamGroundedAnswer } from '@/lib/rag';
import { consumeRateLimit } from '@/lib/rate-limit';
import { elapsed, logTiming, serverTiming } from '@/lib/timing';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const started = performance.now();
  const timings: Record<string, number> = {};
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const rate = await consumeRateLimit(
      `user:query:${authUser.userId}`,
      authUser.isDemo ? 15 : 60,
      60 * 60 * 1000
    );
    if (!rate.allowed) {
      return NextResponse.json({ error: authUser.isDemo ? 'Demo question limit reached. Create a free account to keep asking questions.' : 'Query limit reached. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      });
    }
    if (authUser.isDemo) {
      const daily = await consumeRateLimit('demo:questions:daily', 200, 24 * 60 * 60 * 1000);
      if (!daily.allowed) {
        return NextResponse.json({ error: 'The shared demo has reached today’s question limit. Please create a free account to continue.' }, {
          status: 429,
          headers: { 'Retry-After': String(daily.retryAfterSeconds) },
        });
      }
    }

    const { id } = await params;
    const doc = await getDocumentById(id, authUser.userId);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied.' }, { status: 404 });
    }

    if (doc.status !== 'Ready') {
      return NextResponse.json(
        { error: `Document is currently ${doc.status}. Please wait until indexing completes.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { question, topK = 4 } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a valid question.' }, { status: 400 });
    }

    // Question length sanity check
    if (question.length > 2000) {
      return NextResponse.json({ error: 'Question is too long (max 2000 characters).' }, { status: 400 });
    }
    if (topK !== undefined && (!Number.isInteger(topK) || topK < 1 || topK > 5)) {
      return NextResponse.json({ error: 'topK must be an integer between 1 and 5.' }, { status: 400 });
    }

    // 1. Fetch document chunks
    const chunks = await getDocumentChunks(id);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No vector chunks found for this document.' },
        { status: 404 }
      );
    }

    // 2. Generate embedding for query
    const embedStarted = performance.now();
    const queryEmbedding = await generateEmbedding(question.trim());
    timings.embedQuery = elapsed(embedStarted);

    // 3. Perform Cosine Similarity Semantic Retrieval
    const k = Math.min(Math.max(1, topK), 5);
    const searchStarted = performance.now();
    const retrievedChunks = retrieveTopK(queryEmbedding, chunks, k)
      .filter((chunk) => Number.isInteger(chunk.pageNumber) && chunk.pageNumber >= 1 && chunk.pageNumber <= doc.pageCount);
    timings.vectorSearch = elapsed(searchStarted);

    // A top-K list always has a "best" entry, even when it is unrelated. Do
    // not turn that implementation detail into an apparently grounded answer.
    const hasSufficientEvidence = retrievedChunks.length > 0 && retrievedChunks[0].similarity >= 0.12;
    if (!hasSufficientEvidence) {
      const expiresAt = authUser.isDemo && authUser.expiresAt ? new Date(authUser.expiresAt) : undefined;
      const conversation = await getOrCreateConversation(authUser.userId, id, expiresAt);
      await createConversationMessage({ conversationId: conversation._id, userId: authUser.userId, documentId: id, role: 'user', content: question.trim(), expiresAt });
      await createConversationMessage({ conversationId: conversation._id, userId: authUser.userId, documentId: id, role: 'assistant', content: 'The document does not contain enough relevant information to answer this question confidently.', expiresAt });
      const response = NextResponse.json({
        question: question.trim(),
        answer: 'The document does not contain enough relevant information to answer this question confidently.',
        sources: [],
        latencyMs: 0,
        documentId: id,
        documentTitle: doc.title,
      });
      timings.total = elapsed(started);
      response.headers.set('Server-Timing', serverTiming(timings));
      logTiming('/api/documents/:id/chat', timings);
      return response;
    }

    // 4. Grounded AI Generation with Gemini
    // Format sources with actual chunks
    const sources = retrievedChunks.map((c, index) => ({
      sourceId: index + 1,
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber,
      text: c.text,
      tokenCount: c.tokenCount,
      similarityScore: Math.round(c.similarity * 100),
      similarity: c.similarity,
    }));
    const expiresAt = authUser.isDemo && authUser.expiresAt ? new Date(authUser.expiresAt) : undefined;
    const conversation = await getOrCreateConversation(authUser.userId, id, expiresAt);
    await createConversationMessage({
      conversationId: conversation._id,
      userId: authUser.userId,
      documentId: id,
      role: 'user',
      content: question.trim(),
      expiresAt,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };
        send({ type: 'stage', stage: 'Generating grounded answer…' });
        let answer = '';
        const latencyMs = await streamGroundedAnswer(question.trim(), retrievedChunks, (text) => {
          answer += text;
          send({ type: 'text', text });
        });
        send({
          type: 'complete',
          question: question.trim(),
          answer,
          sources,
          latencyMs,
          documentId: id,
          documentTitle: doc.title,
        });
        await createConversationMessage({
          conversationId: conversation._id,
          userId: authUser.userId,
          documentId: id,
          role: 'assistant',
          content: answer,
          sources: sources.map((source) => ({ page: source.pageNumber, chunkId: String(source.chunkIndex), score: source.similarity })),
          expiresAt,
        });
        controller.close();
      },
    });

    timings.total = elapsed(started);
    logTiming('/api/documents/:id/chat', timings);
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Server-Timing': serverTiming(timings),
      },
    });
  } catch (error: any) {
    console.error('RAG Chat route error:', error);
    return NextResponse.json({ error: 'Unable to answer this question right now. Please try again.' }, { status: 500 });
  }
}
