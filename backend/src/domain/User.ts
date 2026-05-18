import { AlbumEntry } from './Card';

export interface User {
  userId: string;       // UUID — será la Partition Key en DynamoDB
  username: string;
  passwordHash: string; // bcrypt hash, NUNCA el password plano
  packsAvailable: number;
  album: AlbumEntry[];
  createdAt: string;    // ISO 8601
  favoriteCardId?: string;
  level?: number;
  xp?: number;
  lastPackClaimedAt?: string; // ISO 8601 de la última recarga diaria de 10 sobres
}

// Lo que devolvemos al cliente (sin datos sensibles)
export interface PublicUser {
  userId: string;
  username: string;
  packsAvailable: number;
  totalCards: number;
  level: number;
  xp: number;
  lastPackClaimedAt?: string;
}

// Payload dentro del JWT
export interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}
