import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import { motion, AnimatePresence } from 'framer-motion';

interface AlbumEntry {
  card: {
    id: string;
    pokemonId: number; 
    name: string;
    rarity: string;
    imageUrl: string; 
    hp?: number;
  };
  quantity: number;
}

type SortOrder = 'recent' | 'id' | 'rarity' | 'hp';

// 1. Definición de expansiones (Añadida XY Promos con color rojo)
const EXPANSIONS = {
  dp6: { id: 'card', name: 'Legends Awakened', total: 146, color: 'text-yellow-400', bar: 'from-yellow-600 to-yellow-200' },
  bw9: { id: 'bw9', name: 'Plasma Blast', total: 122, color: 'text-blue-400', bar: 'from-blue-600 to-blue-300' },
  xyp: { id: 'xyp', name: 'XY Black Star Promos', total: 208, color: 'text-red-500', bar: 'from-red-700 to-red-400' }
};

export default function Album() {
  const [entries, setEntries] = useState<AlbumEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOrder>('recent');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  // 2. Estado actualizado para permitir la nueva pestaña
  const [activeTab, setActiveTab] = useState<keyof typeof EXPANSIONS>('dp6');

  const rarityWeight: Record<string, number> = {
    'shiny': 5, 'ultra-rare': 4, 'ultra rare': 4, 'holographic': 3, 'rare': 2, 'uncommon': 1, 'common': 0
  };

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await api.get('/user/album');
        setEntries(response.data.album || []); 
      } catch (error) {
        console.error("Error cargando álbum:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, []);

  const stats = useMemo(() => {
    const currentExp = EXPANSIONS[activeTab];
    
    // 3. Lógica de filtrado corregida y ampliada
    const filteredEntries = entries.filter(e => {
      const cardId = e.card.id.toLowerCase();
      
      if (activeTab === 'dp6') {
        return cardId.startsWith('card-') || cardId.startsWith('dp6');
      }
      if (activeTab === 'bw9') {
        return cardId.startsWith('bw9-') || cardId.startsWith('bw-');
      }
      if (activeTab === 'xyp') {
        // Detecta IDs que empiecen por xyp (nuestro ID interno) o xy/621 (IDs de la API)
        return cardId.startsWith('xyp-') || cardId.startsWith('xy-') || cardId.startsWith('621-');
      }
      return false;
    });
    
    const uniqueCount = filteredEntries.length;
    const progress = Math.round((uniqueCount / currentExp.total) * 100);
    
    const sorted = [...filteredEntries].sort((a, b) => {
      switch (sortBy) {
        case 'id': 
          const numA = parseInt(a.card.id.split('-')[1]) || 0;
          const numB = parseInt(b.card.id.split('-')[1]) || 0;
          return numA - numB;
        case 'rarity': 
          return (rarityWeight[b.card.rarity.toLowerCase()] || 0) - (rarityWeight[a.card.rarity.toLowerCase()] || 0);
        case 'hp': 
          return (b.card.hp || 0) - (a.card.hp || 0);
        default: return 0;
      }
    });
    return { sorted, progress, uniqueCount, currentExp };
  }, [entries, sortBy, activeTab]);

  const selectedEntry = useMemo(() => 
    entries.find(e => e.card.id === selectedCardId), 
    [entries, selectedCardId]
  );

  // Hook derivado para reutilizar la misma lógica del brillo de fondo de Shop.tsx
  const currentBgEffect = useMemo(() => {
    if (!selectedEntry) return 'none';
    const rarity = selectedEntry.card.rarity.toLowerCase();
    if (rarity.includes('shiny')) return 'shiny';
    if (rarity.includes('ultra')) return 'ultra';
    return 'none';
  }, [selectedEntry]);

  if (loading) return <div className="p-10 text-center text-white italic">Cargando colección...</div>;

  return (
    <div className="p-10 min-h-screen bg-gray-900 text-white relative overflow-x-hidden">
      
      {/* EFECTOS DE FONDO DINÁMICOS - AMPLIADOS (Igual que en Shop.tsx) */}
      <AnimatePresence>
        {currentBgEffect === 'ultra' && (
          <motion.div
            key="ultra-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-0 text-yellow-500 flex items-center justify-center"
          >
            <div className="w-full h-full scale-150 bg-[radial-gradient(circle,currentColor_10%,transparent_80%)]" />
          </motion.div>
        )}
        {currentBgEffect === 'shiny' && (
          <motion.div
            key="shiny-bg"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              color: ['rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)', 'rgb(255,0,0)']
            }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center"
          >
            <div className="w-full h-full scale-150 bg-[radial-gradient(circle,currentColor_10%,transparent_80%)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* TABS DINÁMICOS */}
        <div className="flex gap-6 mb-8 justify-center md:justify-start">
          {(Object.keys(EXPANSIONS) as Array<keyof typeof EXPANSIONS>).map((key) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSelectedCardId(null); }}
              className={`pb-2 px-4 font-black uppercase tracking-widest text-xs transition-all border-b-2 
                ${activeTab === key ? `${EXPANSIONS[key].color} border-current` : 'text-gray-600 border-transparent hover:text-gray-400'}`}
            >
              {EXPANSIONS[key].name}
            </button>
          ))}
        </div>

        {/* STATS */}
        <div className="mb-12 bg-gray-800/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
            <div>
              <h2 className={`text-5xl font-black uppercase tracking-tighter italic leading-none mb-2 ${stats.currentExp.color}`}>
                {stats.currentExp.name}
              </h2>
              <p className="text-gray-400 font-medium tracking-widest uppercase text-xs font-sans">Colección de Expansión</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-white">{stats.uniqueCount}</span>
              <span className="text-gray-500 font-bold text-xl"> / {stats.currentExp.total}</span>
              <p className={`${stats.currentExp.color} font-black text-sm mt-1 uppercase italic`}>{stats.progress}% Completado</p>
            </div>
          </div>
          <div className="w-full bg-black/50 rounded-full h-3 border border-white/5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.progress}%` }} className={`bg-gradient-to-r h-full transition-all duration-1000 ${stats.currentExp.bar}`} />
          </div>
        </div>

        {/* FILTROS */}
        <div className="flex justify-end mb-8">
          <div className="flex items-center gap-3 bg-black/40 p-2 px-4 rounded-2xl border border-white/10 shadow-lg">
            <span className="text-[10px] font-black text-gray-500 uppercase italic tracking-wider">Ordenar por:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOrder)} className="bg-transparent text-yellow-500 font-bold text-sm outline-none cursor-pointer">
              <option value="recent" className="bg-gray-900 text-white">Recientes</option>
              <option value="id" className="bg-gray-900 text-white">ID</option>
              <option value="rarity" className="bg-gray-900 text-white">Rareza</option>
              <option value="hp" className="bg-gray-900 text-white">HP</option>
            </select>
          </div>
        </div>
        
        {/* GRID DE CARTAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {stats.sorted.map((entry, index) => {
            const isSelected = selectedCardId === entry.card.id;
            const rKey = entry.card.rarity.toLowerCase();
            const style = rarityStyles[rKey] || rarityStyles.common;
            const isUltra = rKey.includes('ultra');
            const isHolo = rKey.includes('holographic');
            const isShiny = rKey.includes('shiny');

            return (
              <div key={`${entry.card.id}-${index}`} className="relative aspect-[2/3] cursor-pointer"
                onClick={() => setSelectedCardId(isSelected ? null : entry.card.id)}>
                
                <motion.div 
                  animate={isSelected ? { scale: 1.05, zIndex: 50 } : { scale: 1 }}
                  className={`w-full h-full p-3 rounded-xl border-2 transition-all duration-500 relative overflow-hidden flex flex-col
                    ${isSelected ? `${style.border} ${style.bg} ${style.shadow}` : 'border-gray-800 bg-gray-800/50'}`}
                >
                  {isSelected && (
                    <>
                      {isShiny ? (
                        <>
                          <motion.div 
                            animate={{ backgroundColor: ['rgba(255,30,0,0.15)', 'rgba(200,0,150,0.1)', 'rgba(0,70,255,0.1)', 'rgba(0,255,100,0.1)', 'rgba(255,30,0,0.15)'] }} 
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }} 
                            className="absolute inset-0 z-0 pointer-events-none" 
                          />
                          <motion.div 
                            animate={{ borderColor: ['#ff2000', '#cc0099', '#0066ff', '#00ff66', '#ffcc00', '#ff2000'] }} 
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }} 
                            className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none opacity-70" 
                          />
                          <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </>
                      ) : (
                        <>
                          {(isHolo || isUltra) && (
                            <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                          )}
                          {isUltra && (
                            <>
                              <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle,rgba(234,179,8,0.25)_0%,transparent_75%)]" />
                              <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-2 rounded-xl z-30 pointer-events-none border-yellow-400/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}

                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-black font-black w-6 h-6 flex items-center justify-center rounded-full z-40 border-2 border-gray-900 text-[9px] shadow-xl">
                    x{entry.quantity}
                  </div>

                  <img src={entry.card.imageUrl} alt={entry.card.name} className={`w-full h-auto aspect-[2/3] object-contain relative z-10 transition-all duration-500 ${!isSelected ? 'grayscale-[0.5] opacity-60' : 'drop-shadow-2xl grayscale-0 opacity-100'}`} />

                  <div className="mt-auto text-center relative z-20">
                    <p className={`font-bold text-[9px] uppercase truncate tracking-widest leading-none mb-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>{entry.card.name}</p>
                    {isSelected && (
                      <span className={`text-[7px] px-2 py-0.5 rounded-full border ${style.border} ${style.text} bg-black/60 font-black tracking-tighter inline-block uppercase`}>{entry.card.rarity}</span>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
