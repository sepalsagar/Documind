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
  isDemo?: boolean;
  isTemplate?: boolean;
  expiresAt?: Date;
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
    isDemo: { type: Boolean, default: false, index: true },
    isTemplate: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, index: true, expires: 0 },
  },
  {
    timestamps: true,
  }
);

export const DocumentModel =
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
