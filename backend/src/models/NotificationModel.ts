import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: string;
  message: string;
  type: string;
  status: 'unread' | 'read';
  createdAt: string;
}

const NotificationSchema = new Schema<INotificationDocument>({
  userId: { type: String, required: true, index: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true, default: 'unread', enum: ['unread', 'read'] },
  createdAt: { type: String, required: true, default: () => new Date().toISOString() }
});

export const NotificationModel = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
