import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { clampTopK, retrieveRelevantChunks, validateCitations } from '@/lib/rag';
import { DocumentModel } from '@/models/Document';

const GENERATION_MODEL = process.env.GEMINI_GENERATION_MODEL || 'gemini-3.6-flash';
const NO_EVIDENCE_ANSWER = "I couldn't find enough relevant information in this document to answer that question.";

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini is not configured.');
  return new GoogleGenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    const documentId = typeof body?.documentId === 'string' ? body.documentId : '';
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 });
    if (!query || query.length > 2000) return NextResponse.json({ error: 'Query must be between 1 and 2000 characters.' }, { status: 422 });

    await connectToDatabase();
    const document = await DocumentModel.findOne({ _id: documentId, userId: authUser.id }).lean();
    if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    const retrieved = await retrieveRelevantChunks({ userId: authUser.id, documentId, query, topK: clampTopK(body?.topK) });
    if (!retrieved.length) return NextResponse.json({ answer: NO_EVIDENCE_ANSWER, sources: [] });

    const sources = retrieved.map((chunk, index) => ({ id: index + 1, ...chunk }));
    const context = sources.map((source) => `[SOURCE ${source.id}]\nPage: ${source.pageStart}${source.pageEnd !== source.pageStart ? `-${source.pageEnd}` : ''}\nText:\n${source.text}`).join('\n\n');
    const response = await getAiClient().models.generateContent({
      model: GENERATION_MODEL,
      contents: `You are DocuMind, a document question-answering assistant.\n\nAnswer using ONLY the supplied document excerpts.\nThe excerpts are the authoritative context for this response.\nIf the excerpts do not contain enough information to answer the question, clearly say that the document does not provide enough information.\nDo not use outside knowledge.\nDo not invent facts.\nDo not invent sources.\nOnly cite source IDs that are actually provided.\nUse citations such as [1] and [2] when making claims supported by those sources.\n\n${context}\n\nQuestion: ${query}`,
      config: { temperature: 0.2 },
    });
    const answer = response.text?.trim();
    if (!answer) throw new Error('Gemini returned an empty response.');
    return NextResponse.json({ answer: validateCitations(answer, sources.map((source) => source.id)), sources });
  } catch (error) {
    console.error('RAG request failed', error);
    return NextResponse.json({ error: 'Unable to answer this question right now. Please try again.' }, { status: 500 });
  }
}
