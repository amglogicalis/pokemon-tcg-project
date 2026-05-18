import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { NotificationModel } from '../models/NotificationModel';

export class NotificationController {
  
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      // Obtener todas las notificaciones del usuario ordenadas por fecha descendente
      const notifications = await NotificationModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.status(200).json(notifications);
    } catch (err: any) {
      console.error("❌ ERROR EN getNotifications:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      await NotificationModel.updateMany(
        { userId, status: 'unread' },
        { $set: { status: 'read' } }
      );

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("❌ ERROR EN markAllAsRead:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async clearNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      await NotificationModel.deleteMany({ userId });

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("❌ ERROR EN clearNotifications:", err);
      res.status(500).json({ error: err.message });
    }
  }
}
