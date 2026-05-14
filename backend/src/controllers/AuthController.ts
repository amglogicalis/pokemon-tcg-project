import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { MongoUserRepository } from '../repositories/MongoUserRepository';

// Usamos Mongo en lugar de LocalJson
const repo = new MongoUserRepository();
const authService = new AuthService(repo);

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
      res.status(200).json({ token, user });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }
}
