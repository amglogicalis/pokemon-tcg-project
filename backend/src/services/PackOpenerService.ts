import { Card, Rarity } from '../domain/Card';

const RARITY_WEIGHTS: Record<Rarity, number> = {
  'common': 50, 
  'uncommon': 25, 
  'rare': 15, 
  'holographic': 4.75, 
  'ultra-rare': 2, 
  'shiny': 1.5, 
  'secret': 1,
  'super-secret': 0.5,
  'ultra-secret': 0.25,
  'divine': 0
};

const RARITY_ORDER: Record<string, number> = {
  'common': 1, 
  'uncommon': 2, 
  'rare': 3, 
  'holographic': 4, 
  'ultra-rare': 5, 
  'ultra rare': 5, 
  'shiny': 6, 
  'secret': 7, 
  'super-secret': 8, 
  'super secret': 8, 
  'ultra-secret': 9, 
  'ultra secret': 9,
  'divine': 10
};

function pickRarity(): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) return rarity as Rarity;
  }
  return 'common';
}

export function openPack(allCards: Card[], count: number = 5): Card[] {
  const result: Card[] = [];

  for (let i = 0; i < count; i++) {
    const targetRarity = pickRarity();
    // NORMALIZACIÓN: trim() y toLowerCase() para evitar errores con los JSON nuevos
    let pool = allCards.filter(c => 
      (c.rarity || 'common').toLowerCase().trim() === targetRarity.toLowerCase()
    );

    if (pool.length === 0) {
      pool = allCards.filter(c => (c.rarity || 'common').toLowerCase().trim() === 'common');
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    result.push({ ...picked });
  }

  // ORDENAR: Limpiamos los strings de rareza antes de buscar el peso
  return result.sort((a, b) => {
    const rA = (a.rarity || 'common').toLowerCase().trim();
    const rB = (b.rarity || 'common').toLowerCase().trim();
    return (RARITY_ORDER[rA] || 0) - (RARITY_ORDER[rB] || 0);
  });
}