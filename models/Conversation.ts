import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IConversation extends MongooseDocument {
  userId: string;
  documentId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    title: { type: String, default: 'New chat' },
    expiresAt: { type: Date, index: true, expires: 0 },
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, documentId: 1, updatedAt: -1 });

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
