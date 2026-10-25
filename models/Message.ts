import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type MessageRole = 'user' | 'assistant';

export interface IMessageSource {
  page: number;
  chunkId: string;
  score: number;
}

export interface IMessage extends MongooseDocument {
  conversationId: string;
  userId: string;
  documentId: string;
  role: MessageRole;
  content: string;
  sources: IMessageSource[];
  createdAt: Date;
  expiresAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: {
      type: [{ page: Number, chunkId: String, score: Number }],
      default: [],
    },
    expiresAt: { type: Date, index: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
