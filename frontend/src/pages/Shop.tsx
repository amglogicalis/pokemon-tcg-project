import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import BoosterPack from '../components/BoosterPack';
import { motion, AnimatePresence } from 'framer-motion';
import { homeMusic, packMusic } from '../services/music';
import { useAuthStore } from '../store/useAuthStore';
import { themes } from '../constants/themes';

const rarityWeight: Record<string, number> = {
  'common': 1, 'uncommon': 2, 'rare': 3, 'holographic': 4, 'ultra-rare': 5, 'ultra rare': 5, 'shiny': 6, 'secret': 7, 'super-secret': 8, 'super secret': 8, 'ultra-secret': 9, 'ultra secret': 9, 'divine': 10
};

const EXPANSIONS = [ 
  { id: 'xy5', name: 'PRIMAL CLASH', color: 'text-blue-900', bg: 'bg-blue-900' }, 
  { id: 'swsh12', name: 'SILVER TEMPEST', color: 'text-slate-400', bg: 'bg-slate-400' }, 
  { id: 'sm3', name: 'BURNING SHADOWS', color: 'text-red-500', bg: 'bg-red-500' }, 
  { id: 'dp6', name: 'Legends Awakened', color: 'text-yellow-400', bg: 'bg-yellow-400' },
  { id: 'bw9', name: 'Plasma Blast', color: 'text-blue-400', bg: 'bg-blue-400' },
  { id: 'xyp', name: 'XY Black Star Promos', color: 'text-red-500', bg: 'bg-red-500' },
  { id: 'zsv10pt5', name: 'BLACK BOLT', color: 'text-indigo-400', bg: 'bg-indigo-400' }
];

