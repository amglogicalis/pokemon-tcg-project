import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenBlacklistModel } from '../models/TokenBlacklist';

export interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // 1. Leer token: primero de la cookie httpOnly, luego del header Authorization
  const cookieToken = (req as any).cookies?.token;
  const headerToken = req.headers.authorization?.split(' ')[1];
  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({ error: 'No se proporcionó un token' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET key is missing');
    }

    // 2. Verificar que el token no esté en la blacklist (logout real)
    const isBlacklisted = await TokenBlacklistModel.findOne({ token }).lean();
    if (isBlacklisted) {
      res.status(401).json({ error: 'La sesión ha expirado. Por favor, inicia sesión de nuevo.' });
      return;
    }

    const decoded = jwt.verify(token, secret || 'dev_secret') as any;
    req.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};