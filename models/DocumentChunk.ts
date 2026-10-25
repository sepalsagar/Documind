import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocumentChunk extends MongooseDocument {
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  text: string;
  embedding: number[];
  tokenCount: number;
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: 1 },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    tokenCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const DocumentChunkModel =
  mongoose.models.DocumentChunk ||
  mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
