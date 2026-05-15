import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { MongoUserRepository } from '../repositories/MongoUserRepository';
import { openPack } from '../services/PackOpenerService';
import { Card } from '../domain/Card';
import { AVAILABLE_EXPANSIONS } from '../expansions'; 

const repo = new MongoUserRepository();

export class PackController {
  async openPack(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Ahora usamos el ID extraído de forma segura por el JWT
      const userId = req.user?.userId; 
      if (!userId) throw new Error("No autenticado");

      const { expansion } = req.body; 

      const config = AVAILABLE_EXPANSIONS[expansion];
      let ALL_CARDS: Card[] = [];

      if (config) {
        ALL_CARDS = await repo.getCardsByExpansion(expansion);
      } else {
        console.warn(`⚠️ Expansión [${expansion}] no encontrada en config. Usando 'dp6'.`);
        ALL_CARDS = await repo.getCardsByExpansion('dp6');
      }

      if (!ALL_CARDS || ALL_CARDS.length === 0) {
        throw new Error(`Catálogo vacío o archivo no encontrado para: ${expansion}`);
      }

      const drawnCards = openPack(ALL_CARDS, 5);
      const updatedUser = await repo.addCardsToAlbum(userId, drawnCards);

      res.status(200).json({
        cards: drawnCards,
        packsRemaining: updatedUser.packsAvailable
      });

    } catch (error: any) {
      console.error("❌ Error en PackController:", error);
      res.status(500).json({ error: error.message });
    }
  }
}
