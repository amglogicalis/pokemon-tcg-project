import React, { useEffect, useState, useMemo, useRef } from 'react';
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

// 1. Definición de expansiones
const EXPANSIONS = { 
  sm3: { id: 'sm3', name: 'Burning Shadows', total: 177, color: 'text-red-950', bar: 'from-red-950 to-red-950' },
  dp6: { id: 'card', name: 'Legends Awakened', total: 146, color: 'text-yellow-400', bar: 'from-yellow-600 to-yellow-200' },
  bw9: { id: 'bw9', name: 'Plasma Blast', total: 122, color: 'text-blue-400', bar: 'from-blue-600 to-blue-300' },
  xyp: { id: 'xyp', name: 'XY Black Star Promos', total: 208, color: 'text-red-500', bar: 'from-red-700 to-red-400' },
  zsv10pt5: { id: 'zsv10pt5', name: 'Black Bolt', total: 172, color: 'text-indigo-600', bar: 'from-indigo-600 to-indigo-300' }
};

export default function Album() {
  const [entries, setEntries] = useState<AlbumEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOrder>('recent');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof typeof EXPANSIONS>('dp6');

  const albumMusicRef = useRef<HTMLAudioElement | null>(null);

  const rarityWeight: Record<string, number> = {
    'ultra-secret': 8, 'ultra secret': 8, 'super-secret': 7, 'super secret': 7, 'secret': 6, 'shiny': 5, 'ultra-rare': 4, 'ultra rare': 4, 'holographic': 3, 'rare': 2, 'uncommon': 1, 'common': 0
  };

  const playSelect = () => {
    const audio = new Audio('/sounds/select.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const audio = new Audio('/sounds/album-music.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    albumMusicRef.current = audio;
    audio.play().catch((err) => console.log('Autoplay blocked:', err));

    return () => {
      if (albumMusicRef.current) {
        albumMusicRef.current.pause();
        albumMusicRef.current = null;
      }
    };
  }, []);

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
    
    const filteredEntries = entries.filter(e => {
      const cardId = e.card.id.toLowerCase();
      
      if (activeTab === 'dp6') {
        return cardId.startsWith('card-') || cardId.startsWith('dp6');
      }
      if (activeTab === 'bw9') {
        return cardId.startsWith('bw9-') || cardId.startsWith('bw-');
      }
      if (activeTab === 'xyp') {
        return cardId.startsWith('xyp-') || cardId.startsWith('xy-') || cardId.startsWith('621-');
      }
      if (activeTab === 'sm3') {
        return cardId.startsWith('sm3-');
      }
      if (activeTab === 'zsv10pt5') {
        return cardId.startsWith('zsv10pt5-');
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

  const currentBgEffect = useMemo(() => {
    if (!selectedEntry) return 'none';
    const rarity = selectedEntry.card.rarity.toLowerCase();
    if (rarity.includes('ultra-secret') || rarity.includes('ultra secret')) return 'ultra-secret';
    if (rarity.includes('super-secret') || rarity.includes('super secret')) return 'super-secret';
    if (rarity.includes('secret')) return 'secret';
    if (rarity.includes('shiny')) return 'shiny';
    if (rarity.includes('ultra')) return 'ultra';
    return 'none';
  }, [selectedEntry]);

  if (loading) return <div className="p-10 text-center text-white italic">Cargando colección...</div>;

  return (
    <div className="p-10 min-h-screen bg-gray-900 text-white relative overflow-x-hidden">
      
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
        {currentBgEffect === 'super-secret' && (
          <motion.div
            key="super-secret-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 1.0, 0.6], scale: [1, 1.05, 1] }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center bg-black/20"
          >
            {/* Auroras Boreales Giratorias */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute w-[150vmax] h-[150vmax] opacity-25 bg-[conic-gradient(from_0deg,transparent_10%,rgba(16,185,129,0.3)_30%,transparent_50%,rgba(234,179,8,0.2)_70%,transparent_90%)] blur-[40px]"
            />

            {/* Brillo Principal Esmeralda */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.4)_0%,rgba(0,0,0,0)_70%)]" />
            
            {/* Brillo Secundario Dorado de Enfoque */}
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle,rgba(234,179,8,0.25)_0%,rgba(234,179,8,0.05)_25%,rgba(0,0,0,0)_50%)]" 
            />
            
            {/* ESTRELLAS ESMERALDA Y ORO DE ALTO BRILLO */}
            {[...Array(22)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth - window.innerWidth/2, 
                  y: window.innerHeight/2 + 50,
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  y: -window.innerHeight/2 - 50,
                  x: `calc(${Math.random() * window.innerWidth - window.innerWidth/2}px + ${Math.sin(i) * 60}px)`,
                  scale: [0, 2.2, 0],
                  opacity: [0, 0.95, 0],
                }}
                transition={{ 
                  duration: 4 + Math.random() * 4, 
                  repeat: Infinity, 
                  delay: Math.random() * 5,
                  ease: "easeOut"
                }}
                className={`absolute w-3 h-3 rotate-45 rounded-sm blur-[0.5px] ${
                  i % 2 === 0 
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-300 shadow-[0_0_15px_#10b981]' 
                    : 'bg-gradient-to-r from-yellow-300 to-emerald-400 shadow-[0_0_15px_#eab308]'
                }`}
              />
            ))}
          </motion.div>
        )}
        {currentBgEffect === 'ultra-secret' && (
          <motion.div
            key="ultra-secret-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 1.0, 0.6], scale: [1, 1.03, 1] }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center bg-black/35"
          >
            {/* Nebulosa Cósmica Púrpura */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(147,51,234,0.3)_0%,rgba(0,0,0,0)_75%)]" />
            
            {/* Núcleo de Estrellas Dorado */}
            <motion.div 
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle,rgba(234,179,8,0.35)_0%,rgba(234,179,8,0.1)_25%,rgba(0,0,0,0)_50%)]" 
            />
            
            {/* LUVIA DE METEOROS DORADOS DIAGONALES */}
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth - window.innerWidth/3, 
                  y: -window.innerHeight/2 - 100,
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  x: `calc(${Math.random() * window.innerWidth - window.innerWidth/2}px - 200px)`,
                  y: window.innerHeight/2 + 100,
                  scale: [0, 2, 0],
                  opacity: [0, 0.95, 0],
                }}
                transition={{ 
                  duration: 3 + Math.random() * 3, 
                  repeat: Infinity, 
                  delay: Math.random() * 8,
                  ease: "linear"
                }}
                className="absolute w-1.5 h-16 rounded-full bg-gradient-to-b from-yellow-300 via-rose-400 to-transparent -rotate-[35deg] blur-[1px] shadow-[0_0_15px_#eab308]"
              />
            ))}
          </motion.div>
        )}
        {currentBgEffect === 'secret' && (
          <motion.div
            key="secret-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center"
          >
            {/* Brillo Principal Azul Celeste */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(34,211,238,0.3)_0%,rgba(0,0,0,0)_70%)]" />
            
            {/* Brillo Secundario Fucsia/Naranja (EQUILIBRADO) */}
            <motion.div 
              animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle,rgba(244,63,94,0.6)_0%,rgba(244,63,94,0.2)_25%,rgba(0,0,0,0)_50%)]" 
            />
            
            {/* ESTRELLAS / PARTÍCULAS FUCSIA-NARANJA */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth - window.innerWidth/2, 
                  y: Math.random() * window.innerHeight - window.innerHeight/2,
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  x: [
                    Math.random() * window.innerWidth - window.innerWidth/2, 
                    Math.random() * window.innerWidth - window.innerWidth/2,
                    Math.random() * window.innerWidth - window.innerWidth/2
                  ],
                  y: [
                    Math.random() * window.innerHeight - window.innerHeight/2,
                    Math.random() * window.innerHeight - window.innerHeight/2,
                    Math.random() * window.innerHeight - window.innerHeight/2
                  ],
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2, 
                  repeat: Infinity, 
                  delay: Math.random() * 1.2,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-red-500 to-orange-400 blur-[2px] shadow-[0_0_10px_#f43f5e]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="flex gap-6 mb-8 justify-center md:justify-start">
          {(Object.keys(EXPANSIONS) as Array<keyof typeof EXPANSIONS>).map((key) => (
            <button
              key={key}
              onClick={() => { playSelect(); setActiveTab(key); setSelectedCardId(null); }}
              className={`pb-2 px-4 font-black uppercase tracking-widest text-xs transition-all border-b-2 
                ${activeTab === key ? `${EXPANSIONS[key].color} border-current` : 'text-gray-600 border-transparent hover:text-gray-400'}`}
            >
              {EXPANSIONS[key].name}
            </button>
          ))}
        </div>

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

        <div className="flex justify-end mb-8">
          <div className="flex items-center gap-3 bg-black/40 p-2 px-4 rounded-2xl border border-white/10 shadow-lg">
            <span className="text-[10px] font-black text-gray-500 uppercase italic tracking-wider">Ordenar por:</span>
            <select value={sortBy} onChange={(e) => { playSelect(); setSortBy(e.target.value as SortOrder); }} className="bg-transparent text-yellow-500 font-bold text-sm outline-none cursor-pointer">
              <option value="recent" className="bg-gray-900 text-white">Recientes</option>
              <option value="id" className="bg-gray-900 text-white">ID</option>
              <option value="rarity" className="bg-gray-900 text-white">Rareza</option>
              <option value="hp" className="bg-gray-900 text-white">HP</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {stats.sorted.map((entry, index) => {
            const isSelected = selectedCardId === entry.card.id;
            const rKey = entry.card.rarity.toLowerCase();
            const style = rarityStyles[rKey] || rarityStyles.common;
            const isUltra = rKey.includes('ultra');
            const isHolo = rKey.includes('holographic');
            const isShiny = rKey.includes('shiny');
            const isSecret = rKey.includes('secret') && !rKey.includes('super') && !rKey.includes('ultra');
            const isSuperSecret = rKey.includes('super-secret') || rKey.includes('super secret');
            const isUltraSecret = rKey.includes('ultra-secret') || rKey.includes('ultra secret');

            return (
              <div key={`${entry.card.id}-${index}`} className="relative aspect-[2/3] cursor-pointer"
                onClick={() => { playSelect(); setSelectedCardId(isSelected ? null : entry.card.id); }}>
                
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
                          {(isHolo || isUltra || isSecret || isSuperSecret || isUltraSecret) && (
                            <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                          )}
                          {isUltra && !isUltraSecret && (
                            <>
                              <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle,rgba(234,179,8,0.25)_0%,transparent_75%)]" />
                              <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-2 rounded-xl z-30 pointer-events-none border-yellow-400/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                            </>
                          )}
                          {isSuperSecret && (
                            <>
                              <motion.div animate={{ backgroundColor: ['rgba(16,185,129,0.25)', 'rgba(234,179,8,0.25)', 'rgba(16,185,129,0.25)'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
                              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)]" />
                              <motion.div animate={{ opacity: [0.7, 1.0, 0.7], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.7),inset_0_0_15px_rgba(52,211,153,0.5)]" />
                            </>
                          )}
                          {isUltraSecret && (
                            <>
                              <motion.div animate={{ backgroundColor: ['rgba(234,179,8,0.25)', 'rgba(244,63,94,0.25)', 'rgba(234,179,8,0.25)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
                              <motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.7, 1.0, 0.7] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-yellow-400/80 shadow-[0_0_30px_rgba(234,179,8,0.6)]" />
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {isSelected && (isShiny || isSecret || isSuperSecret || isUltraSecret) && (
                    <>
                      {/* Holographic Foil Texture Overlay */}
                      {[...Array(8)].map((_, i) => {
                        // Para ultra-secret seguimos un patrón ordenado de cascada uniforme; para las otras es aleatorio
                        const top = isUltraSecret 
                          ? 5 + ((i * 12) % 65) 
                          : 5 + Math.random() * 80;
                        const left = isUltraSecret 
                          ? 10 + (i * 10) 
                          : 5 + Math.random() * 80;
                        const scale = isUltraSecret ? 0.8 : 0.6 + Math.random() * 0.7;
                        const delay = isUltraSecret ? i * 0.22 : i * 0.25;
                        const duration = isUltraSecret ? 1.8 : 1.6 + Math.random() * 1.4;
                        
                        // Animación condicional ultra y rgb shiny (ahora shiny vuelve a ser blanco)
                        const animateProps = isUltraSecret 
                          ? {
                              opacity: [0, 0.9, 0],
                              scale: [0.3, scale, 0.3],
                              x: [25, 0, -25],
                              y: [-30, 0, 30],
                              color: i % 2 === 0 
                                ? [
                                    'rgba(255,255,255,0.85)', 
                                    'rgba(234,179,8,0.95)', 
                                    'rgba(244,63,94,0.9)', 
                                    'rgba(255,255,255,0.85)'
                                  ]
                                : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.85)'],
                              boxShadow: i % 2 === 0
                                ? [
                                    '0 0 8px rgba(255,255,255,0.5)',
                                    '0 0 15px rgba(234,179,8,0.95)',
                                    '0 0 15px rgba(244,63,94,0.9)',
                                    '0 0 8px rgba(255,255,255,0.5)'
                                  ]
                                : [
                                    '0 0 8px rgba(255,255,255,0.4)',
                                    '0 0 8px rgba(255,255,255,0.4)'
                                  ]
                            }
                          : {
                              opacity: [0, 0.95, 0],
                              scale: [0, scale, 0],
                              x: [0, Math.random() * 16 - 8, 0],
                              y: [0, Math.random() * 16 - 8, 0]
                            };
                        
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={animateProps}
                            transition={{ repeat: Infinity, duration, delay, ease: isUltraSecret ? "linear" : "easeInOut" }}
                            style={{ top: `${top}%`, left: `${left}%` }}
                            className="absolute z-20 pointer-events-none"
                          >
                            {isShiny ? (
                              <svg className="w-3.5 h-3.5 text-white fill-current drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" viewBox="0 0 24 24">
                                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.6L12 0Z" />
                              </svg>
                            ) : isSecret ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-fuchsia-300 via-rose-200 to-orange-300 blur-[0.3px] shadow-[0_0_7px_#f43f5e]" />
                            ) : isSuperSecret ? (
                              <div className="w-2.5 h-2.5 rotate-45 rounded-sm bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 blur-[0.3px] shadow-[0_0_7px_#34d399]" />
                            ) : isUltraSecret ? (
                              <div className="w-1 h-12 rounded-full -rotate-[35deg] bg-gradient-to-b from-current via-current/30 to-transparent" />
                            ) : null}
                          </motion.div>
                        );
                      })}

                      {/* Extra Holographic Diamond Sparkles (Ultra-Secret exclusive) */}
                      {isUltraSecret && (
                        <>
                          {[...Array(6)].map((_, i) => {
                            const top = 8 + Math.random() * 74;
                            const left = 8 + Math.random() * 74;
                            const scale = 0.8 + Math.random() * 0.7;
                            const delay = i * 0.4;
                            const duration = 2.0 + Math.random() * 1.5;
                            
                            return (
                              <motion.div
                                key={`ultra-diamond-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 0.95, 0],
                                  scale: [0, scale, 0],
                                  x: [0, Math.random() * 16 - 8, 0],
                                  y: [0, Math.random() * 16 - 8, 0]
                                }}
                                transition={{ repeat: Infinity, duration, delay, ease: "easeInOut" }}
                                style={{ top: `${top}%`, left: `${left}%` }}
                                className="absolute z-20 pointer-events-none"
                              >
                                <svg className="w-4.5 h-8 text-white/90 fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]" viewBox="0 0 24 24" preserveAspectRatio="none">
                                  <path d="M12 0 L17 12 L12 24 L7 12 Z" />
                                </svg>
                              </motion.div>
                            );
                          })}
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
