import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó un token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Esto verifica que el token sea válido con tu JWT_SECRET del .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};