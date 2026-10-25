import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type DocumentStatus = 'Ready' | 'Processing' | 'Failed';

export interface IDocument extends MongooseDocument {
  userId: string;
  title: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  chunkCount: number;
  status: DocumentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    pageCount: { type: Number, default: 1 },
    chunkCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Ready', 'Processing', 'Failed'],
      default: 'Processing',
    },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

export const DocumentModel =
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
