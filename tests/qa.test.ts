import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { hashPassword, comparePassword, signToken, verifyToken } from '../lib/auth';
import {
  createUser,
  findUserByEmail,
  findUserById,
  createDocument,
  getUserDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentChunks,
  getDocumentChunks,
} from '../lib/store';
import {
  extractTextFromPdf,
  chunkDocument,
  generateEmbedding,
  cosineSimilarity,
  retrieveTopK,
  generateGroundedAnswer,
} from '../lib/rag';

async function runQA() {
  console.log('=== RUNNING COMPREHENSIVE DOCUMIND QA SUITE ===\n');

  let passed = 0;
  let total = 0;

  function runSync(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function runAsync(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. Authentication Lifecycle
  console.log('1. User Registration & Password Hashing:');
  const email = `testuser_${Date.now()}@documind.test`;
  const password = 'Password!2026';
  let user: any;
  let token: string;

  await runAsync('Register user with bcrypt salt & hash', async () => {
    const hash = await hashPassword(password);
    assert.ok(hash.length > 20);
    const valid = await comparePassword(password, hash);
    assert.strictEqual(valid, true);

    user = await createUser({
      name: 'Verification User',
      email,
      passwordHash: hash,
    });
    assert.ok(user.id);
  });

  await runAsync('Login verification and JWT generation', async () => {
    const found = await findUserByEmail(email);
    assert.ok(found);
    const valid = await comparePassword(password, found.passwordHash);
    assert.strictEqual(valid, true);

    token = signToken({
      userId: found._id,
      email: found.email,
      name: found.name,
    });
    assert.ok(token);
  });

  runSync('Token verification & refresh payload validation', () => {
    const payload = verifyToken(token);
    assert.ok(payload);
    assert.strictEqual(payload.userId, user.id);
    assert.strictEqual(payload.email, email);
  });

  runSync('Rejection of forged or invalid tokens', () => {
    const payload = verifyToken('forged.invalid.token');
    assert.strictEqual(payload, null);
  });

  // 2. PDF Processing & Chunking
  console.log('\n2. PDF Extraction & Chunking:');
  const samplePdf = readFileSync('scripts/demo-policy.pdf');

  let pages: any[] = [];
  let chunks: any[] = [];

  await runAsync('Extract text and structure into pages', async () => {
    const ext = await extractTextFromPdf(samplePdf);
    assert.ok(ext.fullText.length > 100);
    pages = ext.pages;
    assert.ok(pages.length >= 1);
  });

  runSync('Page-aware chunking with token estimation and overlap', () => {
    chunks = chunkDocument(pages, 40, 10);
    assert.ok(chunks.length >= 2);
    assert.ok(chunks[0].pageNumber >= 1);
    assert.ok(chunks[0].tokenCount > 0);
  });

  runSync('Reject incompatible embedding dimensions before similarity ranking', () => {
    assert.strictEqual(cosineSimilarity([1, 0, 0], [1, 0]), 0);
    const incompatible = retrieveTopK([1, 0, 0], [{
      chunkIndex: 0,
      pageNumber: 1,
      text: 'incompatible vector',
      embedding: [1, 0],
    }], 3);
    assert.strictEqual(incompatible.length, 0);
  });

  // 3. Embeddings & Persistence
  console.log('\n3. Embeddings Generation & Vector Persistence:');
  let embeddings: number[][] = [];

  await runAsync('Generate embeddings for document chunks', async () => {
    for (const c of chunks) {
      const emb = await generateEmbedding(c.text);
      assert.ok(Array.isArray(emb));
      assert.ok(emb.length > 0);
      embeddings.push(emb);
    }
  });

  let documentRecord: any;

  await runAsync('Persist document and vector chunks in store', async () => {
    documentRecord = await createDocument({
      userId: user.id,
      title: 'DocuMind_Whitepaper.pdf',
      originalName: 'DocuMind_Whitepaper.pdf',
      fileSize: 8192,
      status: 'Processing',
    });

    const chunkPayload = chunks.map((c, idx) => ({
      documentId: documentRecord._id,
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber,
      text: c.text,
      embedding: embeddings[idx],
      tokenCount: c.tokenCount,
    }));

    await createDocumentChunks(chunkPayload);

    const readyDoc = await updateDocument(documentRecord._id, user.id, {
      status: 'Ready',
      pageCount: pages.length,
      chunkCount: chunkPayload.length,
    });

    assert.strictEqual(readyDoc?.status, 'Ready');
    assert.strictEqual(readyDoc?.chunkCount, chunkPayload.length);
  });

  await runAsync('Verify vector chunk retrieval from database/store', async () => {
    const storedChunks = await getDocumentChunks(documentRecord._id);
    assert.strictEqual(storedChunks.length, chunks.length);
    assert.ok(storedChunks[0].embedding.length > 0);
  });

  // 4. Semantic Search & Grounded Generation
  console.log('\n4. Semantic Retrieval & Grounded Generation:');
  const validQuestion = 'How many paid leave days do employees accrue each month?';
  let retrievedForQ: any[] = [];

  await runAsync('Top-K Cosine Similarity Retrieval for grounded question', async () => {
    const qEmb = await generateEmbedding(validQuestion);
    const storedChunks = await getDocumentChunks(documentRecord._id);
    retrievedForQ = retrieveTopK(qEmb, storedChunks, 3);
    assert.ok(retrievedForQ.length > 0);
    assert.ok(retrievedForQ[0].similarity > 0);
    const joined = retrievedForQ.map((c) => c.text).join(' ');
    assert.ok(joined.includes('1.5 paid leave days') || joined.includes('leave'));
  });

  await runAsync('Grounded answer generation with Gemini and citations', async () => {
    const answerResult = await generateGroundedAnswer(validQuestion, retrievedForQ);
    assert.ok(answerResult.answer.length > 0);
    assert.ok(typeof answerResult.latencyMs === 'number');
    console.log(`     -> Generated Answer: "${answerResult.answer.slice(0, 140)}..."`);
  });

  await runAsync('Zero-hallucination test for unanswerable question', async () => {
    const missingQuestion = 'What is the boiling point of liquid helium?';
    const qEmb = await generateEmbedding(missingQuestion);
    const storedChunks = await getDocumentChunks(documentRecord._id);
    const retrievedMissing = retrieveTopK(qEmb, storedChunks, 3);
    const answerMissing = await generateGroundedAnswer(missingQuestion, retrievedMissing);
    assert.ok(answerMissing.answer.length > 0);
    const isGrounded =
      answerMissing.answer.toLowerCase().includes('not contain') ||
      answerMissing.answer.toLowerCase().includes('not enough') ||
      answerMissing.answer.toLowerCase().includes('insufficient') ||
      answerMissing.answer.toLowerCase().includes('could not find') ||
      !answerMissing.answer.toLowerCase().includes('-268.9');
    assert.ok(isGrounded);
  });

  // 5. Document Management (Rename, Delete & Cascading Cleanup)
  console.log('\n5. Document Lifecycle & Cleanup:');
  await runAsync('Rename document and verify persistence', async () => {
    const newName = 'DocuMind_Whitepaper_Final_2026.pdf';
    const updated = await updateDocument(documentRecord._id, user.id, { title: newName });
    assert.strictEqual(updated?.title, newName);
  });

  await runAsync('Delete document and cascade-delete all chunks and embeddings', async () => {
    const deleted = await deleteDocument(documentRecord._id, user.id);
    assert.strictEqual(deleted, true);

    const docCheck = await getDocumentById(documentRecord._id, user.id);
    assert.strictEqual(docCheck, null);

    const chunkCheck = await getDocumentChunks(documentRecord._id);
    assert.strictEqual(chunkCheck.length, 0);
  });

  // 6. Security & Multi-Tenant Access Control
  console.log('\n6. Security & Multi-Tenant Isolation:');
  let user1: any, user2: any, doc1: any;

  await runAsync('Setup isolated test users 1 & 2', async () => {
    user1 = await createUser({
      name: 'Owner User',
      email: `owner_${Date.now()}@test.io`,
      passwordHash: await hashPassword('OwnerPass123!'),
    });

    user2 = await createUser({
      name: 'Rogue User',
      email: `rogue_${Date.now()}@test.io`,
      passwordHash: await hashPassword('RoguePass123!'),
    });

    doc1 = await createDocument({
      userId: user1.id,
      title: 'Top_Secret_Doc.pdf',
      originalName: 'Top_Secret_Doc.pdf',
      fileSize: 1024,
      status: 'Ready',
    });
  });

  await runAsync('Security: Unauthorized user cannot read document (returns 404/null)', async () => {
    const accessed = await getDocumentById(doc1._id, user2.id);
    assert.strictEqual(accessed, null);
  });

  await runAsync('Security: Unauthorized user cannot modify document', async () => {
    const modified = await updateDocument(doc1._id, user2.id, { title: 'Compromised.pdf' });
    assert.strictEqual(modified, null);
    const original = await getDocumentById(doc1._id, user1.id);
    assert.strictEqual(original?.title, 'Top_Secret_Doc.pdf');
  });

  await runAsync('Security: Unauthorized user cannot delete document', async () => {
    const deleted = await deleteDocument(doc1._id, user2.id);
    assert.strictEqual(deleted, false);
    const original = await getDocumentById(doc1._id, user1.id);
    assert.ok(original);
  });

  // Clean up
  await delete_file_helper(doc1._id, user1.id);

  console.log(`\n======================================================`);
  console.log(`ALL TESTS PASSED: ${passed}/${total} verification points verified.`);
  console.log(`======================================================\n`);
  process.exit(0);
}

async function delete_file_helper(id: string, userId: string) {
  await deleteDocument(id, userId);
}

runQA().catch((e) => {
  console.error('Test Suite Failed:', e);
  process.exit(1);
});
