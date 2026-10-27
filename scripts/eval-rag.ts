import { readFileSync } from 'node:fs';
import { extractTextFromPdf, chunkDocument, generateEmbeddings, generateEmbedding, retrieveTopK } from '../lib/rag';

const questions = [
  ['How much leave do employees accrue?', 1, 'leave'],
  ['How many leave days carry over?', 1, 'carry'],
  ['What is the carryover limit?', 1, 'carry'],
  ['When does leave reset?', 1, 'reset'],
  ['Who approves leave requests?', 2, 'approve'],
  ['How far ahead should leave be requested?', 2, 'request'],
  ['What happens during blackout periods?', 2, 'blackout'],
  ['Who is eligible for travel reimbursement?', 3, 'reimbursement'],
  ['What receipts are required?', 3, 'receipt'],
  ['How soon must expenses be submitted?', 3, 'submitted'],
  ['What is the meal limit?', 3, 'meal'],
  ['What requires manager approval?', 4, 'manager'],
  ['How are mileage claims calculated?', 4, 'mileage'],
  ['What is the policy effective date?', 4, 'effective'],
  ['Where should questions be directed?', 4, 'questions'],
] as const;

async function main() {
  const extraction = await extractTextFromPdf(readFileSync('scripts/demo-policy.pdf'));
  const chunks = chunkDocument(extraction.pages);
  const documentEmbeddings = await generateEmbeddings(chunks.map((chunk) => chunk.text));
  const indexed = chunks.map((chunk, index) => ({ ...chunk, embedding: documentEmbeddings[index] }));
  let hit1 = 0;
  let hit3 = 0;
  let answerContainsExpected = 0;

  for (const [question, expectedPage, expectedTerm] of questions) {
    const query = await generateEmbedding(question);
    const results = retrieveTopK(query, indexed, 3);
    if (results[0]?.pageNumber === expectedPage) hit1++;
    if (results.some((result) => result.pageNumber === expectedPage)) hit3++;
    if (results.some((result) => result.pageNumber === expectedPage && result.text.toLowerCase().includes(expectedTerm))) {
      answerContainsExpected++;
    }
  }

  console.log(JSON.stringify({
    questions: questions.length,
    hitAt1: hit1 / questions.length,
    hitAt3: hit3 / questions.length,
    answerContainsExpected: answerContainsExpected / questions.length,
  }));
}

void main();
