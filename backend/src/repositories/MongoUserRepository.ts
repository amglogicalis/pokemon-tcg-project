import { IUserRepository } from './IUserRepository';
import { User } from '../domain/User';
import { Card } from '../domain/Card';
import { UserModel } from '../models/UserModel';

// Importación estática para eliminar dependencias de "fs" y asegurar compatibilidad en Render
import baseCards from '../data/cards.json';
import bw9Cards from '../data/cards-bw9.json';
import xypCards from '../data/cards-xyp.json';

const expansionsData: Record<string, any> = {
  'base': baseCards,
  'bw9': bw9Cards,
  'xyp': xypCards
};

export class MongoUserRepository implements IUserRepository {

  async getCardsByExpansion(expansionId: string): Promise<Card[]> {
    const data = expansionsData[expansionId];
    if (!data || !data.cards) {
      console.warn(`⚠️ Expansión [${expansionId}] no encontrada o inválida. Fallback a 'base'.`);
      return expansionsData['base'].cards || [];
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

    newCards.forEach(card => {
      const cardId = String(card.id).trim();
      const existingEntry = userDoc.album.find(e => String(e.card.id).trim() === cardId);

      if (existingEntry) {
        existingEntry.quantity += 1;
      } else {
        userDoc.album.push({
          card: { ...card, id: cardId },
          quantity: 1,
          obtainedAt: new Date().toISOString()
        });
      }
    });

    if (userDoc.packsAvailable > 0) userDoc.packsAvailable -= 1;

    await userDoc.save();
    console.log(`💾 DB Mongo: Álbum de [${userId}] actualizado. Total: ${userDoc.album.length} cartas unicas.`);
    
    return userDoc.toObject() as User;
  }

  async findAll(): Promise<User[]> {
    const users = await UserModel.find({}).lean();
    return users as User[];
  }
}