export default function Shop() {
  const [loading, setLoading] = useState(false);
  const [newCards, setNewCards] = useState<any[]>([]);
  const [showCards, setShowCards] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedExp, setSelectedExp] = useState('dp6');

  // Daily pack claims integration
  const user = useAuthStore((s) => s.user);
  const activeThemeId = user?.activeTheme || 'default';
  const currentTheme = themes[activeThemeId] || themes.default;
  const updatePacksAvailable = useAuthStore((s) => s.updatePacksAvailable);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [claimLoading, setClaimLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.lastPackClaimedAt) {
      setTimeRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const COOLDOWN_MS = 24 * 60 * 60 * 1000;
      const lastClaimed = new Date(user.lastPackClaimedAt!).getTime();
      const elapsed = Date.now() - lastClaimed;
      const remaining = COOLDOWN_MS - elapsed;
      return remaining > 0 ? remaining : 0;
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.lastPackClaimedAt]);

  const handleClaimDaily = async () => {
    if (claimLoading || timeRemaining > 0) return;
    setClaimLoading(true);
    try {
      playSfx('/sounds/select.mp3');
      const response = await api.post('/packs/claim-daily');
      
      updatePacksAvailable(response.data.packsAvailable, response.data.lastPackClaimedAt);
      
      playSfx('/sounds/shiny-pull.mp3');
      
      const completedCount = user?.completedExpansions?.length || 0;
      const packsToAward = 10 + completedCount;
      setToastMsg(`¡Energía cósmica canalizada! Has recibido +${packsToAward} sobres.`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Error al recargar los sobres.';
      setToastMsg(`⚠️ ${errMsg}`);
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setClaimLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].join(':');
  };

  // Refs eliminados: ahora usamos el singleton de music.ts

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

  // Gestión de música usando el singleton de music.ts.
  // Aquí gestionamos el switch home ↔ pack al abrir sobres.
  useEffect(() => {
    const isOpening = loading || showCards;

    if (isOpening) {
      homeMusic.pause();
      homeMusic.currentTime = 0;
      packMusic.play().catch(() => {});
    } else {
      packMusic.pause();
      packMusic.currentTime = 0;
      homeMusic.play().catch(() => {});
    }

    return () => {
      // Al desmontar (navegar a otra vista): pausar todo
      homeMusic.pause();
      packMusic.pause();
    };
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
      
      // Actualizar nivel, experiencia y sobres restantes en el store global
      if (response.data.level !== undefined && response.data.xp !== undefined) {
        useAuthStore.getState().updateUserStats(response.data.level, response.data.xp, response.data.completedExpansions);
      }
      if (response.data.packsRemaining !== undefined) {
        updatePacksAvailable(response.data.packsRemaining);
      }

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
    } catch (error: any) {
      const apiError = error.response?.data?.error || 'No te quedan sobres o hay un error de conexión';
      setToastMsg(`⚠️ ${apiError}`);
      setLoading(false);
      // Forzar refresh de la página tras 2.5 segundos para evitar que quede bloqueada
      setTimeout(() => {
        window.location.reload();
      }, 2500);
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

  const activeExp = EXPANSIONS.find(e => e.id === selectedExp);
  const activeColorClass = activeExp ? activeExp.color.trim() : currentTheme.textAccentClass;
  const borderClass = activeColorClass.replace('text-', 'border-');

  return (
    <div 
      className="relative min-h-screen bg-transparent flex flex-col items-center justify-center p-4 select-none overflow-hidden"
      onClick={() => {
        const isOpening = loading || showCards;
        if (!isOpening && homeMusic.paused) {
          homeMusic.play().catch(() => {});
        }
        if (showCards && revealedCount < 5) {
          nextCard();
        }
      }}
    >
      {/* FONDO BASE LIMPIO */}
      <div className="fixed inset-0 pointer-events-none z-0 shadow-[inset_0_0_500px_rgba(0,0,0,0.8)] bg-transparent" />

      {/* EFECTOS DE FONDO DINÁMICOS - AMPLIADOS */}
      <AnimatePresence>
        {currentBgEffect === 'ultra' && (
          <motion.div
            key="ultra-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={`fixed inset-0 pointer-events-none z-0 flex items-center justify-center ${currentTheme.textAccentClass}`}
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
            exit={{ opacity: 0, scale: 2, filter: 'blur(30px) brightness(200%)', transition: { duration: 0.4, ease: "easeIn" } }}
            className="flex flex-col items-center z-10 w-full"
          >
            {/* Consola de Control de Sobres: Contador y Botón de Recarga Neutro y Elegante */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 ${currentTheme.panelBgClass} backdrop-blur-xl p-4 px-6 rounded-2xl shadow-xl w-full max-w-xl mb-8 transition-colors duration-500`}>
              
              {/* Izquierda: Sobres Disponibles */}
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-0.5">
                  Sobres Disponibles
                </span>
                <motion.span 
                  key={user?.packsAvailable}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-3xl font-black ${currentTheme.textAccentClass} drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]`}
                >
                  {user?.packsAvailable ?? 0}
                </motion.span>
              </div>

              {/* Derecha: Botón de Recarga Neutro */}
              <div className="flex flex-col items-center sm:items-end">
                <motion.button
                  onClick={handleClaimDaily}
                  disabled={claimLoading || timeRemaining > 0}
                  whileHover={timeRemaining === 0 ? { scale: 1.02 } : {}}
                  whileTap={timeRemaining === 0 ? { scale: 0.98 } : {}}
                  className={`relative px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-[0.1em] transition-all duration-300 flex items-center gap-2 border shadow-lg ${
                    timeRemaining > 0
                      ? 'bg-gray-800/40 border-white/5 text-gray-500 cursor-not-allowed min-w-[210px] justify-center'
                      : `${currentTheme.accentClass} border-transparent active:scale-95 ${currentTheme.accentHoverClass}`
                  }`}
                >
                  {timeRemaining > 0 ? (
                    <>
                      <span>🔒</span>
                      <span>Disponible en {formatTime(timeRemaining)}</span>
                    </>
                  ) : claimLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Recargando...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Recargar +{10 + (user?.completedExpansions?.length || 0)} Sobres</span>
                    </>
                  )}
                </motion.button>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-1.5 text-center sm:text-right">
                  {timeRemaining > 0 ? 'Una recarga cada 24 horas' : 'Recarga gratuita disponible ya'}
                </span>
              </div>

            </div>

            <div
              className="flex gap-4 mb-12 bg-black/80 px-6 py-3.5 rounded-full overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full transition-all duration-500 border"
              style={{ borderColor: `rgba(${currentTheme.accentRgb}, 0.15)` }}
            >
              <div className="shrink-0 w-2" />
              {EXPANSIONS.map((exp) => {
                const isActive = selectedExp === exp.id;
                const expColorClass = exp.color;
                const bgColorClass = exp.bg;
                
                return (
                  <button
                    key={exp.id}
                    onClick={() => { playSelect(); setSelectedExp(exp.id); }}
                    className={`group relative shrink-0 py-2 px-4 transition-all duration-300 outline-none focus:outline-none select-none`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className={`relative z-10 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isActive ? (exp.id === 'xy5' ? 'bg-gradient-to-r from-red-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(220,38,38,0.25)] pr-2' : expColorClass) : 'text-gray-500 group-hover:text-gray-300'}`}>
                      {exp.name}
                    </span>
                    <div className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ${isActive ? (exp.id === 'xy5' ? 'bg-gradient-to-r from-red-600 to-cyan-500 opacity-100 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : `${bgColorClass} opacity-100`) : 'bg-transparent opacity-0'}`} />
                  </button>
                );
              })}
              <div className="shrink-0 w-2" />
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
                  className={`text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-transform ${currentTheme.textAccentClass}`}
                >
                  — Abrir otro —
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-8 w-full max-w-sm md:max-w-full mx-auto">
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

      {/* Floating Toast Notification Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-4 px-6 rounded-2xl border text-xs font-black uppercase tracking-wider backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] ${
              toastMsg.startsWith('⚠️')
                ? 'bg-red-950/80 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            }`}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
