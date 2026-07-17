import mongoose, { Model, Schema } from 'mongoose';

export interface IDocumentChunk {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  pageNumber: number;
  pageEnd: number;
  chunkIndex: number;
  text: string;
  wordCount: number;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  pageNumber: { type: Number, required: true, min: 1 },
  pageEnd: { type: Number, required: true, min: 1 },
  chunkIndex: { type: Number, required: true, min: 0 },
  text: { type: String, required: true },
  wordCount: { type: Number, required: true, min: 0 },
  embedding: { type: [Number], required: true, select: false },
}, { timestamps: true });

DocumentChunkSchema.index({ userId: 1, documentId: 1, chunkIndex: 1 }, { unique: true });
export const DocumentChunkModel: Model<IDocumentChunk> = mongoose.models.DocumentChunk || mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
