import React, { useEffect, useState, useMemo, useRef } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { themes } from '../constants/themes';

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
  xy5: { id: 'xy5', name: 'Primal Clash', total: 164, color: 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-cyan-500 font-black drop-shadow-[0_2px_10px_rgba(220,38,38,0.25)] pr-4', bar: 'from-red-600 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' }, 
  swsh12: { id: 'swsh12', name: 'Silver Tempest', total: 245, color: 'text-slate-400', bar: 'from-slate-400 to-slate-400' }, 
  sm3: { id: 'sm3', name: 'Burning Shadows', total: 175, color: 'text-rose-900', bar: 'from-rose-950 to-rose-800' },
  dp6: { id: 'dp6', name: 'Legends Awakened', total: 146, color: 'text-yellow-400', bar: 'from-yellow-600 to-yellow-200' },
  bw9: { id: 'bw9', name: 'Plasma Blast', total: 122, color: 'text-blue-400', bar: 'from-blue-600 to-blue-300' },
  xyp: { id: 'xyp', name: 'XY Black Star Promos', total: 213, color: 'text-red-500', bar: 'from-red-700 to-red-400' },
  zsv10pt5: { id: 'zsv10pt5', name: 'Black Bolt', total: 172, color: 'text-indigo-400', bar: 'from-indigo-600 to-indigo-300' }
};

