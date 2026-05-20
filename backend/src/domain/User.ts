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
  completedExpansions?: string[]; // IDs de expansiones completadas para bonus de XP
  showcasedMedals?: string[]; // IDs de medallas (expansiones) destacadas (máx 3)
  activeTheme?: string;
  mustChangePassword?: boolean;
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
  completedExpansions?: string[];
  showcasedMedals?: string[];
  activeTheme?: string;
  mustChangePassword?: boolean;
}

// Payload dentro del JWT
export interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}
