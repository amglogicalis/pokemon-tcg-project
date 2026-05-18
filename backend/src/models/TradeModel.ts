import mongoose, { Schema, Document } from 'mongoose';

export interface ITradeDocument extends Document {
  senderId: string;
  senderUsername: string;
  receiverId?: string;
  receiverUsername?: string;
  senderCardId: string;
  senderCardData: any;
  receiverCardId: string;
  receiverCardData: any;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

const TradeSchema = new Schema<ITradeDocument>({
  senderId: { type: String, required: true },
  senderUsername: { type: String, required: true },
  receiverId: { type: String, required: false },
  receiverUsername: { type: String, required: false },
  senderCardId: { type: String, required: true },
  senderCardData: { type: Schema.Types.Mixed, required: true },
  receiverCardId: { type: String, required: true },
  receiverCardData: { type: Schema.Types.Mixed, required: true },
  status: { type: String, required: true, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
  createdAt: { type: String, required: true, default: () => new Date().toISOString() }
});

export const TradeModel = mongoose.model<ITradeDocument>('Trade', TradeSchema);
