import { User } from '../domain/User';
import { Card } from '../domain/Card';

/**
 * Contrato de persistencia para usuarios.
 * La demo usa LocalJsonRepository.
 * En AWS se sustituye por DynamoDBRepository sin tocar los servicios.
 */
export interface IUserRepository {
  /**
   * Busca un usuario por nombre de usuario.
   * Devuelve null si no existe.
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Busca un usuario por su ID único.
   * Devuelve null si no existe.
   */
  findById(userId: string): Promise<User | null>;

  /**
   * Persiste un usuario nuevo.
   * Lanza error si el username ya existe.
   */
  save(user: User): Promise<void>;

  /**
   * Añade cartas al álbum del usuario y descuenta el sobre.
   * Implementación atómica (en DynamoDB usará UpdateExpression).
   */
  addCardsToAlbum(userId: string, newCards: Card[]): Promise<User>;

  /**
   * Devuelve todos los usuarios (útil para debug local).
   */
  findAll(): Promise<User[]>;
}
