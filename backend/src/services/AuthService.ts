import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../repositories/IUserRepository';
import { User, JwtPayload, PublicUser } from '../domain/User';

const SALT_ROUNDS = 10;

// Control de JWT_SECRET al cargar el módulo: sin fallback inseguro en producción
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ERROR CRÍTICO: JWT_SECRET no está configurada en producción. Deteniendo el servicio.');
  }
  return 'dev_secret';
})();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h';
const INITIAL_PACKS = 10;


export class AuthService {
  constructor(private readonly userRepo: IUserRepository) {}

  async register(username: string, password: string): Promise<PublicUser> {
    // Validaciones básicas
    if (!username || username.length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    if (!password || password.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      throw new Error('La contraseña debe tener al menos 8 caracteres e incluir al menos una letra y un número.');
    }

    // Comprobar duplicado — mensaje claro indicando que ya existe
    const existing = await this.userRepo.findByUsername(username);
    if (existing) {
      throw new Error('El nombre de usuario ya está registrado. Por favor, elige otro.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser: User = {
      userId: uuidv4(),
      username,
      passwordHash,
      packsAvailable: INITIAL_PACKS,
      album: [],
      createdAt: new Date().toISOString(),
      level: 1,
      xp: 0
    };

    await this.userRepo.save(newUser);

    return this.toPublicUser(newUser);
  }

  async login(username: string, password: string): Promise<{ token: string; user: PublicUser }> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new Error('Credenciales incorrectas.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Credenciales incorrectas.');
    }

    const payload: JwtPayload = {
      userId: user.userId,
      username: user.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return { token, user: this.toPublicUser(user) };
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }

  async changePasswordForce(userId: string, newPassword: string): Promise<PublicUser> {
    if (!newPassword || newPassword.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      throw new Error('La contraseña debe tener al menos 8 caracteres e incluir al menos una letra y un número.');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;

    await this.userRepo.save(user);

    return this.toPublicUser(user);
  }

  private toPublicUser(user: User): PublicUser {
    return {
      userId: user.userId,
      username: user.username,
      packsAvailable: user.packsAvailable,
      totalCards: user.album.reduce((sum, e) => sum + e.quantity, 0),
      level: user.level ?? 1,
      xp: user.xp ?? 0,
      lastPackClaimedAt: user.lastPackClaimedAt,
      completedExpansions: user.completedExpansions || [],
      showcasedMedals: user.showcasedMedals || [],
      activeTheme: user.activeTheme || 'default',
      mustChangePassword: user.mustChangePassword
    };
  }
}
