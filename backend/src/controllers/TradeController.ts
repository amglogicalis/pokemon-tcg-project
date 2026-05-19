import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserModel } from '../models/UserModel';
import { TradeModel } from '../models/TradeModel';
import { NotificationModel } from '../models/NotificationModel';
import { ProgressionService } from '../services/ProgressionService';

// Estructura estática para catalogar todas las cartas y facilitar búsquedas instantáneas
import baseCards from '../data/cards.json';
import swsh12Cards from '../data/cards-swsh12.json';
import bw9Cards from '../data/cards-bw9.json';
import xypCards from '../data/cards-xyp.json';
import zsv10pt5Cards from '../data/cards-zsv10pt5.json';
import sm3Cards from '../data/cards-sm3.json';

const allCardsMap = new Map<string, any>();
const addCardsToMap = (cardsArray: any[], expansionId: string) => {
  if (!cardsArray) return;
  cardsArray.forEach((card: any) => {
    const cleanId = String(card.id).trim();
    allCardsMap.set(cleanId, { 
      ...card, 
      expansion: card.expansion || expansionId 
    });
  });
};

addCardsToMap(baseCards.cards, 'dp6');
addCardsToMap(swsh12Cards.cards, 'swsh12');
addCardsToMap(bw9Cards.cards, 'bw9');
addCardsToMap(xypCards.cards, 'xyp');
addCardsToMap(zsv10pt5Cards.cards, 'zsv10pt5');
addCardsToMap(sm3Cards.cards, 'sm3');

export class TradeController {

  // BUSCAR CARTAS EN EL CATÁLOGO (Facilita la autocompletación en el buscador del Frontend)
  async searchCards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      const searchStr = String(query || '').trim().toLowerCase();

      const cardsList = Array.from(allCardsMap.values());
      const filtered = cardsList.filter((card: any) => 
        card.name.toLowerCase().includes(searchStr)
      ).slice(0, 15); // Límite de 15 resultados para máxima velocidad y optimización

