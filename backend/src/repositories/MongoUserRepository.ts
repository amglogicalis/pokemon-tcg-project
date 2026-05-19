import { IUserRepository } from './IUserRepository';
import { User } from '../domain/User';
import { Card } from '../domain/Card';
import { UserModel } from '../models/UserModel';
import { ProgressionService } from '../services/ProgressionService';

// Importación estática para asegurar compatibilidad
import dp6Cards from '../data/cards.json';
import swsh12Cards from '../data/cards-swsh12.json';
import sm3Cards from '../data/cards-sm3.json';
import bw9Cards from '../data/cards-bw9.json';
import xypCards from '../data/cards-xyp.json';
import zsv10pt5Cards from '../data/cards-zsv10pt5.json';

const expansionsData: Record<string, any> = { 
  'swsh12': swsh12Cards, 
  'sm3': sm3Cards, 
  'dp6': dp6Cards,
  'bw9': bw9Cards,
  'xyp': xypCards,
  'zsv10pt5': zsv10pt5Cards
};

export class MongoUserRepository implements IUserRepository {

  async getCardsByExpansion(expansionId: string): Promise<Card[]> {
    const data = expansionsData[expansionId];
    if (!data || !data.cards) {
      console.warn(`⚠️ Expansión [${expansionId}] no encontrada o inválida. Fallback a 'dp6'.`);
      return expansionsData['dp6'].cards || [];
    }
    return data.cards;
  }

  async findById(userId: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ userId }).lean();
    return userDoc ? (userDoc as User) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ username }).lean();
    return userDoc ? (userDoc as User) : null;
  }

  async save(user: User): Promise<void> {
    await UserModel.findOneAndUpdate(
      { userId: user.userId },
      { $set: user },
      { upsert: true, new: true }
    );
  }

  async addCardsToAlbum(userId: string, newCards: Card[]): Promise<User> {
    const userDoc = await UserModel.findOne({ userId });
    
    if (!userDoc) {
      throw new Error(`Usuario ${userId} no encontrado para añadir cartas.`);
    }

    let newCardsCount = 0;

    newCards.forEach(card => {
      const cardId = String(card.id).trim();
      const existingEntry = userDoc.album.find(e => String(e.card.id).trim() === cardId);

      if (existingEntry) {
        existingEntry.quantity += 1;
      } else {
        newCardsCount += 1;
        userDoc.album.push({
          card: { ...card, id: cardId },
          quantity: 1,
          obtainedAt: new Date().toISOString()
        });
      }
    });

    // 1. Calcular XP obtenida:
    // - Abrir el sobre: 50 XP
    // - Cada carta nueva coleccionada: 20 XP
    const xpFromPack = 50;
    const xpFromNewCards = newCardsCount * 20;
    const totalXpGained = xpFromPack + xpFromNewCards;

    // 2. Procesar progresión y subidas de nivel usando ProgressionService
    const oldPacks = userDoc.packsAvailable;
    const oldLevel = userDoc.level ?? 1;

    ProgressionService.applyProgression(userDoc, totalXpGained);

    if (userDoc.packsAvailable > 0) {
      userDoc.packsAvailable -= 1; // Descontar el sobre abierto
    }

    await userDoc.save();
    console.log(`💾 DB Mongo: Álbum de [${userId}] actualizado. Total: ${userDoc.album.length} cartas unicas. Level: ${userDoc.level}, XP: ${userDoc.xp} (Gained: ${totalXpGained} XP, Rewards: ${userDoc.packsAvailable - oldPacks + 1} packs)`);
    
    return userDoc.toObject() as User;
  }

  async findAll(): Promise<User[]> {
    const users = await UserModel.find({}).lean();
    return users as User[];
  }
}


