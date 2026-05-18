import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { MongoUserRepository } from '../repositories/MongoUserRepository';
import { TokenBlacklistModel } from '../models/TokenBlacklist';
import jwt from 'jsonwebtoken';

// Usamos Mongo en lugar de LocalJson
const repo = new MongoUserRepository();
const authService = new AuthService(repo);

// Duración de la cookie en ms (debe coincidir con JWT_EXPIRES_IN)
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'username y password son obligatorios.' });
        return;
      }
      const user = await authService.register(username, password);
      res.status(201).json({ message: 'Usuario creado correctamente.', user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'username y password son obligatorios.' });
        return;
      }
      const { token, user } = await authService.login(username, password);

      // Setear token en cookie httpOnly (no accesible desde JavaScript)
      res.cookie('token', token, {
        httpOnly: true,                                   // JS no puede leerla → inmune a XSS
        secure: process.env.NODE_ENV === 'production',   // Solo HTTPS en producción
        sameSite: 'none',                                 // Necesario para cross-origin (Vercel → Render)
        maxAge: COOKIE_MAX_AGE_MS
      });

      // También devolvemos el token en el body para compatibilidad total con el frontend actual
      res.status(200).json({ token, user });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Obtener token de cookie o del header Authorization
      const cookieToken = (req as any).cookies?.token;
      const headerToken = req.headers.authorization?.split(' ')[1];
      const token = cookieToken || headerToken;

      if (token) {
        // Decodificar para conocer la fecha de expiración real del JWT
        const decoded = jwt.decode(token) as any;
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + COOKIE_MAX_AGE_MS);

        // Añadir a la blacklist con TTL automático de MongoDB
        await TokenBlacklistModel.findOneAndUpdate(
          { token },
          { token, expiresAt },
          { upsert: true }
        );
      }

      // Limpiar la cookie del navegador
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
      });

      res.status(200).json({ message: 'Sesión cerrada correctamente.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al cerrar sesión.' });
    }
  }
}
