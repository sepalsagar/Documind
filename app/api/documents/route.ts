import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getUserDocuments, createDocument, createDocumentChunks, updateDocument } from '@/lib/store';
import { generateEmbedding } from '@/lib/rag';
import { elapsed, logTiming, serverTiming } from '@/lib/timing';

export async function GET(req: NextRequest) {
  const started = performance.now();
  const timings: Record<string, number> = {};
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const listStarted = performance.now();
    let docs = await getUserDocuments(authUser.userId, { search, status });
    timings.list = elapsed(listStarted);

    // Seed default sample documents if this is the first time the user accesses the library
    if (docs.length === 0 && !search && (!status || status === 'All')) {
      const hasChecked = req.cookies.get('documind_seeded_' + authUser.userId);
      if (!hasChecked) {
        // Seed initial sample documents so the user can test the RAG immediately
        await seedSampleDocuments(authUser.userId);
        docs = await getUserDocuments(authUser.userId, { search, status });
      }
    }

    // Compute summary stats
    const totalDocs = docs.length;
    const readyDocs = docs.filter((d) => d.status === 'Ready').length;
    const processingDocs = docs.filter((d) => d.status === 'Processing').length;
    const failedDocs = docs.filter((d) => d.status === 'Failed').length;

    const response = NextResponse.json({
      documents: docs,
      stats: {
        total: totalDocs,
        ready: readyDocs,
        processing: processingDocs,
        failed: failedDocs,
      },
    });

    if (!req.cookies.get('documind_seeded_' + authUser.userId)) {
      response.cookies.set('documind_seeded_' + authUser.userId, 'true', { maxAge: 60 * 60 * 24 * 30 });
    }

    timings.total = elapsed(started);
    response.headers.set('Server-Timing', serverTiming(timings));
    logTiming('/api/documents', timings);
    return response;
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function seedSampleDocuments(userId: string) {
  try {
    // 1. Transformer Architecture PDF
    const doc1 = await createDocument({
      userId,
      title: 'Attention Is All You Need — Transformer Architecture.pdf',
      originalName: 'Attention_Is_All_You_Need.pdf',
      fileSize: 2840000,
      pageCount: 15,
      status: 'Ready',
    });

    const sampleChunksDoc1 = [
      {
        pageNumber: 1,
        text: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
      },
      {
        pageNumber: 3,
        text: 'The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder. The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers: a multi-head self-attention mechanism, and a simple, position-wise fully connected feed-forward network.',
      },
      {
        pageNumber: 4,
        text: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this. In this work we employ h = 8 parallel attention layers, or heads. For each of these we use d_k = d_v = d_model / h = 64.',
      },
      {
        pageNumber: 5,
        text: 'Scaled Dot-Product Attention: We compute the attention function on a set of queries simultaneously, packed together into a matrix Q. The keys and values are also packed into matrices K and V. We compute the matrix of outputs as: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V.',
      },
      {
        pageNumber: 8,
        text: 'Positional Encoding: Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. We add positional encodings to the input embeddings at the bottoms of the encoder and decoder stacks.',
      },
      {
        pageNumber: 11,
        text: 'Results: On the WMT 2014 English-to-German translation task, the big transformer model establishes a new state-of-the-art BLEU score of 28.4, outperforming the existing best models including ensembles by more than 2.0 BLEU points. On the English-to-French translation task, our big model achieves a BLEU score of 41.8 after training for 3.5 days on 8 GPUs.',
      },
    ];

    const chunksPayload1 = [];
    for (let i = 0; i < sampleChunksDoc1.length; i++) {
      const item = sampleChunksDoc1[i];
      const emb = await generateEmbedding(item.text);
      chunksPayload1.push({
        documentId: doc1._id,
        chunkIndex: i,
        pageNumber: item.pageNumber,
        text: item.text,
        embedding: emb,
        tokenCount: Math.round(item.text.split(' ').length * 1.3),
      });
    }

    await createDocumentChunks(chunksPayload1);
    await updateDocument(doc1._id, userId, { chunkCount: chunksPayload1.length });
    doc1.chunkCount = chunksPayload1.length;

    // 2. Q3 Financial Earnings & Market Projections
    const doc2 = await createDocument({
      userId,
      title: 'Q3 Financial Earnings & Growth Projections 2026.pdf',
      originalName: 'q3_earnings_2026_draft.pdf',
      fileSize: 4120000,
      pageCount: 32,
      status: 'Ready',
    });

    const sampleChunksDoc2 = [
      {
        pageNumber: 2,
        text: 'Executive Summary: Consolidated revenue for the third quarter reached $482.4 million, representing an increase of 24.6% year-over-year. Operating margin expanded by 340 basis points to 19.8%, driven by efficiencies in cloud compute and enterprise AI product adoption.',
      },
      {
        pageNumber: 7,
        text: 'Cloud & AI SaaS Segment: Subscription revenue for DocuMind Platform surpassed $185M with Net Revenue Retention (NRR) of 132%. Customer acquisition cost (CAC) payback period decreased to 11 months from 14 months in Q2.',
      },
      {
        pageNumber: 14,
        text: 'Guidance and Fiscal Year Outlook: For the fourth quarter of 2026, the company expects total revenue in the range of $510M to $525M, reflecting 26% year-over-year growth at the midpoint. Capital expenditure is expected to remain between $35M-$40M.',
      },
    ];

    const chunksPayload2 = [];
    for (let i = 0; i < sampleChunksDoc2.length; i++) {
      const item = sampleChunksDoc2[i];
      const emb = await generateEmbedding(item.text);
      chunksPayload2.push({
        documentId: doc2._id,
        chunkIndex: i,
        pageNumber: item.pageNumber,
        text: item.text,
        embedding: emb,
        tokenCount: Math.round(item.text.split(' ').length * 1.3),
      });
    }

    await createDocumentChunks(chunksPayload2);
    await updateDocument(doc2._id, userId, { chunkCount: chunksPayload2.length });
    doc2.chunkCount = chunksPayload2.length;
  } catch (err) {
    console.warn('Sample seed warning:', err);
  }
}
