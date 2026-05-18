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

      // FIX: Obtener al usuario primero para verificar si tiene sobres disponibles
      const user = await repo.findById(userId);
      if (!user) throw new Error("Usuario no encontrado");
      
      if (user.packsAvailable <= 0) {
        res.status(400).json({ error: "No tienes sobres disponibles" });
        return;
      }

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
        packsRemaining: updatedUser.packsAvailable,
        level: updatedUser.level ?? 1,
        xp: updatedUser.xp ?? 0
      });

    } catch (error: any) {
      console.error("❌ Error en PackController:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async claimDailyPacks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId; 
      if (!userId) throw new Error("No autenticado");

      const user = await repo.findById(userId);
      if (!user) throw new Error("Usuario no encontrado");

      const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 horas

      if (user.lastPackClaimedAt) {
        const lastClaimed = new Date(user.lastPackClaimedAt).getTime();
        const timeElapsed = Date.now() - lastClaimed;
        
        if (timeElapsed < CLAIM_COOLDOWN_MS) {
          const remainingMs = CLAIM_COOLDOWN_MS - timeElapsed;
          res.status(400).json({
            error: "Aún no puedes recargar tus sobres. Por favor espera a que termine el temporizador.",
            remainingMs
          });
          return;
        }
      }

      // Añadir 10 sobres y actualizar marca de tiempo
      user.packsAvailable = (user.packsAvailable || 0) + 10;
      user.lastPackClaimedAt = new Date().toISOString();

      await repo.save(user);

      res.status(200).json({
        message: "¡Sobres recargados correctamente! Has recibido 10 sobres.",
        packsAvailable: user.packsAvailable,
        lastPackClaimedAt: user.lastPackClaimedAt
      });

    } catch (error: any) {
      console.error("❌ Error en claimDailyPacks:", error);
      res.status(500).json({ error: error.message });
    }
  }
}