export default function Album() {
  const currentUser = useAuthStore((s) => s.user);
  const activeThemeId = currentUser?.activeTheme || 'default';
  const currentTheme = themes[activeThemeId] || themes.default;

  const [entries, setEntries] = useState<AlbumEntry[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOrder>('id');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof typeof EXPANSIONS>('dp6');
  const [favoriteCardId, setFavoriteCardId] = useState<string | null>(null);
  const [settingFavorite, setSettingFavorite] = useState(false);

  const albumMusicRef = useRef<HTMLAudioElement | null>(null);

  const rarityWeight: Record<string, number> = {
    'divine': 9, 'ultra-secret': 8, 'ultra secret': 8, 'super-secret': 7, 'super secret': 7, 'secret': 6, 'shiny': 5, 'ultra-rare': 4, 'ultra rare': 4, 'holographic': 3, 'rare': 2, 'uncommon': 1, 'common': 0
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
        setAllCards(response.data.allCards || []);
        setFavoriteCardId(response.data.favoriteCardId || null);
        
        // Actualizar nivel y experiencia en el store global
        if (response.data.level !== undefined && response.data.xp !== undefined) {
          useAuthStore.getState().updateUserStats(response.data.level, response.data.xp, response.data.completedExpansions);
        }
      } catch (error) {
        console.error("Error cargando álbum:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, []);

  const handleSetFavorite = async (cardId: string) => {
    if (settingFavorite) return;
    setSettingFavorite(true);
    const isCurrentFavorite = favoriteCardId === cardId;
    try {
      // Si ya es la favorita, mandamos null para desmarcarla
      await api.post('/user/favorite', { cardId: isCurrentFavorite ? null : cardId });
      setFavoriteCardId(isCurrentFavorite ? null : cardId);
      playSfx('/sounds/select.mp3');
    } catch (error) {
      console.error('Error al cambiar estado de favorita:', error);
    } finally {
      setSettingFavorite(false);
    }
  };

  const playSfx = (path: string) => {
    const audio = new Audio(path);
    audio.play().catch(() => {});
  };

  const stats = useMemo(() => {
    const currentExp = EXPANSIONS[activeTab];
    
    const filteredAllCards = allCards.filter(card => {
      const cardId = card.id.toLowerCase();
      if (activeTab === 'xy5') return cardId.startsWith('xy5-');
      if (activeTab === 'swsh12') return cardId.startsWith('swsh12-');
      if (activeTab === 'dp6') return cardId.startsWith('card-') || cardId.startsWith('dp6');
      if (activeTab === 'bw9') return cardId.startsWith('bw9-') || cardId.startsWith('bw-');
      if (activeTab === 'xyp') return cardId.startsWith('xyp-') || cardId.startsWith('xy-') || cardId.startsWith('621-');
      if (activeTab === 'sm3') return cardId.startsWith('sm3-');
      if (activeTab === 'zsv10pt5') return cardId.startsWith('zsv10pt5-');
      return false;
    });
    
    const mappedEntries = filteredAllCards.map(card => {
      const ownedIndex = entries.findIndex(e => String(e.card.id).trim().toLowerCase() === String(card.id).trim().toLowerCase());
      const owned = ownedIndex !== -1 ? entries[ownedIndex] : null;
      return {
        card: card,
        quantity: owned ? owned.quantity : 0,
        unlocked: !!owned,
        acquiredIndex: ownedIndex
      };
    }).filter(e => !(e.card.rarity.toLowerCase() === 'divine' && !e.unlocked));
    
    const standardEntries = mappedEntries.filter(e => e.card.rarity.toLowerCase() !== 'divine');
    const uniqueCount = standardEntries.filter(e => e.unlocked).length;
    const progress = Math.min(100, Math.round((uniqueCount / currentExp.total) * 100));
    
    const sorted = [...mappedEntries].sort((a, b) => {
      if (sortBy === 'recent') {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (a.unlocked && b.unlocked) {
          return b.acquiredIndex - a.acquiredIndex; // Newest acquired first
        }
        // If both locked, sort by ID
        const numA = parseInt(a.card.id.split('-')[1]) || 0;
        const numB = parseInt(b.card.id.split('-')[1]) || 0;
        return numA - numB;
      }

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
  }, [entries, allCards, sortBy, activeTab]);

  const selectedEntry = useMemo(() => 
    entries.find(e => e.card.id === selectedCardId), 
    [entries, selectedCardId]
  );

  const currentBgEffect = useMemo(() => {
    if (!selectedEntry) return 'none';
    const rarity = selectedEntry.card.rarity.toLowerCase();
    if (rarity === 'divine') return 'divine';
    if (rarity.includes('ultra-secret') || rarity.includes('ultra secret')) return 'ultra-secret';
    if (rarity.includes('super-secret') || rarity.includes('super secret')) return 'super-secret';
    if (rarity.includes('secret')) return 'secret';
    if (rarity.includes('shiny')) return 'shiny';
    if (rarity.includes('ultra')) return 'ultra';
    return 'none';
  }, [selectedEntry]);

  if (loading) return <div className="p-10 text-center text-white italic">Cargando colección...</div>;

  return (
    <div 
      className="p-10 min-h-screen bg-transparent text-white relative overflow-x-hidden"
      onClick={() => {
        if (albumMusicRef.current && albumMusicRef.current.paused) {
          albumMusicRef.current.play().catch(() => {});
        }
      }}
    >
      
      <AnimatePresence>
        {currentBgEffect === 'divine' && (
          <motion.div
            key="divine-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 0.95, 0.6], scale: [1, 1.03, 1] }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center bg-black/50"
          >
            {/* Nebulosa cósmica celestial (Violeta/Púrpura y Oro) */}
            <div className="absolute inset-0 opacity-[0.25] bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.45)_0%,rgba(251,191,36,0.25)_40%,transparent_75%)] blur-[30px]" />

            {/* Rayos divinos giratorios (God Rays principales) */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute w-[180vmax] h-[180vmax] opacity-[0.45] bg-[conic-gradient(from_0deg,transparent_15%,rgba(251,191,36,0.35)_30%,transparent_45%,rgba(167,139,250,0.25)_60%,transparent_75%,rgba(217,119,6,0.25)_85%,transparent_100%)] blur-[35px]"
            />

            {/* Foco de luz sagrada en el centro */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(251,191,36,0.5)_0%,rgba(0,0,0,0)_60%)]" />
            
            {/* Pulsación dorada mística de fondo */}
            <motion.div 
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle,rgba(217,119,6,0.7)_0%,rgba(167,139,250,0.2)_30%,rgba(0,0,0,0)_60%)]" 
            />

            {/* Estrellas estelares de 4 puntas flotando en el fondo que cambian de color (REDUCIDAS A 6 Y CON RUTA FIJA) */}
            {[...Array(6)].map((_, i) => {
              const scale = 0.5 + Math.abs(Math.sin(i * 123)) * 1.0;
              const duration = 4.5 + Math.abs(Math.cos(i * 505)) * 3;
              
              // Coordenadas deterministas de flotación sin usar Math.random() para evitar parpadeos
              const x1 = `${Math.sin(i * 27) * 40}vw`;
              const x2 = `${Math.cos(i * 73) * 40}vw`;
              const x3 = `${Math.sin(i * 119) * 40}vw`;
              
              const y1 = `${Math.cos(i * 43) * 40}vh`;
              const y2 = `${Math.sin(i * 89) * 40}vh`;
              const y3 = `${Math.cos(i * 131) * 40}vh`;

              return (
                <motion.div
                  key={`divine-star-${i}`}
                  initial={{ 
                    x: `${Math.sin(i * 11) * 35}vw`, 
                    y: `${Math.cos(i * 66) * 35}vh`,
                    scale: 0,
                    opacity: 0,
                    rotate: Math.abs(Math.cos(i * 505)) * 360,
                    color: '#fbbf24'
                  }}
                  animate={{ 
                    x: [x1, x2, x3],
                    y: [y1, y2, y3],
                    scale: [0, scale, 0],
                    opacity: [0, 0.9, 0],
                    rotate: [0, 180, 360],
                    color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                  }}
                  transition={{ 
                    duration: duration, 
                    repeat: Infinity, 
                    delay: Math.abs(Math.cos(i * 909)) * 2.5,
                    ease: "easeInOut"
                  }}
                  className="absolute pointer-events-none"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}>
                    <path d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9Z" />
                  </svg>
                </motion.div>
              );
            })}

            {/* Esferas doradas originales (REDUCIDAS A 8 Y CON RUTA FIJA) */}
            {[...Array(8)].map((_, i) => {
              const scale = 0.8 + Math.abs(Math.sin(i * 243)) * 0.8;
              const duration = 3.5 + Math.abs(Math.cos(i * 909)) * 2.5;
              const delay = Math.abs(Math.cos(i * 303)) * 2.0;

              // Coordenadas deterministas de flotación
              const sx1 = `${Math.sin(i * 37) * 42}vw`;
              const sx2 = `${Math.cos(i * 83) * 42}vw`;
              const sx3 = `${Math.sin(i * 149) * 42}vw`;
              
              const sy1 = `${Math.cos(i * 53) * 42}vh`;
              const sy2 = `${Math.sin(i * 97) * 42}vh`;
              const sy3 = `${Math.cos(i * 163) * 42}vh`;

              return (
                <motion.div
                  key={`divine-sphere-${i}`}
                  initial={{ 
                    x: `${Math.sin(i * 11) * 35}vw`, 
                    y: `${Math.cos(i * 66) * 35}vh`,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    x: [sx1, sx2, sx3],
                    y: [sy1, sy2, sy3],
                    scale: [0, scale, 0],
                    opacity: [0, 0.85, 0],
                  }}
                  transition={{ 
                    duration: duration, 
                    repeat: Infinity, 
                    delay: delay,
                    ease: "easeInOut"
                  }}
                  className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 blur-[1px] shadow-[0_0_12px_#fbbf24]"
                />
              );
            })}
          </motion.div>
        )}
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
            
            {/* ESTRELLAS ESMERALDA Y ORO DE ALTO BRILLO – PATRÓN DE EXPANSIÓN ORGÁNICA PARA TODA LA PANTALLA */}
            {[...Array(22)].map((_, i) => {
              const angle = (i * 2 * Math.PI) / 22;
              const rStart = 4 + (i % 4) * 10;
              const rEnd = rStart + 55 + (i % 3) * 15;
              const duration = 4.0 + Math.abs(Math.sin(i * 404)) * 3.5;
              const delay = Math.abs(Math.sin(i * 606)) * 4.5;
              
              const xStart = `${Math.cos(angle) * rStart}vmax`;
              const yStart = `${Math.sin(angle) * rStart}vmax`;
              const xMid = `${Math.cos(angle + 0.25) * (rStart + rEnd) * 0.5}vmax`;
              const yMid = `${Math.sin(angle + 0.25) * (rStart + rEnd) * 0.5}vmax`;
              const xEnd = `${Math.cos(angle + 0.4) * rEnd}vmax`;
              const yEnd = `${Math.sin(angle + 0.4) * rEnd}vmax`;

              return (
                <motion.div
                  key={i}
                  initial={{ 
                    x: xStart, 
                    y: yStart,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    x: [xStart, xMid, xEnd],
                    y: [yStart, yMid, yEnd],
                    scale: [0, 2.2, 0],
                    opacity: [0, 0.95, 0],
                  }}
                  transition={{ 
                    duration: duration, 
                    repeat: Infinity, 
                    delay: delay,
                    ease: "easeOut"
                  }}
                  className={`absolute w-3 h-3 rotate-45 rounded-sm blur-[0.5px] ${
                    i % 2 === 0 
                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-300 shadow-[0_0_15px_#10b981]' 
                      : 'bg-gradient-to-r from-yellow-300 to-emerald-400 shadow-[0_0_15px_#eab308]'
                  }`}
                />
              );
            })}
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
            
            {/* LLUVIA DE METEOROS MULTIDIRECCIONALES Y BALANCEADOS – SIN ACUMULACIONES */}
            {[...Array(15)].map((_, i) => {
              const type = i % 3;
              const col = i % 5;
              const row = Math.floor(i / 5);
              
              const xStart = -60 + col * 26 + row * 6;
              const yStart = -75 - row * 22;
              
              let xEnd = xStart;
              let yEnd = 70;
              let rotation = 0;
              
              if (type === 0) {
                // Diagonal izquierda
                xEnd = xStart - 28;
                rotation = -32;
              } else if (type === 1) {
                // Diagonal derecha
                xEnd = xStart + 28;
                rotation = 32;
              } else {
                // Casi vertical
                xEnd = xStart - 4;
                rotation = -6;
              }

              const dur = 3.2 + Math.abs(Math.cos(i * 505)) * 3;
              const delay = Math.abs(Math.cos(i * 707)) * 7;

              return (
                <motion.div
                  key={i}
                  initial={{ 
                    x: `${xStart}vw`, 
                    y: `${yStart}vh`,
                    rotate: rotation,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    x: `${xEnd}vw`,
                    y: `${yEnd}vh`,
                    rotate: rotation,
                    scale: [0, 2.0, 0],
                    opacity: [0, 0.95, 0],
                  }}
                  transition={{ 
                    duration: dur, 
                    repeat: Infinity, 
                    delay: delay,
                    ease: "linear"
                  }}
                  className="absolute w-1.5 h-16 rounded-full bg-gradient-to-b from-yellow-300 via-rose-400 to-transparent blur-[1px] shadow-[0_0_15px_#eab308]"
                />
              );
            })}
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
                  x: `${Math.sin(i * 11) * 50}vw`, 
                  y: `${Math.cos(i * 66) * 50}vh`,
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
                  duration: 2 + Math.abs(Math.cos(i * 909)) * 2, 
                  repeat: Infinity, 
                  delay: Math.abs(Math.sin(i * 808)) * 1.2,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-red-500 to-orange-400 blur-[2px] shadow-[0_0_10px_#f43f5e]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="flex gap-6 mb-8 justify-start overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full">
          {(Object.keys(EXPANSIONS) as Array<keyof typeof EXPANSIONS>).map((key) => {
            const isActive = activeTab === key;
            const expColorClass = EXPANSIONS[key].color;
            const bgColorClass = expColorClass.replace('text-', 'bg-');
            
            return (
              <button
                key={key}
                onClick={() => { playSelect(); setActiveTab(key); setSelectedCardId(null); }}
                className={`group relative shrink-0 pb-2 px-4 transition-all duration-300 outline-none focus:outline-none select-none`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className={`relative z-10 font-black uppercase tracking-widest text-xs transition-all duration-300 ${isActive ? (key === 'xy5' ? 'bg-gradient-to-r from-red-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(220,38,38,0.25)] pr-2' : expColorClass) : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {EXPANSIONS[key].name}
                </span>
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300 ${isActive ? (key === 'xy5' ? 'bg-gradient-to-r from-red-600 to-cyan-500 opacity-100 shadow-[0_0_8px_rgba(220,38,38,0.55)]' : bgColorClass) : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>

        <div className={`mb-12 ${currentTheme.panelBgClass} p-8 rounded-3xl border backdrop-blur-sm shadow-2xl transition-colors duration-500`}>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
            <div>
              <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none mb-2 break-words ${stats.currentExp.color}`}>
                {stats.currentExp.name}
              </h2>
              <p className="text-gray-400 font-medium tracking-widest uppercase text-xs font-sans">Colección de Expansión</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-white">{stats.uniqueCount}</span>
              <span className="text-gray-500 font-bold text-xl"> / {stats.currentExp.total}</span>
              {stats.progress >= 100 ? (
                <div className="flex flex-col items-end gap-1 mt-1">
                  <span className="text-yellow-400 font-black text-sm uppercase italic animate-pulse flex items-center gap-1.5">
                    <span className="animate-bounce">🏆</span> ¡COLECCIÓN COMPLETA!
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 font-black text-[10px] uppercase tracking-widest italic animate-pulse">
                    ✨ RECOMPENSA DIVINA OBTENIDA ✨
                  </span>
                </div>
              ) : (
                <p className={`${stats.currentExp.color} font-black text-sm mt-1 uppercase italic`}>{stats.progress}% Completado</p>
              )}
            </div>
          </div>
          <div className="w-full bg-black/50 rounded-full h-3 border border-white/5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.progress}%` }} className={`h-full transition-all duration-1000 bg-gradient-to-r ${stats.currentExp.bar} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
          </div>
        </div>

        <div className="flex justify-end mb-8">
          <div className="flex items-center gap-3 bg-black/40 p-2 px-4 rounded-2xl border shadow-lg" style={{ borderColor: `rgba(${currentTheme.accentRgb}, 0.2)` }}>
            <span className="text-[10px] font-black text-gray-500 uppercase italic tracking-wider">Ordenar por:</span>
            <select value={sortBy} onChange={(e) => { playSelect(); setSortBy(e.target.value as SortOrder); }} className={`bg-transparent ${stats.currentExp.color} font-bold text-sm outline-none cursor-pointer`}>
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
            const isDivine = rKey === 'divine';

            return (
              <div key={`${entry.card.id}-${index}`} className="relative aspect-[2/3] cursor-pointer"
                onClick={() => { if(entry.unlocked) { playSelect(); setSelectedCardId(isSelected ? null : entry.card.id); } }}>
                
                <motion.div 
                  animate={isSelected && entry.unlocked ? { scale: 1.05, zIndex: 50 } : { scale: 1 }}
                  className={`w-full h-full p-3 rounded-xl border-2 transition-all duration-500 relative overflow-hidden flex flex-col
                    ${isSelected && entry.unlocked ? `${style.border} ${style.bg} ${style.shadow}` : 'border-gray-800 bg-gray-800/50'}
                    ${!entry.unlocked ? 'grayscale opacity-75' : ''}`}
                >
                  {isSelected && entry.unlocked && (
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
                            className="absolute inset-0 border-[2.5px] rounded-xl z-30 pointer-events-none opacity-100" 
                          />
                          <div className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-skew-slide-3s" />
                        </>
                      ) : (
                        <>
                          {isDivine ? (
                            <div className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent animate-skew-slide-2_5s" />
                          ) : (isHolo || isUltra || isSecret || isSuperSecret || isUltraSecret) && (
                            <div className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-skew-slide-2_5s" />
                          )}
                          {isUltra && !isUltraSecret && (
                            <>
                              <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle,rgba(234,179,8,0.25)_0%,transparent_75%)]" />
                              <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-2 rounded-xl z-30 pointer-events-none border-yellow-400/85 shadow-[0_0_30px_rgba(234,179,8,0.85)]" />
                            </>
                          )}
                          {isSuperSecret && (
                            <>
                              <div className="absolute inset-0 z-0 pointer-events-none animate-super-secret-bg" />
                              <div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)] animate-spin-slow-8s" />
                              <div className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-emerald-400/95 shadow-[0_0_35px_rgba(52,211,153,0.95),inset_0_0_20px_rgba(52,211,153,0.8)] animate-super-secret-pulse" />
                            </>
                          )}
                          {isUltraSecret && (
                            <>
                              <div className="absolute inset-0 z-0 pointer-events-none animate-ultra-secret-bg" />
                              <div className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-yellow-400/95 shadow-[0_0_40px_rgba(234,179,8,0.95)] animate-ultra-secret-pulse" />
                            </>
                          )}
                          {isDivine && (
                            <>
                              {/* Fondo de energía divina animado */}
                              <div className="absolute inset-0 z-0 pointer-events-none animate-divine-bg" />
                              
                              {/* Aura sagrada giratoria (God Rays internos) */}
                              <div className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] z-0 opacity-70 pointer-events-none bg-[conic-gradient(from_0deg,transparent_10%,rgba(251,191,36,0.45)_25%,transparent_40%,rgba(251,191,36,0.45)_60%,transparent_75%,rgba(167,139,250,0.3)_90%,transparent_100%)] blur-[8px] animate-spin-slow-15s" />

                              {/* Resplandor del Borde Sagrado (Dorado y Místico) */}
                              <div className="absolute inset-0 border-[2.5px] rounded-xl z-30 pointer-events-none border-amber-400 animate-divine-pulse" />
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {isSelected && (isShiny || isSecret || isSuperSecret || isUltraSecret || isDivine) && (
                    <>
                      {/* Holographic Foil Texture Overlay */}
                      {isDivine ? (
                        <>
                          {/* 1. Esferas doradas independientes para Divine */}
                          {[...Array(6)].map((_, i) => {
                            const top = 5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80;
                            const left = 5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80;
                            const scale = 1.1 + Math.abs(Math.sin(i * 53)) * 0.7;
                            const delay = i * 0.4;
                            const duration = 4.5 + Math.abs(Math.cos(i * 71)) * 3.0;
                            const dx = Math.sin(i * 41) * 16;
                            const dy = Math.cos(i * 67) * 16;

                            return (
                              <motion.div
                                key={`divine-card-sphere-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 1.0, 0],
                                  scale: [0, scale, 0],
                                  x: [0, dx, 0],
                                  y: [0, dy, 0]
                                }}
                                transition={{ repeat: Infinity, duration, delay, ease: "easeInOut" }}
                                style={{ top: `${top}%`, left: `${left}%` }}
                                className="absolute z-20 pointer-events-none"
                              >
                                <div className="w-[12px] h-[12px] rounded-full bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-400 blur-[0.1px] shadow-[0_0_18px_#fbbf24,0_0_8px_#fbbf24,0_0_4px_#fff] rotate-45" />
                              </motion.div>
                            );
                          })}

                          {/* 2. Estrellas de colores estables independientes para Divine */}
                          {[...Array(6)].map((_, i) => {
                            const top = 5 + ((Math.abs(Math.sin(i * 37)) * 1000) % 1) * 80;
                            const left = 5 + ((Math.abs(Math.cos(i * 41)) * 1000) % 1) * 80;
                            const scale = 1.1 + Math.abs(Math.sin(i * 53)) * 0.7;
                            const delay = i * 0.4 + 0.2; // Desfasado de las esferas para que aparezcan alternadas
                            const duration = 4.5 + Math.abs(Math.cos(i * 71)) * 3.0;
                            const dx = Math.sin(i * 59) * 16;
                            const dy = Math.cos(i * 61) * 16;

                            const DIVINE_COLORS = ['#fbbf24', '#bd00ff', '#ef4444', '#06b6d4'];
                            const starColor = DIVINE_COLORS[i % DIVINE_COLORS.length];

                            return (
                              <motion.div
                                key={`divine-card-star-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 1.0, 0],
                                  scale: [0, scale, 0],
                                  x: [0, dx, 0],
                                  y: [0, dy, 0]
                                }}
                                transition={{ repeat: Infinity, duration, delay, ease: "easeInOut" }}
                                style={{ top: `${top}%`, left: `${left}%` }}
                                className="absolute z-20 pointer-events-none"
                              >
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 4 + Math.abs(Math.sin(i * 404)) * 3, ease: "linear" }}
                                >
                                  <svg 
                                    className="w-[14px] h-[14px] fill-current" 
                                    viewBox="0 0 24 24" 
                                    style={{ 
                                      color: starColor, 
                                      filter: `drop-shadow(0 0 14px ${starColor}) drop-shadow(0 0 8px ${starColor}) drop-shadow(0 0 3px #fff)` 
                                    }}
                                  >
                                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.6L12 0Z" />
                                  </svg>
                                </motion.div>
                              </motion.div>
                            );
                          })}
                        </>
                      ) : (
                        [...Array(8)].map((_, i) => {
                          // Para ultra-secret seguimos un patrón ordenado de cascada uniforme; para las otras es aleatorio
                          // Cálculo de posiciones aleatorias fijas (3 saltos)
                          const t1 = 5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80;
                          const t2 = 5 + ((Math.abs(Math.sin(i * 41)) * 1000) % 1) * 80;
                          const t3 = 5 + ((Math.abs(Math.sin(i * 73)) * 1000) % 1) * 80;
                          const l1 = 5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80;
                          const l2 = 5 + ((Math.abs(Math.cos(i * 47)) * 1000) % 1) * 80;
                          const l3 = 5 + ((Math.abs(Math.cos(i * 79)) * 1000) % 1) * 80;

                          // Ultra-secret streaks mantienen su posición original de cascada
                          const usTop = 5 + ((i * 12) % 65);
                          const usLeft = 10 + (i * 10);

                          const scale = isUltraSecret ? 1.25 : 0.6 + Math.abs(Math.cos(i * 101)) * 0.7;
                          const delay = isUltraSecret ? i * 0.22 : i * 0.25;
                          const duration = isUltraSecret ? 1.8 : 2.5 + Math.abs(Math.sin(i * 202)) * 1.5;
                          
                          const animateProps = isUltraSecret 
                            ? {
                                opacity: [0, 1.0, 0],
                                scale: [0.35, scale, 0.35],
                                x: [25, 0, -25],
                                y: [-30, 0, 30],
                                top: [`${usTop}%`, `${usTop}%`, `${usTop}%`],
                                left: [`${usLeft}%`, `${usLeft}%`, `${usLeft}%`],
                                color: i % 2 === 0 
                                  ? ['rgba(255,255,255,0.98)', 'rgba(254,240,138,1)', 'rgba(244,63,94,0.98)', 'rgba(255,255,255,0.98)']
                                  : ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.98)'],
                                boxShadow: i % 2 === 0
                                  ? ['0 0 12px rgba(255,255,255,0.85)', '0 0 24px rgba(234,179,8,1)', '0 0 24px rgba(244,63,94,1)', '0 0 12px rgba(255,255,255,0.85)']
                                  : ['0 0 12px rgba(255,255,255,0.7)', '0 0 12px rgba(255,255,255,0.7)']
                              }
                            : {
                                opacity: [0, 1.0, 0, 0, 1.0, 0, 0, 1.0, 0],
                                scale: [0, scale, 0, 0, scale, 0, 0, scale, 0],
                                top: [`${t1}%`, `${t1}%`, `${t1}%`, `${t2}%`, `${t2}%`, `${t2}%`, `${t3}%`, `${t3}%`, `${t3}%`],
                                left: [`${l1}%`, `${l1}%`, `${l1}%`, `${l2}%`, `${l2}%`, `${l2}%`, `${l3}%`, `${l3}%`, `${l3}%`]
                              };
                          
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={animateProps}
                              transition={{ repeat: Infinity, duration: duration * 3, delay, ease: "easeInOut" }}
                              className="absolute z-20 pointer-events-none"
                            >
                              {isShiny ? (
                                <svg className="w-[16px] h-[16px] text-white fill-current drop-shadow-[0_0_9px_rgba(255,255,255,1)] drop-shadow-[0_0_3px_#fff]" viewBox="0 0 24 24">
                                  <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.6L12 0Z" />
                                </svg>
                              ) : isSecret ? (
                                <div className="w-[11px] h-[11px] rounded-full bg-gradient-to-r from-fuchsia-200 via-rose-100 to-orange-200 blur-[0.2px] shadow-[0_0_10px_#f43f5e,0_0_4px_#fff]" />
                              ) : isSuperSecret ? (
                                <div className={`w-[11px] h-[11px] rotate-45 rounded-sm blur-[0.2px] ${i % 2 === 0 ? 'bg-gradient-to-r from-emerald-200 via-teal-100 to-cyan-200 shadow-[0_0_10px_#34d399,0_0_4px_#fff]' : 'bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-300 shadow-[0_0_10px_#fde047,0_0_4px_#fff]'}`} />
                              ) : isUltraSecret ? (
                                <div className="w-[4.5px] h-[56px] rounded-full -rotate-[35deg] bg-gradient-to-b from-current via-current/60 to-transparent" />
                              ) : null}
                            </motion.div>
                          );
                        })
                      )}

                      {/* Extra Holographic Diamond Sparkles (Ultra-Secret exclusive) */}
                      {isUltraSecret && (
                        <>
                          {[...Array(6)].map((_, i) => {
                            const t1 = 5 + ((Math.abs(Math.sin(i * 19)) * 1000) % 1) * 85;
                            const t2 = 5 + ((Math.abs(Math.sin(i * 43)) * 1000) % 1) * 85;
                            const t3 = 5 + ((Math.abs(Math.sin(i * 61)) * 1000) % 1) * 85;
                            const l1 = 5 + ((Math.abs(Math.cos(i * 23)) * 1000) % 1) * 85;
                            const l2 = 5 + ((Math.abs(Math.cos(i * 47)) * 1000) % 1) * 85;
                            const l3 = 5 + ((Math.abs(Math.cos(i * 67)) * 1000) % 1) * 85;
                            
                            const scale = 0.9 + Math.abs(Math.cos(i * 101)) * 0.7;
                            const delay = i * 0.4;
                            const duration = 2.0 + Math.abs(Math.cos(i * 303)) * 1.5;
                            
                            return (
                              <motion.div
                                key={`ultra-diamond-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 1.0, 0, 0, 1.0, 0, 0, 1.0, 0],
                                  scale: [0, scale, 0, 0, scale, 0, 0, scale, 0],
                                  top: [`${t1}%`, `${t1}%`, `${t1}%`, `${t2}%`, `${t2}%`, `${t2}%`, `${t3}%`, `${t3}%`, `${t3}%`],
                                  left: [`${l1}%`, `${l1}%`, `${l1}%`, `${l2}%`, `${l2}%`, `${l2}%`, `${l3}%`, `${l3}%`, `${l3}%`]
                                }}
                                transition={{ repeat: Infinity, duration: duration * 3, delay, ease: "easeInOut" }}
                                className="absolute z-20 pointer-events-none"
                              >
                                <svg className="w-[20px] h-[36px] text-white fill-current drop-shadow-[0_0_10px_rgba(255,255,255,1)] drop-shadow-[0_0_3px_#fff]" viewBox="0 0 24 24" preserveAspectRatio="none">
                                  <path d="M12 0 L17 12 L12 24 L7 12 Z" />
                                </svg>
                              </motion.div>
                            );
                          })}
                        </>
                      )}
                    </>
                  )}

                  {/* Quantity badge */}
                  {entry.unlocked && (
                    <div className={`absolute -top-1 -right-1 ${currentTheme.accentClass} font-black w-6 h-6 flex items-center justify-center rounded-full z-40 border-2 border-gray-900 text-[9px] shadow-xl`}>
                      x{entry.quantity}
                    </div>
                  )}

                  {/* Favorite star badge */}
                  {entry.unlocked && favoriteCardId === entry.card.id && (
                    <div className={`absolute -top-1 -left-1 ${currentTheme.accentClass} font-black w-6 h-6 flex items-center justify-center rounded-full z-40 border-2 border-gray-900 text-[10px] shadow-xl`}>
                      ⭐
                    </div>
                  )}

                  <div className="relative w-full flex-1 min-h-0 mb-3 flex items-center justify-center">
                    <img src={entry.card.imageUrl} alt={entry.card.name} className={`w-full h-full object-contain relative z-10 transition-all duration-500 ${!isSelected ? 'grayscale-[0.5] opacity-60' : 'drop-shadow-2xl grayscale-0 opacity-100'} ${!entry.unlocked ? 'grayscale opacity-40 brightness-50' : ''}`} />
                    {!entry.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center z-50">
                        <span className="text-5xl drop-shadow-[0_0_15px_rgba(0,0,0,1)]">🔒</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto text-center relative z-20 pt-1">
                    <p className={`font-bold text-[9px] uppercase truncate tracking-widest leading-none mb-2 ${isSelected ? 'text-white' : 'text-gray-500'}`}>{entry.card.name}</p>
                    {isSelected && (
                      <>
                        {entry.card.rarity.toLowerCase() === 'divine' ? (
                          <span className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase animate-divine-text-badge">
                            {entry.card.rarity}
                          </span>
                        ) : ['ultra-secret', 'ultra secret'].includes(entry.card.rarity.toLowerCase()) ? (
                          <span className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase animate-ultra-secret-text-badge">
                            {entry.card.rarity}
                          </span>
                        ) : (
                          <span className={`text-[7px] px-2 py-0.5 rounded-full border ${['super-secret', 'super secret'].includes(entry.card.rarity.toLowerCase()) ? 'border-emerald-400' : style.border} ${style.text} bg-black/60 font-black tracking-tighter inline-block uppercase`}>{entry.card.rarity}</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSetFavorite(entry.card.id); }}
                          disabled={settingFavorite}
                          className={`mt-2 block w-full text-[8px] font-black uppercase tracking-widest py-1 px-2 rounded-full transition-all duration-200
                            ${favoriteCardId === entry.card.id
                              ? `${currentTheme.mobileActiveNavClass} border border-current/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 cursor-pointer ${currentTheme.glowClass}`
                              : `bg-white/5 hover:${currentTheme.mobileActiveNavClass} text-gray-400 border border-white/10 hover:border-current/30 cursor-pointer`
                            } disabled:opacity-50 disabled:cursor-wait`}
                        >
                          {favoriteCardId === entry.card.id ? '⭐ Favorita (Quitar)' : settingFavorite ? '...' : '☆ Marcar favorita'}
                        </button>
                      </>
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
