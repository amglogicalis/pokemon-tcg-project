import { User } from '../domain/User';
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

export class ProgressionService {
  
  static getXpNeededForLevel(level: number): number {
    if (level <= 10) return 100;
    if (level <= 50) return 100;
    if (level <= 100) return 100;
    if (level <= 250) return 150;
    if (level <= 500) return 150;
    if (level <= 1000) return 200;
    if (level <= 2000) return 250;
    if (level <= 5000) return 300;
    if (level <= 10000) return 300;
    return 600;
  }

  static getPacksRewardForLevel(level: number): number {
    if (level <= 10) return 1;
    if (level === 11) return 5;
    if (level <= 50) return 1;
    if (level === 51) return 10;
    if (level <= 100) return 1;
    if (level === 101) return 15;
    if (level <= 250) return 2;
    if (level === 251) return 30;
    if (level <= 500) return 2;
    if (level === 501) return 60;
    if (level <= 1000) return 3;
    if (level === 1001) return 90;
    if (level <= 2000) return 4;
    if (level === 2001) return 150;
    if (level <= 5000) return 5;
    if (level === 5001) return 250;
    if (level <= 10000) return 5;
    if (level === 10000) return 500;
    return 10;
  }

  static checkCompletedExpansions(user: User): { completedList: string[], xpGained: number } {
    const completedList: string[] = [];
    let xpGained = 0;
    
    const userCompleted = user.completedExpansions || [];
    const userAlbumCardIds = new Set(user.album.map(e => String(e.card.id).trim().toLowerCase()));
    
    for (const [expId, data] of Object.entries(expansionsData)) {
      if (userCompleted.includes(expId)) {
        continue;
      }
      
      // Excluir la carta recompensa 'divine' del cálculo de completado
      const expCards = (data.cards || []).filter((card: any) => card.rarity !== 'divine');
      if (expCards.length === 0) continue;
      
      const allObtained = expCards.every((card: any) => {
        const cardId = String(card.id).trim().toLowerCase();
        return userAlbumCardIds.has(cardId);
      });
      
      if (allObtained) {
        completedList.push(expId);
        xpGained += 25000; // 25,000 XP por colección completa
      }
    }
    
    return { completedList, xpGained };
  }

  static applyProgression(user: User, xpAdded: number): void {
    // 1. Verificar colecciones completadas antes de calcular nivel para sumar la XP extra
    const { completedList, xpGained: completionXp } = this.checkCompletedExpansions(user);
    if (completedList.length > 0) {
      user.completedExpansions = [...(user.completedExpansions || []), ...completedList];
      xpAdded += completionXp;
      console.log(`🏆 [ProgressionService] Colecciones completadas: [${completedList.join(', ')}]. XP de Recompensa: ${completionXp}`);
      
      // ENTREGAR LA CARTA DE RECOMPENSA DIVINA CORRESPONDIENTE
      completedList.forEach(expId => {
        const data = expansionsData[expId];
        if (data && data.cards) {
          const divineCard = data.cards.find((c: any) => c.rarity === 'divine');
          if (divineCard) {
            const exists = user.album.some(e => String(e.card.id).trim().toLowerCase() === String(divineCard.id).trim().toLowerCase());
            if (!exists) {
              user.album.push({
                card: divineCard,
                quantity: 1,
                obtainedAt: new Date().toISOString()
              });
              console.log(`🎁 [ProgressionService] ¡Entregada carta de recompensa divina!: ${divineCard.name}`);
            }
          }
        }
      });
    }

    // 2. Procesar niveles
    let currentLevel = user.level ?? 1;
    let currentXp = user.xp ?? 0;
    let newXp = currentXp + xpAdded;
    let newLevel = currentLevel;
    let packsReward = 0;

    while (true) {
      const xpNeeded = this.getXpNeededForLevel(newLevel);
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
        packsReward += this.getPacksRewardForLevel(newLevel);
      } else {
        break;
      }
    }

    user.level = newLevel;
    user.xp = newXp;
    user.packsAvailable = (user.packsAvailable ?? 0) + packsReward;
  }
}
