import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocumentChunk extends MongooseDocument {
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  text: string;
  embedding: number[];
  tokenCount: number;
  createdAt: Date;
  isDemo?: boolean;
  isTemplate?: boolean;
  expiresAt?: Date;
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
    isDemo: { type: Boolean, default: false, index: true },
    isTemplate: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, index: true, expires: 0 },
  },
  {
    timestamps: true,
  }
);

export const DocumentChunkModel =
  mongoose.models.DocumentChunk ||
  mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
