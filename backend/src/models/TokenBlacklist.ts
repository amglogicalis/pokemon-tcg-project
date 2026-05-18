import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenBlacklistDocument extends Document {
  token: string;
  expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklistDocument>({
  token: { type: String, required: true, unique: true, index: true },
  // TTL index: MongoDB borra el documento automáticamente cuando expire el token
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

export const TokenBlacklistModel = mongoose.model<ITokenBlacklistDocument>(
  'TokenBlacklist',
  TokenBlacklistSchema
);
