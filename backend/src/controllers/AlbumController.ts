import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { MongoUserRepository } from '../repositories/MongoUserRepository';

// Importación estática para asegurar compatibilidad
import baseCards from '../data/cards.json';
import bw9Cards from '../data/cards-bw9.json';
import xypCards from '../data/cards-xyp.json';
import zsv10pt5Cards from '../data/cards-zsv10pt5.json';
import sm3Cards from '../data/cards-sm3.json';

const repo = new MongoUserRepository();

export class AlbumController {
  async getAlbum(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }
      
      const user = await repo.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado.' });
        return;
      }

      const allCardsMap = new Map<string, any>();
      
      const addCardsToMap = (cardsArray: any[], sourceName: string) => {
        if (!cardsArray) return;
        cardsArray.forEach((card: any) => {
          const cleanId = String(card.id).trim();
          allCardsMap.set(cleanId, { ...card, expansionSource: sourceName });
        });
      };

      addCardsToMap(baseCards.cards, 'cards.json');
      addCardsToMap(bw9Cards.cards, 'cards-bw9.json');
      addCardsToMap(xypCards.cards, 'cards-xyp.json');
      addCardsToMap(zsv10pt5Cards.cards, 'cards-zsv10pt5.json');
      addCardsToMap(sm3Cards.cards, 'cards-sm3.json');

      const synchronizedAlbum = user.album.reduce((acc: any[], entry) => {
        const targetId = String(entry.card.id).trim();
        const freshCardData = allCardsMap.get(targetId);

        if (freshCardData) {
          acc.push({
            ...entry,
            card: { ...freshCardData }
          });
        }
        return acc;
      }, []);

      res.status(200).json({
        username: user.username,
        packsAvailable: user.packsAvailable,
        totalCards: synchronizedAlbum.reduce((sum, e) => sum + e.quantity, 0),
        uniqueCards: synchronizedAlbum.length,
        album: synchronizedAlbum,
      });

    } catch (err: any) {
      console.error("❌ ERROR CRÍTICO EN ALBUM CONTROLLER:", err);
      res.status(500).json({ error: err.message });
    }
  }
}
