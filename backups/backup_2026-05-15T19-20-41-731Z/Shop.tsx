import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import BoosterPack from '../components/BoosterPack';
import { motion, AnimatePresence } from 'framer-motion';

const rarityWeight: Record<string, number> = {
  'common': 1, 'uncommon': 2, 'rare': 3, 'holographic': 4, 'ultra-rare': 5, 'ultra rare': 5, 'shiny': 6
};

const EXPANSIONS = [ 
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
    if (rarity.includes('shiny')) return 'shiny';
    if (rarity.includes('ultra')) return 'ultra';
    
    return 'none';
  }, [showCards, revealedCount, newCards]);

  const playSfx = (path: string) => {
    const audio = new Audio(path);
    audio.play().catch(() => {}); 
  };

  const handleOpenPack = async () => {
    if (loading) return;
    setNewCards([]);
    setShowCards(false);
    setRevealedCount(0);
    setLoading(true);

    try {
      const response = await api.post('/packs/open', { expansion: selectedExp });
      const cards = response.data.cards.sort((a: any, b: any) => 
        (rarityWeight[a.rarity.toLowerCase()] || 0) - (rarityWeight[b.rarity.toLowerCase()] || 0)
      );
      setNewCards(cards);
      
      setTimeout(() => {
        setShowCards(true);
        setRevealedCount(1);
        playSfx('/sounds/card-flip.mp3');
        setLoading(false);
      }, 800);
    } catch (error) {
      alert('No te quedan sobres o hay un error de conexión');
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (revealedCount < newCards.length) {
      const nextRarity = newCards[revealedCount].rarity.toLowerCase();
      if (nextRarity.includes('shiny')) {
        playSfx('/sounds/shiny-sparkle.mp3');
      } else if (nextRarity.includes('ultra')) {
        playSfx('/sounds/epic-reveal.mp3');
      } else {
        playSfx('/sounds/card-flip.mp3');
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
                  onClick={() => setSelectedExp(exp.id)}
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
                const isUltra = rKey.includes('ultra');
                const isShiny = rKey.includes('shiny');
                const isHolo = rKey.includes('holographic') || rKey.includes('holo');
                
                return (
                  <div key={`${card.id}-${index}`} className="relative aspect-[2/3]">
                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, rotateY: 180, scale: 0.8 }}
                          animate={{ 
                            opacity: 1, rotateY: 0, scale: 1,
                            y: (isUltra || isShiny) ? [0, -12, 0] : 0 
                          }}
                          transition={{
                            y: (isUltra || isShiny) ? { repeat: Infinity, duration: 4, ease: "easeInOut" } : {},
                            rotateY: { duration: 0.5, ease: "easeOut" }
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
                          ) : null}

                          {(isUltra || isShiny || isHolo) && (
                            <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
