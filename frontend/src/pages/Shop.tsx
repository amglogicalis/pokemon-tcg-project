import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import BoosterPack from '../components/BoosterPack';
import { motion, AnimatePresence } from 'framer-motion';

const rarityWeight: Record<string, number> = {
  'common': 1, 'uncommon': 2, 'rare': 3, 'holographic': 4, 'ultra-rare': 5, 'ultra rare': 5, 'shiny': 6, 'secret': 7, 'super-secret': 8, 'super secret': 8, 'ultra-secret': 9, 'ultra secret': 9
};

const EXPANSIONS = [ 
  { id: 'sm3', name: 'BURNING SHADOWS', color: 'text-red-950' }, 
  { id: 'dp6', name: 'Legends Awakened', color: 'text-yellow-500' },
  { id: 'bw9', name: 'Plasma Blast', color: 'text-blue-400' },
  { id: '621', name: 'XY Black Star Promos', color: 'text-red-500' },
  { id: 'zsv10pt5', name: 'BLACK BOLT', color: 'text-indigo-600' }
];

export default function Shop() {
  const [loading, setLoading] = useState(false);
  const [newCards, setNewCards] = useState<any[]>([]);
  const [showCards, setShowCards] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedExp, setSelectedExp] = useState('dp6');

  const homeMusicRef = useRef<HTMLAudioElement | null>(null);
  const packMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (loading || (showCards && revealedCount < 5)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [loading, showCards, revealedCount]);

  // Hook para determinar el efecto de fondo según la última carta revelada
  const currentBgEffect = useMemo(() => {
    if (!showCards || revealedCount === 0) return 'none';
    const lastCard = newCards[revealedCount - 1];
    if (!lastCard) return 'none';
    
    const rarity = lastCard.rarity.toLowerCase();
    if (rarity.includes('ultra-secret') || rarity.includes('ultra secret')) return 'ultra-secret';
    if (rarity.includes('super-secret') || rarity.includes('super secret')) return 'super-secret';
    if (rarity.includes('secret')) return 'secret';
    if (rarity.includes('shiny')) return 'shiny';
    if (rarity.includes('ultra')) return 'ultra';
    
    return 'none';
  }, [showCards, revealedCount, newCards]);

  const playSfx = (path: string) => {
    const audio = new Audio(path);
    audio.play().catch(() => {}); 
  };

  const playSelect = () => {
    const audio = new Audio('/sounds/select.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    homeMusicRef.current = new Audio('/sounds/home-music.mp3');
    homeMusicRef.current.loop = true;
    homeMusicRef.current.volume = 0.35;

    packMusicRef.current = new Audio('/sounds/while-op-pack.mp3');
    packMusicRef.current.loop = true;
    packMusicRef.current.volume = 0.35;

    return () => {
      if (homeMusicRef.current) {
        homeMusicRef.current.pause();
        homeMusicRef.current = null;
      }
      if (packMusicRef.current) {
        packMusicRef.current.pause();
        packMusicRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const isOpening = loading || showCards;
    
    if (isOpening) {
      if (homeMusicRef.current) {
        homeMusicRef.current.pause();
        homeMusicRef.current.currentTime = 0;
      }
      if (packMusicRef.current) {
        packMusicRef.current.play().catch(err => console.log('Autoplay blocked:', err));
      }
    } else {
      if (packMusicRef.current) {
        packMusicRef.current.pause();
        packMusicRef.current.currentTime = 0;
      }
      if (homeMusicRef.current) {
        homeMusicRef.current.play().catch(err => console.log('Autoplay blocked:', err));
      }
    }
  }, [loading, showCards]);

  const handleOpenPack = async () => {
    if (loading) return;
    setNewCards([]);
    setShowCards(false);
    setRevealedCount(0);
    setLoading(true);

    // Reproducir el sonido de sobre abierto (rasgado/animación) inmediatamente al iniciar
    playSfx('/sounds/pack-opened.mp3');

    try {
      const response = await api.post('/packs/open', { expansion: selectedExp });
      const cards = response.data.cards.sort((a: any, b: any) => 
        (rarityWeight[a.rarity.toLowerCase()] || 0) - (rarityWeight[b.rarity.toLowerCase()] || 0)
      );
      setNewCards(cards);
      
      setTimeout(() => {
        setShowCards(true);
        setRevealedCount(1);
        
        // Reproducir sonido para la primera carta (índice 0)
        const firstCard = cards[0];
        if (firstCard) {
          const rarity = firstCard.rarity.toLowerCase().trim();
          let raritySfx = '';
          if (rarity.includes('ultra-secret') || rarity.includes('ultra secret')) {
            raritySfx = '/sounds/ultra-secret-pull.mp3';
          } else if (rarity.includes('super-secret') || rarity.includes('super secret')) {
            raritySfx = '/sounds/super-secret-pull.mp3';
          } else if (rarity.includes('secret')) {
            raritySfx = '/sounds/secret-pull.mp3';
          } else if (rarity.includes('shiny')) {
            raritySfx = '/sounds/shiny-pull.mp3';
          } else if (rarity.includes('ultra')) {
            raritySfx = '/sounds/ultra-rare-pull.mp3';
          } else if (rarity.includes('holographic') || rarity.includes('holo')) {
            raritySfx = '/sounds/hollographic-pull.mp3';
          } else if (rarity.includes('rare')) {
            raritySfx = '/sounds/rare-pull.mp3';
          }

          if (raritySfx) {
            playSfx(raritySfx);
          } else {
            playSfx('/sounds/next-card.mp3'); // Sonido por defecto para comunes/infrecuentes
          }
        }

        setLoading(false);
      }, 800);
    } catch (error) {
      alert('No te quedan sobres o hay un error de conexión');
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (revealedCount < newCards.length) {
      // 1. Sonido de transición/click inmediato
      playSfx('/sounds/next-card.mp3');

      // 2. Determinar y reproducir sonido de rareza con un leve retraso para doble impacto sensorial
      const nextCardObj = newCards[revealedCount];
      const rarity = nextCardObj.rarity.toLowerCase().trim();
      let raritySfx = '';

      if (rarity.includes('ultra-secret') || rarity.includes('ultra secret')) {
        raritySfx = '/sounds/ultra-secret-pull.mp3';
      } else if (rarity.includes('super-secret') || rarity.includes('super secret')) {
        raritySfx = '/sounds/super-secret-pull.mp3';
      } else if (rarity.includes('secret')) {
        raritySfx = '/sounds/secret-pull.mp3';
      } else if (rarity.includes('shiny')) {
        raritySfx = '/sounds/shiny-pull.mp3';
      } else if (rarity.includes('ultra')) {
        raritySfx = '/sounds/ultra-rare-pull.mp3';
      } else if (rarity.includes('holographic') || rarity.includes('holo')) {
        raritySfx = '/sounds/hollographic-pull.mp3';
      } else if (rarity.includes('rare')) {
        raritySfx = '/sounds/rare-pull.mp3';
      }

      if (raritySfx) {
        setTimeout(() => {
          playSfx(raritySfx);
        }, 150);
      }

      setRevealedCount(prev => prev + 1);
    }
  };

  return (
    <div 
      className="relative min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden"
      onClick={() => showCards && revealedCount < 5 && nextCard()}
    >
      {/* FONDO BASE LIMPIO */}
      <div className="fixed inset-0 pointer-events-none z-0 shadow-[inset_0_0_500px_rgba(0,0,0,0.8)] bg-gray-900" />

      {/* EFECTOS DE FONDO DINÁMICOS - AMPLIADOS */}
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

      <AnimatePresence mode="wait">
        {!showCards ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="flex flex-col items-center z-10"
          >
            <div className="flex gap-6 mb-12 bg-black/30 p-2 px-6 rounded-full border border-white/5 backdrop-blur-xl">
              {EXPANSIONS.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => { playSelect(); setSelectedExp(exp.id); }}
                  className={`py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedExp === exp.id ? exp.color : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {exp.name}
                  {selectedExp === exp.id && (
                    <motion.div layoutId="activeExp" className="h-0.5 bg-current mt-1" />
                  )}
                </button>
              ))}
            </div>

            <BoosterPack 
              onOpen={handleOpenPack} 
              isLoading={loading} 
              expansionId={selectedExp} 
            />
          </motion.div>
        ) : (
          <motion.div 
            key="reveal-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="w-full max-w-6xl flex flex-col items-center z-10"
          >
            <div className="w-full flex justify-between mb-8 px-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                {revealedCount < 5 ? `Revelando ${revealedCount} de 5` : "Pack Abierto"}
              </span>
              {revealedCount === 5 && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    playSelect();
                    setShowCards(false); 
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-transform text-yellow-500"
                >
                  — Abrir otro —
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 w-full">
              {newCards.map((card, index) => {
                const isRevealed = index < revealedCount;
                const rKey = card.rarity.toLowerCase();
                const style = rarityStyles[rKey] || rarityStyles[rKey.replace(' ', '-')] || rarityStyles.common;
                const isUltra = rKey.includes('ultra') && !rKey.includes('secret');
                const isShiny = rKey.includes('shiny');
                const isSecret = rKey.includes('secret') && !rKey.includes('super') && !rKey.includes('ultra');
                const isSuperSecret = rKey.includes('super-secret') || rKey.includes('super secret');
                const isUltraSecret = rKey.includes('ultra-secret') || rKey.includes('ultra secret');
                const isHolo = rKey.includes('holographic') || rKey.includes('holo');
                
                return (
                  <div key={`${card.id}-${index}`} className="relative aspect-[2/3]">
                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ 
                            opacity: 0, 
                            rotateY: isUltraSecret ? 1800 : isSuperSecret ? 1440 : isSecret ? 1080 : isShiny ? 720 : isUltra ? 540 : 180, 
                            scale: (isUltraSecret || isSuperSecret || isSecret) ? 0 : isShiny ? 0.4 : isUltra ? 0.6 : 0.8 
                          }}
                          animate={{ 
                            opacity: 1, 
                            rotateY: 0, 
                            scale: 1,
                            y: (isUltra || isShiny || isSecret || isSuperSecret || isUltraSecret) ? [0, -20, 0] : 0 
                          }}
                          transition={{
                            y: (isUltra || isShiny || isSecret || isSuperSecret || isUltraSecret) ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : {},
                            rotateY: { 
                              duration: isUltraSecret ? 2.0 : isSuperSecret ? 1.7 : isSecret ? 1.5 : isShiny ? 1.1 : isUltra ? 0.8 : 0.5, 
                              ease: (isUltraSecret || isSuperSecret || isSecret || isShiny || isUltra) ? "circOut" : "easeOut" 
                            },
                            scale: { duration: isUltraSecret ? 1.3 : isSuperSecret ? 1.1 : isSecret ? 1 : isShiny ? 0.8 : isUltra ? 0.6 : 0.4 },
                            opacity: { duration: 0.3 }
                          }}
                          className={`w-full h-full p-2 rounded-xl border-2 shadow-2xl relative overflow-hidden flex flex-col ${style.border} ${style.bg} ${style.shadow}`}
                        >
                          {/* Brillos específicos SOLO en la carta, no en el fondo */}
                          {isShiny ? (
                            <>
                              <motion.div animate={{ backgroundColor: ['rgba(255,30,0,0.1)', 'rgba(0,100,255,0.1)', 'rgba(0,255,100,0.1)', 'rgba(255,30,0,0.1)'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none" />
                              <motion.div animate={{ borderColor: ['#ff2000', '#0066ff', '#00ff66', '#ffcc00', '#ff2000'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none opacity-80" />
                            </>
                          ) : isUltra ? (
                            <>
                              <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle,rgba(255,200,0,0.2)_0%,transparent_80%)]" />
                              <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-yellow-400 shadow-[0_0_15px_rgba(255,180,0,0.4)]" />
                            </>
                          ) : isSuperSecret ? (
                            <>
                              <motion.div animate={{ backgroundColor: ['rgba(16,185,129,0.25)', 'rgba(234,179,8,0.25)', 'rgba(16,185,129,0.25)'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
                              {/* Estrella radial interactiva giratoria */}
                              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)]" />
                              <motion.div animate={{ opacity: [0.7, 1.0, 0.7], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.7),inset_0_0_15px_rgba(52,211,153,0.5)]" />
                            </>
                          ) : isUltraSecret ? (
                            <>
                              <motion.div animate={{ backgroundColor: ['rgba(234,179,8,0.15)', 'rgba(244,63,94,0.15)', 'rgba(234,179,8,0.15)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
                              <motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.7, 1.0, 0.7] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-yellow-400/80 shadow-[0_0_30px_rgba(234,179,8,0.6)]" />
                            </>
                          ) : null}

                          {(isUltra || isShiny || isHolo || isSecret || isSuperSecret || isUltraSecret) && (
                            <>
                              <motion.div animate={{ x: ['-100%', '250%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                              
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
                          
                          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain rounded-lg relative z-10" />
                          
                          <div className={`mt-auto py-1 rounded-full text-[7px] font-black uppercase text-center z-30 bg-black/70 border ${style.border} ${style.text} backdrop-blur-sm`}>
                            {card.rarity}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
