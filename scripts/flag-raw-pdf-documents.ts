import { connectToDatabase } from '../lib/db';
import { DocumentModel } from '../models/Document';
import { DocumentChunkModel } from '../models/DocumentChunk';
import { containsPdfSyntax } from '../lib/rag';

async function main() {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('MongoDB is required to flag existing documents.');
  }

  const documents = await DocumentModel.find({ status: { $ne: 'Failed' } }).select('_id').lean();
  let flagged = 0;
  for (const document of documents) {
    const chunks = await DocumentChunkModel.find({ documentId: document._id.toString() })
      .select('text')
      .lean();
    if (!chunks.some((chunk) => containsPdfSyntax(chunk.text))) continue;

    await DocumentModel.updateOne(
      { _id: document._id },
      {
        $set: {
          status: 'Failed',
          errorMessage: 'This document was indexed from raw PDF file data. Please upload the original PDF again to re-process it.',
        },
      }
    );
    flagged += 1;
    console.log(`Flagged ${document._id.toString()} for re-upload.`);
  }

  console.log(`Flagged ${flagged} document(s). Existing documents and chunks were not deleted.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
