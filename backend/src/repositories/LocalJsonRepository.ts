import fs from 'fs';
import * as path from 'path';
import { IUserRepository } from './IUserRepository';
import { User } from '../domain/User';
import { Card } from '../domain/Card';
import { AVAILABLE_EXPANSIONS } from '../expansions';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export class LocalJsonRepository implements IUserRepository {

  // --- MÉTODO PARA LEER CARTAS DE UNA COLECCIÓN ESPECÍFICA ---
  async getCardsByExpansion(expansionId: string): Promise<Card[]> {
    const config = AVAILABLE_EXPANSIONS[expansionId];
    
    // 1. Lógica de nombres: Si es 'dp6' -> cards.json. Si no, lo que diga la config o cards-ID.json
    let fileName = 'cards.json';
    if (expansionId !== 'dp6') {
        fileName = config?.fileName || `cards-${expansionId}.json`;
    }

    const filePath = path.resolve(DATA_DIR, fileName);

    console.log(`📂 Intentando leer archivo: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo no encontrado: ${filePath}`);
        // Fallback al archivo principal para evitar que la app explote
        const basePath = path.join(DATA_DIR, 'cards.json');
        if (!fs.existsSync(basePath)) return [];
        const raw = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
        return raw.cards || [];
    }

    try {
        const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return rawData.cards || [];
    } catch (error) {
        console.error(`❌ Error parseando JSON en ${fileName}:`, error);
        return [];
    }
  }

  // --- MÉTODOS DE PERSISTENCIA CORREGIDOS (Uso de Sync para evitar errores de callback) ---

  private readData(): { users: User[] } {
    try {
      if (!fs.existsSync(USERS_FILE)) return { users: [] };
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed.users ? parsed : { users: [] };
    } catch (error) {
      console.error("⚠️ Error leyendo users.json, devolviendo array vacío.");
      return { users: [] };
    }
  }

  private writeData(data: { users: User[] }): void {
    try {
      // Usamos writeFileSync para evitar el error: TypeError: The "cb" argument must be of type function
      fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error("❌ Error fatal escribiendo en users.json:", error);
    }
  }

  // --- MÉTODOS DE INTERFAZ ---

  async findById(userId: string): Promise<User | null> {
    const data = this.readData();
    const idToFind = String(userId).trim();
    return data.users.find(u => String(u.userId).trim() === idToFind) ?? null;
  }

  async addCardsToAlbum(userId: string, newCards: Card[]): Promise<User> {
    const data = this.readData();
    const idToFind = String(userId).trim();
    
    let userIndex = data.users.findIndex(u => String(u.userId).trim() === idToFind);

    if (userIndex === -1) {
      console.log(`⚠️ Usuario ${idToFind} no encontrado. Creándolo temporalmente...`);
      const newUser: User = {
        userId: idToFind,
        username: "Test User",
        packsAvailable: 10,
        album: [],
        passwordHash: "",
        createdAt: new Date().toISOString(),
        level: 1,
        xp: 0
      };
      data.users.push(newUser);
      userIndex = data.users.length - 1;
    }

    const user = data.users[userIndex];
    let newCardsCount = 0;

    newCards.forEach(card => {
      const cardId = String(card.id).trim();
      const existingEntry = user.album.find(e => String(e.card.id).trim() === cardId);

      if (existingEntry) {
        existingEntry.quantity += 1;
      } else {
        newCardsCount += 1;
        user.album.push({
          card: { ...card, id: cardId },
          quantity: 1,
          obtainedAt: new Date().toISOString()
        });
      }
    });

    // 1. Calcular XP obtenida:
    const xpFromPack = 50;
    const xpFromNewCards = newCardsCount * 20;
    const totalXpGained = xpFromPack + xpFromNewCards;

    // 2. Procesar progresión y subidas de nivel
    let currentLevel = user.level ?? 1;
    let currentXp = user.xp ?? 0;
    let newXp = currentXp + totalXpGained;
    let newLevel = currentLevel;

    while (true) {
      const xpNeeded = 100 + (newLevel - 1) * 50;
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
      } else {
        break;
      }
    }

    user.level = newLevel;
    user.xp = newXp;

    if (user.packsAvailable > 0) user.packsAvailable -= 1;

    this.writeData(data);
    
    console.log(`💾 DB: Álbum de [${user.userId}] actualizado. Total: ${user.album.length} cartas. Level: ${newLevel}, XP: ${newXp}`);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const data = this.readData();
    return data.users.find(u => u.username === username) ?? null;
  }

  async save(user: User): Promise<void> {
    const data = this.readData();
    // Evitar duplicados al guardar
    const index = data.users.findIndex(u => u.userId === user.userId);
    if (index !== -1) {
        data.users[index] = user;
    } else {
        data.users.push(user);
    }
    this.writeData(data);
  }

  async findAll(): Promise<User[]> {
    const data = this.readData();
    return data.users;
  }
}
