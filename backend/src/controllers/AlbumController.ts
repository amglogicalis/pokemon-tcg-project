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
      
      const addCardsToMap = (cardsArray: any[], sourceName: string, expansionId: string) => {
        if (!cardsArray) return;
        cardsArray.forEach((card: any) => {
          const cleanId = String(card.id).trim();
          allCardsMap.set(cleanId, { 
            ...card, 
            expansionSource: sourceName,
            expansion: card.expansion || expansionId 
          });
        });
      };

      addCardsToMap(baseCards.cards, 'cards.json', 'dp6');
      addCardsToMap(bw9Cards.cards, 'cards-bw9.json', 'bw9');
      addCardsToMap(xypCards.cards, 'cards-xyp.json', 'xyp');
      addCardsToMap(zsv10pt5Cards.cards, 'cards-zsv10pt5.json', 'zsv10pt5');
      addCardsToMap(sm3Cards.cards, 'cards-sm3.json', 'sm3');

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
        favoriteCardId: user.favoriteCardId,
        level: user.level ?? 1,
        xp: user.xp ?? 0,
        lastPackClaimedAt: user.lastPackClaimedAt
      });

    } catch (err: any) {
      console.error("❌ ERROR CRÍTICO EN ALBUM CONTROLLER:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async setFavoriteCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }
      
      const { cardId } = req.body;

      const user = await repo.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado.' });
        return;
      }

      // Si cardId es null o vacío → desmarcar favorita
      if (!cardId) {
        user.favoriteCardId = undefined;
        await repo.save(user);
        res.status(200).json({ message: 'Carta favorita eliminada.', favoriteCardId: null });
        return;
      }

      // Validar si el usuario posee la carta en su álbum
      const cleanId = String(cardId).trim().toLowerCase();
      const hasCard = user.album.some(entry => String(entry.card.id).trim().toLowerCase() === cleanId);
      
      if (!hasCard) {
        res.status(400).json({ error: 'No puedes marcar como favorita una carta que no posees.' });
        return;
      }

      // Guardar el ID de la favorita
      user.favoriteCardId = cardId;
      await repo.save(user);

      res.status(200).json({ message: 'Carta favorita actualizada correctamente.', favoriteCardId: cardId });
    } catch (err: any) {
      console.error("❌ ERROR EN SET FAVORITE CARD:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async getMural(req: any, res: Response): Promise<void> {
    try {
      const users = await repo.findAll();
      const allCardsMap = new Map<string, any>();
      
      const addCardsToMap = (cardsArray: any[], sourceName: string, expansionId: string) => {
        if (!cardsArray) return;
        cardsArray.forEach((card: any) => {
          const cleanId = String(card.id).trim();
          allCardsMap.set(cleanId, { 
            ...card, 
            expansionSource: sourceName,
            expansion: card.expansion || expansionId 
          });
        });
      };

      addCardsToMap(baseCards.cards, 'cards.json', 'dp6');
      addCardsToMap(bw9Cards.cards, 'cards-bw9.json', 'bw9');
      addCardsToMap(xypCards.cards, 'cards-xyp.json', 'xyp');
      addCardsToMap(zsv10pt5Cards.cards, 'cards-zsv10pt5.json', 'zsv10pt5');
      addCardsToMap(sm3Cards.cards, 'cards-sm3.json', 'sm3');

      const muralEntries: any[] = [];

      users.forEach(user => {
        if (user.favoriteCardId) {
          const cleanId = String(user.favoriteCardId).trim();
          const cardData = allCardsMap.get(cleanId);
          if (cardData) {
            muralEntries.push({
              username: user.username,
              userLevel: user.level ?? 1,
              card: cardData
            });
          }
        }
      });

      res.status(200).json({ mural: muralEntries });
    } catch (err: any) {
      console.error("❌ ERROR EN GET MURAL:", err);
      res.status(500).json({ error: err.message });
    }
  }
}
