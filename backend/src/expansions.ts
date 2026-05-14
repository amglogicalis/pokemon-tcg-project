// backend/src/config/expansions.ts

export interface ExpansionConfig {
  id: string;          // ID interno (ej: 'base')
  apiId: string;       // ID para la API/JSON (ej: 'dp6')
  name: string;        // Nombre público
  fileName: string;    // Nombre del archivo .json físico
}

export const AVAILABLE_EXPANSIONS: Record<string, ExpansionConfig> = {
  'dp6': {
    id: 'dp6',
    apiId: 'dp6',
    name: 'Legends Awakened',
    fileName: 'cards-dp6.json'
  },
  'bw9': {
    id: 'bw9',
    apiId: 'bw9',
    name: 'Plasma Blast',
    fileName: 'cards-bw9.json'
  },
  '621': {
    id: '621',
    apiId: 'xyp',
    name: 'XY Black Star Promos',
    fileName: 'cards-xyp.json'
  }
};