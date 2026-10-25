import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IRateLimitCounter extends MongooseDocument {
  key: string;
  count: number;
  expiresAt: Date;
}

const RateLimitCounterSchema = new Schema<IRateLimitCounter>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const RateLimitCounterModel =
  mongoose.models.RateLimitCounter ||
  mongoose.model<IRateLimitCounter>('RateLimitCounter', RateLimitCounterSchema);
