import fs from 'node:fs/promises';
import path from 'node:path';
import { connectToDatabase } from '../lib/db';
import { extractTextFromPdf, chunkDocument, generateEmbedding } from '../lib/rag';
import { createDocument, createDocumentChunks } from '../lib/store';
import { DocumentModel } from '../models/Document';
import { DocumentChunkModel } from '../models/DocumentChunk';

const TEMPLATE_USER_ID = '__demo_template__';
const pdfPath = path.join(process.cwd(), 'scripts', 'demo-policy.pdf');

function createPdf(pages: string[]): Buffer {
  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  pages.forEach((text, i) => {
    const pageObject = 3 + i * 2;
    const contentObject = pageObject + 1;
    const stream = `BT /F1 14 Tf 72 740 Td 18 TL (${text.replace(/[()\\]/g, '\\$&')}) Tj ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObject} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(output);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(output);
}

async function seed() {
  const pages = [
    'Northstar Labs Leave and Expense Policy - Overview. Full-time team members receive paid annual leave and company travel expenses are reimbursed when submitted with receipts.',
    'Leave policy. Employees accrue 1.5 paid leave days each month. Requests should be submitted to a manager at least five working days before planned leave, except emergencies.',
    'Expense policy. Business travel must be pre-approved. Submit an expense report within 30 days, include itemized receipts, and use the company travel card when available.',
    'Questions and exceptions. Managers approve requests in the team calendar. People Operations handles questions about leave balances, while Finance reviews expense exceptions.',
  ];
  const pdf = createPdf(pages);
  await fs.writeFile(pdfPath, pdf);
  const extraction = await extractTextFromPdf(pdf);
  const chunks = chunkDocument(extraction.pages, 100, 15);
  const db = await connectToDatabase();
  if (db) {
    await DocumentChunkModel.deleteMany({ documentId: { $in: await DocumentModel.find({ isTemplate: true, userId: TEMPLATE_USER_ID }).distinct('_id') } });
    await DocumentModel.deleteMany({ isTemplate: true, userId: TEMPLATE_USER_ID });
  }
  const document = await createDocument({
    userId: TEMPLATE_USER_ID,
    title: 'Northstar Labs Leave & Expense Policy.pdf',
    originalName: 'northstar-leave-expense-policy.pdf',
    fileSize: pdf.length,
    pageCount: extraction.pageCount,
    status: 'Ready',
    isTemplate: true,
  });
  await createDocumentChunks(await Promise.all(chunks.map(async (chunk) => ({
    ...chunk,
    documentId: document._id,
    embedding: await generateEmbedding(chunk.text),
    isTemplate: true,
    tokenCount: chunk.tokenCount,
  }))));
  console.log(`Seeded demo template ${document._id} with ${chunks.length} chunks at ${pdfPath}`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
