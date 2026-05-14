import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../domain/User';

export interface IUserDocument extends Omit<User, 'userId'>, Document {
  userId: string;
}

const AlbumEntrySchema = new Schema({
  card: { type: Schema.Types.Mixed, required: true },
  quantity: { type: Number, required: true, default: 1 },
  obtainedAt: { type: String, required: false }
}, { _id: false });

const UserSchema = new Schema<IUserDocument>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  packsAvailable: { type: Number, required: true, default: 10 },
  album: { type: [AlbumEntrySchema], default: [] },
  createdAt: { type: String, required: true, default: () => new Date().toISOString() }
});

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);