      res.status(200).json(filtered);
    } catch (err: any) {
      console.error("❌ ERROR EN searchCards:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // MODO A: Busca usuarios que tengan una carta específica REPETIDA (quantity > 1)
  async getUsersWithDuplicate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const activeUserId = req.user?.userId;
      const { cardId } = req.params;

      if (!activeUserId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const cleanCardId = String(cardId).trim();

      // Buscamos usuarios que tengan la carta solicitada con cantidad > 1 (duplicada)
      // Excluimos al usuario activo para que no se vea a sí mismo
      const matchingUsers = await UserModel.find({
        userId: { $ne: activeUserId },
        album: {
          $elemMatch: {
            "card.id": cleanCardId
          }
        }
      }, { userId: 1, username: 1 }).lean();

      res.status(200).json(matchingUsers);
    } catch (err: any) {
      console.error("❌ ERROR EN getUsersWithDuplicate:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // PROPONER INTERCAMBIO (Modo A Directo / Modo B Público)
  async proposeTrade(req: AuthRequest, res: Response): Promise<void> {
    try {
      const senderId = req.user?.userId;
      if (!senderId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const { receiverId, senderCardId, receiverCardId } = req.body;

      const cleanSenderCardId = String(senderCardId).trim();
      const cleanReceiverCardId = String(receiverCardId).trim();

      // 1. Obtener datos de las cartas
      const senderCardData = allCardsMap.get(cleanSenderCardId);
      const receiverCardData = allCardsMap.get(cleanReceiverCardId);

      if (!senderCardData || !receiverCardData) {
        res.status(400).json({ error: 'Una de las cartas seleccionadas no existe.' });
        return;
      }

      // 2. Obtener datos del emisor
      const senderDoc = await UserModel.findOne({ userId: senderId });
      if (!senderDoc) {
        res.status(404).json({ error: 'Usuario proponente no encontrado.' });
        return;
      }

      // 3. Validar que el emisor realmente posea la carta que ofrece
      const senderAlbumEntry = senderDoc.album.find(e => String(e.card.id).trim() === cleanSenderCardId);
      if (!senderAlbumEntry || senderAlbumEntry.quantity < 1) {
        res.status(400).json({ error: `No posees la carta ${senderCardData.name} para ofrecerla.` });
        return;
      }

      let receiverUsername = undefined;
      // 4. Si es Modo A (Directo), validar al receptor y que posea la carta pedida
      if (receiverId) {
        const cleanReceiverId = String(receiverId).trim();
        if (cleanReceiverId === senderId) {
          res.status(400).json({ error: 'No puedes proponerte un intercambio a ti mismo.' });
          return;
        }

        const receiverDoc = await UserModel.findOne({ userId: cleanReceiverId });
        if (!receiverDoc) {
          res.status(404).json({ error: 'El usuario destino no existe.' });
          return;
        }

        receiverUsername = receiverDoc.username;

        const receiverAlbumEntry = receiverDoc.album.find(e => String(e.card.id).trim() === cleanReceiverCardId);
        if (!receiverAlbumEntry || receiverAlbumEntry.quantity < 1) {
          res.status(400).json({ error: `El usuario ${receiverDoc.username} no posee la carta que solicitas.` });
          return;
        }
      }

      // 5. Crear la oferta
      const trade = new TradeModel({
        senderId,
        senderUsername: senderDoc.username,
        receiverId: receiverId ? String(receiverId).trim() : undefined,
        receiverUsername,
        senderCardId: cleanSenderCardId,
        senderCardData,
        receiverCardId: cleanReceiverCardId,
        receiverCardData,
        status: 'pending'
      });

      await trade.save();

      // Si es un intercambio directo, notificar al receptor
      if (receiverId) {
        try {
          const newNotif = new NotificationModel({
            userId: String(receiverId).trim(),
            message: `📩 Has recibido una propuesta de intercambio directo de ${senderDoc.username}: te ofrece ${senderCardData.name} por tu ${receiverCardData.name}.`,
            type: 'trade_received'
          });
          await newNotif.save();
        } catch (notifErr) {
          console.error("⚠️ Error al crear notificación de propuesta:", notifErr);
        }
      }

      res.status(201).json({ message: 'Propuesta de intercambio registrada.', trade });
    } catch (err: any) {
      console.error("❌ ERROR EN proposeTrade:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // MODO B: Listar intercambios PÚBLICOS con filtros avanzados
  async getPublicTrades(req: AuthRequest, res: Response): Promise<void> {
    try {
      const activeUserId = req.user?.userId;
      const { expansion, rarity, search } = req.query;

      // Filtro base: ofertas públicas de otros usuarios que estén pendientes
      const query: any = {
        receiverId: { $exists: false },
        status: 'pending'
      };

      if (activeUserId) {
        query.senderId = { $ne: activeUserId }; // No ver tus propias ofertas en el tablón
      }

      // Filtros de expansión y rareza
      if (expansion) {
        query.$or = [
          { "senderCardData.expansion": String(expansion).trim() },
          { "receiverCardData.expansion": String(expansion).trim() }
        ];
      }

      if (rarity) {
        const rarityStr = String(rarity).trim().toLowerCase();
        if (query.$or) {
          // Si ya existe $or, lo combinamos
          query.$and = [
            { $or: query.$or },
            {
              $or: [
                { "senderCardData.rarity": { $regex: rarityStr, $options: 'i' } },
                { "receiverCardData.rarity": { $regex: rarityStr, $options: 'i' } }
              ]
            }
          ];
          delete query.$or;
        } else {
          query.$or = [
            { "senderCardData.rarity": { $regex: rarityStr, $options: 'i' } },
            { "receiverCardData.rarity": { $regex: rarityStr, $options: 'i' } }
          ];
        }
      }

      // Búsqueda por texto (nombre de carta ofrecida o buscada)
      if (search) {
        const searchStr = String(search).trim();
        const searchRegex = { $regex: searchStr, $options: 'i' };
        
        const textQuery = {
          $or: [
            { "senderCardData.name": searchRegex },
            { "receiverCardData.name": searchRegex }
          ]
        };

        if (query.$and) {
          query.$and.push(textQuery);
        } else if (query.$or) {
          query.$and = [
            { $or: query.$or },
            textQuery
          ];
          delete query.$or;
        } else {
          query.$or = textQuery.$or;
        }
      }

      const trades = await TradeModel.find(query).sort({ createdAt: -1 }).lean();
      res.status(200).json(trades);
    } catch (err: any) {
      console.error("❌ ERROR EN getPublicTrades:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // BANDEJA DE OFERTAS DEL USUARIO (Recibidas y Enviadas)
  async getMyOffers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const activeUserId = req.user?.userId;
      if (!activeUserId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      // Ofertas enviadas por el usuario activo (directas o públicas)
      const sentOffers = await TradeModel.find({
        senderId: activeUserId,
        status: 'pending'
      }).sort({ createdAt: -1 }).lean();

      // Ofertas recibidas por el usuario activo (solo directas)
      const receivedOffers = await TradeModel.find({
        receiverId: activeUserId,
        status: 'pending'
      }).sort({ createdAt: -1 }).lean();

      res.status(200).json({
        received: receivedOffers,
        sent: sentOffers
      });
    } catch (err: any) {
      console.error("❌ ERROR EN getMyOffers:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // ACEPTAR INTERCAMBIO (Procesamiento Atómico Robusto)
  async acceptTrade(req: AuthRequest, res: Response): Promise<void> {
    try {
      const receiverId = req.user?.userId;
      const receiverUsername = req.user?.username;
      const { id } = req.params;

      if (!receiverId || !receiverUsername) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const trade = await TradeModel.findById(id);
      if (!trade) {
        res.status(404).json({ error: 'La propuesta de intercambio no existe.' });
        return;
      }

      if (trade.status !== 'pending') {
        res.status(400).json({ error: 'Este intercambio ya no está pendiente.' });
        return;
      }

      // Validar que el usuario no se acepte su propia oferta si es una oferta pública
      if (trade.senderId === receiverId) {
        res.status(400).json({ error: 'No puedes aceptar tu propia oferta.' });
        return;
      }

      // Si es oferta directa, validar que el receptor sea el usuario activo
      if (trade.receiverId && trade.receiverId !== receiverId) {
        res.status(403).json({ error: 'Este intercambio no fue dirigido a ti.' });
        return;
      }

      const senderId = trade.senderId;

      // Cargamos documentos de usuarios de forma concurrente
      const [senderDoc, receiverDoc] = await Promise.all([
        UserModel.findOne({ userId: senderId }),
        UserModel.findOne({ userId: receiverId })
      ]);

      if (!senderDoc || !receiverDoc) {
        res.status(404).json({ error: 'Uno de los usuarios del intercambio ya no existe.' });
        return;
      }

      // 1. Validar que el EMISOR aún tenga la carta que ofreció (SenderCard)
      const senderAlbumEntry = senderDoc.album.find(e => String(e.card.id).trim() === trade.senderCardId);
      if (!senderAlbumEntry || senderAlbumEntry.quantity < 1) {
        trade.status = 'cancelled';
        await trade.save();
        res.status(400).json({ error: `El intercambio ha sido cancelado porque el emisor ya no posee ${trade.senderCardData.name}.` });
        return;
      }

      // 2. Validar que el RECEPTOR/ACEPTANTE aún tenga la carta solicitada (ReceiverCard)
      const receiverAlbumEntry = receiverDoc.album.find(e => String(e.card.id).trim() === trade.receiverCardId);
      if (!receiverAlbumEntry || receiverAlbumEntry.quantity < 1) {
        trade.status = 'cancelled';
        await trade.save();
        res.status(400).json({ error: `El intercambio ha sido cancelado porque ya no posees ${trade.receiverCardData.name}.` });
        return;
      }

      // --- EJECUCIÓN DEL SWAP DE CARTAS ---

      // A) Ajustes en el álbum del Emisor (A)
      let senderXpGained = 0;
      // Restar carta ofrecida
      senderAlbumEntry.quantity -= 1;
      if (senderAlbumEntry.quantity <= 0) {
        senderDoc.album = senderDoc.album.filter(e => String(e.card.id).trim() !== trade.senderCardId);
      }
      // Sumar carta recibida
      const senderNewEntry = senderDoc.album.find(e => String(e.card.id).trim() === trade.receiverCardId);
      if (senderNewEntry) {
        senderNewEntry.quantity += 1;
      } else {
        senderXpGained = 20; // 20 XP por carta nueva descubierta en trade
        senderDoc.album.push({
          card: trade.receiverCardData,
          quantity: 1,
          obtainedAt: new Date().toISOString()
        });
      }

      // B) Ajustes en el álbum del Receptor (B)
      let receiverXpGained = 0;
      // Restar carta solicitada
      receiverAlbumEntry.quantity -= 1;
      if (receiverAlbumEntry.quantity <= 0) {
        receiverDoc.album = receiverDoc.album.filter(e => String(e.card.id).trim() !== trade.receiverCardId);
      }
      // Sumar carta recibida
      const receiverNewEntry = receiverDoc.album.find(e => String(e.card.id).trim() === trade.senderCardId);
      if (receiverNewEntry) {
        receiverNewEntry.quantity += 1;
      } else {
        receiverXpGained = 20; // 20 XP por carta nueva descubierta en trade
        receiverDoc.album.push({
          card: trade.senderCardData,
          quantity: 1,
          obtainedAt: new Date().toISOString()
        });
      }

      // Aplicar progresión, hitos y colecciones completadas a ambos entrenadores
      ProgressionService.applyProgression(senderDoc, senderXpGained);
      ProgressionService.applyProgression(receiverDoc, receiverXpGained);


      // C) Guardar cambios en base de datos de manera atómica
      trade.status = 'accepted';
      if (!trade.receiverId) {
        trade.receiverId = receiverId;
        trade.receiverUsername = receiverUsername;
      }

      await Promise.all([
        senderDoc.save(),
        receiverDoc.save(),
        trade.save()
      ]);

      // Notificar al emisor del intercambio (senderId)
      try {
        const acceptNotif = new NotificationModel({
          userId: senderId,
          message: `🤝 ¡${receiverUsername} ha aceptado tu propuesta de intercambio! Te ha enviado ${trade.receiverCardData.name} por tu ${trade.senderCardData.name}.`,
          type: 'trade_accepted'
        });
        await acceptNotif.save();
      } catch (notifErr) {
        console.error("⚠️ Error al crear notificación de aceptación:", notifErr);
      }

      res.status(200).json({ message: '¡Intercambio completado con éxito!', trade });
    } catch (err: any) {
      console.error("❌ ERROR EN acceptTrade:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // RECHAZAR O CANCELAR INTERCAMBIO
  async rejectTrade(req: AuthRequest, res: Response): Promise<void> {
    try {
      const activeUserId = req.user?.userId;
      const { id } = req.params;

      if (!activeUserId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const trade = await TradeModel.findById(id);
      if (!trade) {
        res.status(404).json({ error: 'El intercambio no existe.' });
        return;
      }

      if (trade.status !== 'pending') {
        res.status(400).json({ error: 'Este intercambio ya no está pendiente.' });
        return;
      }

      if (trade.senderId === activeUserId) {
        // El emisor puede cancelar su propia propuesta
        trade.status = 'cancelled';
      } else if (trade.receiverId === activeUserId) {
        // El receptor puede rechazar la propuesta
        trade.status = 'rejected';
      } else {
        res.status(403).json({ error: 'No tienes permiso para interactuar con este intercambio.' });
        return;
      }

      await trade.save();

      // Si el emisor cancela una propuesta directa, notificar al receptor
      if (trade.status === 'cancelled' && trade.receiverId) {
        try {
          const cancelNotif = new NotificationModel({
            userId: trade.receiverId,
            message: `🚫 ${req.user?.username} ha cancelado su propuesta de intercambio directo (ofrecía ${trade.senderCardData.name}).`,
            type: 'trade_cancelled'
          });
          await cancelNotif.save();
        } catch (notifErr) {
          console.error("⚠️ Error al crear notificación de cancelación:", notifErr);
        }
      }

      // Si el receptor rechaza la propuesta, notificar al emisor
      if (trade.status === 'rejected') {
        try {
          const rejectNotif = new NotificationModel({
            userId: trade.senderId,
            message: `❌ ${req.user?.username} ha rechazado tu propuesta de intercambio (${trade.senderCardData.name} por ${trade.receiverCardData.name}).`,
            type: 'trade_rejected'
          });
          await rejectNotif.save();
        } catch (notifErr) {
          console.error("⚠️ Error al crear notificación de rechazo:", notifErr);
        }
      }

      res.status(200).json({ message: 'Intercambio actualizado con éxito.', trade });
    } catch (err: any) {
      console.error("❌ ERROR EN rejectTrade:", err);
      res.status(500).json({ error: err.message });
    }
  }
}
