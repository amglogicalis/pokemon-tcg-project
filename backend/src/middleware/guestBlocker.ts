import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const guestBlocker = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.userId === 'guest') {
    res.status(403).json({ 
      error: 'Acción no disponible en el modo de invitado. Regístrate para disfrutar de todas las funciones.' 
    });
    return;
  }
  next();
};
