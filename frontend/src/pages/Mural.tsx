import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelTextStyle, getLevelStyle } from '../constants/levels';
import { useAuthStore } from '../store/useAuthStore';
import { themes } from '../constants/themes';

interface MuralEntry {
  username: string;
  userLevel?: number;
  completedExpansions?: string[];
  showcasedMedals?: string[];
  card: {
    id: string;
    name: string;
    rarity: string;
    imageUrl: string;
    hp?: number;
    type?: string;
    expansion?: string;
  };
}

// Componente unificado para inyectar los espectaculares efectos visuales y brillos de cartas
function CardVisualEffects({ rarity }: { rarity: string }) {
  const rKey = rarity.toLowerCase();
  const isUltra = rKey.includes('ultra');
  const isHolo = rKey.includes('holographic');
  const isShiny = rKey.includes('shiny');
  const isSecret = rKey.includes('secret') && !rKey.includes('super') && !rKey.includes('ultra');
  const isSuperSecret = rKey.includes('super-secret') || rKey.includes('super secret');
  const isUltraSecret = rKey.includes('ultra-secret') || rKey.includes('ultra secret');
  const isDivine = rKey === 'divine';

  if (!isUltra && !isHolo && !isShiny && !isSecret && !isSuperSecret && !isUltraSecret && !isDivine) {
    return null;
  }

  return (
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
            className="absolute inset-0 border-[2.5px] rounded-xl z-35 pointer-events-none opacity-100" 
          />
          <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </>
      ) : (
        <>
          {(isHolo || isUltra || isSecret || isSuperSecret || isUltraSecret || isDivine) && (
            <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          )}
          {isUltra && !isUltraSecret && (
            <>
              <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle,rgba(234,179,8,0.25)_0%,transparent_75%)]" />
              <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-2 rounded-xl z-35 pointer-events-none border-yellow-400/85 shadow-[0_0_30px_rgba(234,179,8,0.85)]" />
            </>
          )}
          {isSuperSecret && (
            <>
              <motion.div animate={{ backgroundColor: ['rgba(16,185,129,0.25)', 'rgba(234,179,8,0.25)', 'rgba(16,185,129,0.25)'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)]" />
              <motion.div animate={{ opacity: [0.8, 1.0, 0.8], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-emerald-400/95 shadow-[0_0_35px_rgba(52,211,153,0.95),inset_0_0_20px_rgba(52,211,153,0.8)]" />
            </>
          )}
          {isUltraSecret && (
            <>
              <motion.div animate={{ backgroundColor: ['rgba(234,179,8,0.25)', 'rgba(244,63,94,0.25)', 'rgba(234,179,8,0.25)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
              <motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.8, 1.0, 0.8] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-yellow-400/95 shadow-[0_0_40px_rgba(234,179,8,0.95)]" />
            </>
          )}
          {isDivine && (
            <>
              {/* Fondo de energía divina animado */}
              <motion.div animate={{ backgroundColor: ['rgba(251,191,36,0.25)', 'rgba(120,40,180,0.15)', 'rgba(217,119,6,0.25)', 'rgba(251,191,36,0.25)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
              
              {/* Aura sagrada giratoria (God Rays internos) */}
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] z-0 opacity-70 pointer-events-none bg-[conic-gradient(from_0deg,transparent_10%,rgba(251,191,36,0.45)_25%,transparent_40%,rgba(251,191,36,0.45)_60%,transparent_75%,rgba(167,139,250,0.3)_90%,transparent_100%)] blur-[8px]"
              />

              {/* Resplandor del Borde Sagrado (Dorado y Místico) */}
              <motion.div 
                animate={{ 
                  scale: [0.97, 1.02, 0.97], 
                  opacity: [0.8, 1.0, 0.8],
                  boxShadow: [
                    '0 0 45px rgba(251,191,36,0.95), inset 0 0 20px rgba(251,191,36,0.65)',
                    '0 0 65px rgba(251,191,36,1.0), inset 0 0 30px rgba(251,191,36,0.85)',
                    '0 0 45px rgba(251,191,36,0.95), inset 0 0 20px rgba(251,191,36,0.65)'
                  ]
                }} 
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} 
                className="absolute inset-0 border-[2.5px] rounded-xl z-35 pointer-events-none border-amber-400" 
              />
            </>
          )}
        </>
      )}

      {/* Capa de textura de brillo foil holográfico */}
      {(isShiny || isSecret || isSuperSecret || isUltraSecret || isDivine) && (
        <>
          {isDivine ? (
            <>
              {/* 1. Esferas doradas independientes para Divine */}
              {[...Array(8)].map((_, i) => {
                const top = 5 + Math.random() * 80;
                const left = 5 + Math.random() * 80;
                const scale = 0.6 + Math.random() * 0.7;
                const delay = i * 0.25;
                const duration = 1.6 + Math.random() * 1.4;

                return (
                  <motion.div
                    key={`divine-card-sphere-${i}`}
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
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 blur-[0.2px] shadow-[0_0_8px_#fbbf24] rotate-45" />
                  </motion.div>
                );
              })}

              {/* 2. Estrellas de colores estables independientes para Divine */}
              {[...Array(8)].map((_, i) => {
                const top = 5 + Math.random() * 80;
                const left = 5 + Math.random() * 80;
                const scale = 0.6 + Math.random() * 0.7;
                const delay = i * 0.25 + 0.12; // Desfasado para alternar con las esferas
                const duration = 1.6 + Math.random() * 1.4;

                // Color estable individual por estrella según índice i
                const DIVINE_COLORS = ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4'];
                const starColor = DIVINE_COLORS[i % DIVINE_COLORS.length];

                return (
                  <motion.div
                    key={`divine-card-star-${i}`}
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
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4 + Math.random() * 4, ease: "linear" }}
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ color: starColor, filter: `drop-shadow(0 0 6px ${starColor})` }}>
                        <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                      </svg>
                    </motion.div>
                  </motion.div>
                );
              })}
            </>
          ) : (
            [...Array(8)].map((_, i) => {
              const top = isUltraSecret ? 5 + ((i * 12) % 65) : 5 + Math.random() * 80;
              const left = isUltraSecret ? 10 + (i * 10) : 5 + Math.random() * 80;
              const scale = isUltraSecret ? 0.8 : 0.6 + Math.random() * 0.7;
              const delay = isUltraSecret ? i * 0.22 : i * 0.25;
              const duration = isUltraSecret ? 1.8 : 1.6 + Math.random() * 1.4;

              const animateProps = isUltraSecret
                ? {
                    opacity: [0, 0.9, 0],
                    scale: [0.3, scale, 0.3],
                    x: [25, 0, -25],
                    y: [-30, 0, 30],
                    color: i % 2 === 0
                      ? ['rgba(255,255,255,0.85)', 'rgba(234,179,8,0.95)', 'rgba(244,63,94,0.9)', 'rgba(255,255,255,0.85)']
                      : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.85)'],
                    boxShadow: i % 2 === 0
                      ? ['0 0 8px rgba(255,255,255,0.5)', '0 0 15px rgba(234,179,8,0.95)', '0 0 15px rgba(244,63,94,0.9)', '0 0 8px rgba(255,255,255,0.5)']
                      : ['0 0 8px rgba(255,255,255,0.4)', '0 0 8px rgba(255,255,255,0.4)']
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
            })
          )}
        </>
      )}

      {/* Destellos de diamante adicionales (exclusivos de Ultra-Secret) */}
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
  );
}

const expansionNames: Record<string, { name: string; color: string }> = { 
  xy5: { name: 'Primal Clash', color: 'text-blue-900' }, 
  swsh12: { name: 'Silver Tempest', color: ' text-slate-400' },
  dp6: { name: 'Legends Awakened', color: 'text-yellow-400' },
  bw9: { name: 'Plasma Blast', color: 'text-blue-400' },
  xyp: { name: 'XY Black Star Promos', color: 'text-red-500' },
  zsv10pt5: { name: 'Black Bolt', color: 'text-indigo-600' },
  sm3: { name: 'Burning Shadows', color: 'text-red-800' }
};

const medalConfig: Record<string, { label: string; icon: string; bg: string; border: string; text: string; imageUrl?: string }> = { 
  'xy5': { 
    label: 'Primal', 
    icon: '🌋', 
    bg: 'bg-blue-950/80', 
    border: 'border-blue-500/50', 
    text: 'text-blue-300', 
    imageUrl: 'https://www.serebii.net/tcgpocket/emblems/megagardevoiremblem.png' 
  },
  swsh12: { 
    label: 'Tempestad', 
    icon: '⛈️', 
    bg: 'bg-slate-800/80', 
    border: 'border-slate-500/50', 
    text: 'text-slate-200',
    imageUrl: 'https://www.serebii.net/tcgpocket/emblems/lugiaemblem.png'
  },
  dp6: { 
    label: 'Leyenda', 
    icon: '🌟', 
    bg: 'bg-yellow-950/80', 
    border: 'border-yellow-500/50', 
    text: 'text-yellow-300',
    imageUrl: 'https://www.serebii.net/tcgpocket/emblems/giratinaemblem.png'
  },
  bw9: { 
    label: 'Plasma', 
    icon: '⚡', 
    bg: 'bg-blue-950/80', 
    border: 'border-blue-500/50', 
    text: 'text-blue-300',
    imageUrl: 'https://www.serebii.net/tcgpocket/emblems/space-timesmackdownemblemeventgoldemblem.png'
  },
  xyp: { 
    label: 'Estrella', 
    icon: '💫', 
    bg: 'bg-red-950/80', 
    border: 'border-red-500/50', 
    text: 'text-red-300',
    imageUrl: 'https://www.serebii.net/tcgpocket/emblems/shinymegagengaremblem.png'
  },
  zsv10pt5: { 
    label: 'Voltio', 
    icon: '🔮', 
    bg: 'bg-indigo-950/80', 
    border: 'border-indigo-500/50', 
    text: 'text-indigo-300',
    imageUrl: 'https://www.serebii.net/tcgpocket/emblems/geneticapexemblemevent1goldemblem.png'
  },
  sm3: { 
    label: 'Llama', 
    icon: '🔥', 
    bg: 'bg-rose-950/80', 
    border: 'border-rose-500/50', 
    text: 'text-rose-300',
    imageUrl: 'https://www.serebii.net/tcgpocket/emblems/ho-ohemblem.png'
  }
};

export default function Mural() {
  const [entries, setEntries] = useState<MuralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<MuralEntry | null>(null);
  const muralMusicRef = useRef<HTMLAudioElement | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  const activeThemeId = currentUser?.activeTheme || 'default';
  const currentTheme = themes[activeThemeId] || themes.default;

  const [showConfig, setShowConfig] = useState(false);
  const [selectedMedals, setSelectedMedals] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');

  useEffect(() => {
    if (currentUser) {
      setSelectedMedals(currentUser.showcasedMedals || []);
      setSelectedTheme(currentUser.activeTheme || 'default');
    }
  }, [showConfig, currentUser]);

  const toggleMedal = (medId: string) => {
    if (selectedMedals.includes(medId)) {
      setSelectedMedals(selectedMedals.filter(id => id !== medId));
    } else {
      if (selectedMedals.length >= 3) {
        return; // El modal controlará el aviso de límite visualmente o con disabled/alert
      }
      setSelectedMedals([...selectedMedals, medId]);
    }
  };

  const handleSaveShowcase = async () => {
    try {
      // Guardar medallas
      await api.post('/user/showcase-medals', { medals: selectedMedals });
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, showcasedMedals: selectedMedals } : null
      }));

      // Guardar tema
      await api.post('/user/theme', { theme: selectedTheme });
      useAuthStore.getState().updateActiveTheme(selectedTheme);

      const response = await api.get('/mural');
      setEntries(response.data.mural || []);
      setShowConfig(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al guardar la configuración.");
    }
  };

  useEffect(() => {
    const audio = new Audio('/sounds/mural-music.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    muralMusicRef.current = audio;
    audio.play().catch((err) => console.log('Autoplay blocked:', err));

    return () => {
      if (muralMusicRef.current) {
        muralMusicRef.current.pause();
        muralMusicRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchMural = async () => {
      try {
        const response = await api.get('/mural');
        setEntries(response.data.mural || []);
      } catch (error) {
        console.error('Error cargando mural:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMural();
  }, []);

  const playSelect = () => {
    const audio = new Audio('/sounds/select.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className={`w-12 h-12 border-4 border-white/10 border-t-current rounded-full ${currentTheme.textAccentClass}`}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-8 relative overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className={`text-xs font-black uppercase tracking-[0.5em] ${currentTheme.textAccentClass} opacity-60 mb-2`}>Colección Pública</p>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic text-white leading-none">
            Mural de<br />
            <span className={`${currentTheme.textAccentClass}`}>Cartas</span>
          </h1>
          <p className="text-gray-500 text-sm mt-4 max-w-md mx-auto">
            Las cartas favoritas de los entrenadores. Selecciona la tuya desde tu álbum.
          </p>
          {currentUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playSelect(); setShowConfig(true); }}
              className={`mt-6 px-5 py-2.5 ${currentTheme.panelBgClass} hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 mx-auto transition-all duration-300 shadow-md hover:shadow-lg`}
            >
              <span>⚙️</span>
              <span>Personalizar Medallas</span>
            </motion.button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-6">🏆</div>
            <p className="text-gray-500 font-bold text-lg uppercase tracking-widest">El mural está vacío</p>
            <p className="text-gray-600 text-sm mt-2">Sé el primero en elegir tu carta favorita desde tu álbum</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {entries.map((entry, index) => {
              const rKey = entry.card.rarity.toLowerCase();
              const style = rarityStyles[rKey] || rarityStyles['common'];

              return (
                <motion.div
                  key={`${entry.username}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => { playSelect(); setSelectedEntry(selectedEntry?.username === entry.username ? null : entry); }}
                >
                  <div className={`relative w-full aspect-[2/3] p-2 rounded-xl border-2 overflow-hidden flex flex-col justify-between
                    transition-all duration-300 group-hover:scale-105
                    ${style.border} ${style.bg} ${style.shadow}`}
                  >
                    {/* Efectos y animaciones premium de brillos y foils */}
                    <CardVisualEffects rarity={entry.card.rarity} />

                    <img
                      src={entry.card.imageUrl}
                      alt={entry.card.name}
                      className="w-full flex-1 min-h-0 object-contain mb-1.5 rounded-lg relative z-10 drop-shadow-lg"
                    />
                    {entry.card.rarity.toLowerCase() === 'divine' ? (
                      <motion.div 
                        animate={{ 
                          color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24'],
                          borderColor: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 py-0.5 rounded-full bg-black/70 border backdrop-blur-sm"
                      >
                        {entry.card.rarity}
                      </motion.div>
                    ) : (
                      <div className={`absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 
                        py-0.5 rounded-full bg-black/70 border ${style.border} ${style.text} backdrop-blur-sm`}>
                        {entry.card.rarity}
                      </div>
                    )}
                  </div>

                  {/* Username badge */}
                  <div className="text-center mt-1">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="text-yellow-500 text-[10px]">⭐</span>
                      <p className="text-white font-black text-xs uppercase tracking-wider truncate max-w-[85px]">
                        {entry.username}
                      </p>
                      {(() => {
                        const lvl = entry.userLevel ?? 1;
                        const colors = getLevelStyle(lvl);
                        return (
                          <span 
                            style={{
                              ...getLevelTextStyle(lvl),
                              borderColor: `${colors.base}30`,
                              backgroundColor: `${colors.base}0c`
                            }}
                            className="text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded border leading-none animate-text-shimmer"
                          >
                            Nv.{lvl}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-gray-600 text-[9px] uppercase tracking-widest truncate max-w-[120px] mt-0.5">
                      {entry.card.name}
                    </p>
                    {(() => {
                      const showcased = entry.showcasedMedals && entry.showcasedMedals.length > 0 
                        ? entry.showcasedMedals 
                        : (entry.completedExpansions || []).slice(0, 3);
                      if (showcased.length === 0) return null;
                      return (
                        <div className="flex items-center gap-1 justify-center mt-1.5 mb-0.5">
                          {showcased.map((medId) => {
                            const config = medalConfig[medId];
                            if (!config) return null;
                            return (
                              <span 
                                key={medId} 
                                title={config.label}
                                className={`flex items-center justify-center w-5.5 h-5.5 rounded-full border text-[10px] ${config.bg} ${config.border} shadow-sm select-none transform hover:scale-110 transition-transform duration-200 overflow-hidden`}
                              >
                                {config.imageUrl ? (
                                  <img src={config.imageUrl} alt={config.label} className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  config.icon
                                )}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal detalle de carta */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-gray-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const rKey = selectedEntry.card.rarity.toLowerCase();
                const style = rarityStyles[rKey] || rarityStyles['common'];
                return (
                  <>
                    {/* Al usar h-[45vh] y max-h-[360px] con aspect-[2/3], la carta escala responsivamente
                        según la altura de la pantalla en lugar de estirarse a lo ancho, previniendo el overflow. */}
                    <div className={`h-[45vh] max-h-[340px] aspect-[2/3] p-3 rounded-2xl border-2 overflow-hidden mb-6 flex flex-col justify-between relative ${style.border} ${style.bg} ${style.shadow}`}>
                      {/* Efectos premium de brillos y foils activos en el modal */}
                      <CardVisualEffects rarity={selectedEntry.card.rarity} />

                      <img
                        src={selectedEntry.card.imageUrl}
                        alt={selectedEntry.card.name}
                        className="w-full flex-1 min-h-0 object-contain drop-shadow-2xl relative z-10"
                      />
                    </div>
                    <div className="text-center w-full">
                      <p className="text-white font-black text-xl uppercase tracking-tight">{selectedEntry.card.name}</p>
                      {selectedEntry.card.rarity.toLowerCase() === 'divine' ? (
                        <motion.p 
                          animate={{ 
                            color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="text-sm font-black mt-1 uppercase"
                        >
                          {selectedEntry.card.rarity}
                        </motion.p>
                      ) : (
                        <p className={`text-sm font-bold mt-1 uppercase ${style.text}`}>{selectedEntry.card.rarity}</p>
                      )}
                      {(() => {
                        const expKey = (selectedEntry.card.expansion ?? 'dp6').toLowerCase().trim();
                        const expInfo = expansionNames[expKey] || { name: 'Legends Awakened', color: 'text-amber-400' };
                        return (
                          <div className="mt-3 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full w-fit mx-auto backdrop-blur-sm shadow-md">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Colección:</span>
                            <span className={`text-[10.5px] font-black uppercase tracking-wider ${expInfo.color}`}>
                              {expInfo.name}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-gray-500 text-xs uppercase tracking-widest">Carta favorita de</p>
                        <p className={`font-black text-lg uppercase tracking-wide mt-1.5 flex items-center justify-center gap-2 ${currentTheme.textAccentClass}`}>
                          <span>⭐ {selectedEntry.username}</span>
                          {(() => {
                            const lvl = selectedEntry.userLevel ?? 1;
                            const colors = getLevelStyle(lvl);
                            return (
                              <span 
                                style={{
                                  ...getLevelTextStyle(lvl),
                                  borderColor: `${colors.base}30`,
                                  backgroundColor: `${colors.base}0c`
                                }}
                                className="text-xs font-black uppercase px-2 py-0.5 rounded border leading-none animate-text-shimmer"
                              >
                                Nivel {lvl}
                              </span>
                            );
                          })()}
                        </p>
                      </div>

                      {/* Medallas Obtenidas */}
                      <div className="mt-4 pt-4 border-t border-white/10 w-full">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-3">Medallas Obtenidas ({selectedEntry.completedExpansions?.length || 0}/6)</p>
                        {selectedEntry.completedExpansions && selectedEntry.completedExpansions.length > 0 ? (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {selectedEntry.completedExpansions.map((medId) => {
                              const config = medalConfig[medId];
                              if (!config) return null;
                              return (
                                <div 
                                  key={medId} 
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${config.bg} ${config.border} ${config.text} shadow-sm`}
                                >
                                  <span className="w-4 h-4 flex items-center justify-center overflow-hidden">
                                    {config.imageUrl ? (
                                      <img src={config.imageUrl} alt={config.label} className="w-full h-full object-contain" />
                                    ) : (
                                      config.icon
                                    )}
                                  </span>
                                  <span className="font-black uppercase text-[9px] tracking-wide">{config.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-[9.5px] uppercase font-black tracking-widest mt-1">Ninguna medalla obtenida aún</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="w-full mt-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold transition-colors"
                    >
                      Cerrar
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de personalización de perfil */}
      <AnimatePresence>
        {showConfig && currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-gray-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <span>⚙️</span> Personalizar Medallas
                  </h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Selecciona hasta 3 medallas a mostrar en el mural</p>
                </div>
                <button 
                  onClick={() => setShowConfig(false)} 
                  className="text-gray-500 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 mb-8">
                {Object.entries(expansionNames).map(([medId, exp]) => {
                  const hasCompleted = (currentUser.completedExpansions || []).includes(medId);
                  const isSelected = selectedMedals.includes(medId);
                  const config = medalConfig[medId];

                  return (
                    <div 
                      key={medId}
                      onClick={() => hasCompleted && toggleMedal(medId)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                        hasCompleted 
                          ? isSelected
                            ? `bg-gray-800/40 border-current/40 cursor-pointer ${currentTheme.glowClass}`
                            : 'bg-gray-800/20 border-white/5 hover:border-white/15 cursor-pointer'
                          : 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm overflow-hidden ${config?.bg} ${config?.border}`}>
                          {config?.imageUrl ? (
                            <img src={config.imageUrl} alt={config?.label} className="w-full h-full object-contain p-1" />
                          ) : (
                            config?.icon || '🏅'
                          )}
                        </span>
                        <div>
                          <p className="text-white text-xs font-black uppercase tracking-wide">{exp.name}</p>
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">
                            {hasCompleted ? 'Desbloqueado (+1 sobre diario)' : 'Completa el 100% para desbloquear'}
                          </p>
                        </div>
                      </div>

                      {hasCompleted ? (
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? `${currentTheme.accentClass} border-current` : 'border-white/20'
                        }`}>
                          {isSelected && <span className="text-[10px] font-black">✓</span>}
                        </div>
                      ) : (
                        <span className="text-xs">🔒</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tema Visual Global */}
              <div className="border-t border-white/10 pt-5 mt-5 mb-8">
                <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2 mb-1">
                  <span>🎨</span> Tema Visual Global
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4">Cambia la atmósfera de toda la interfaz del juego</p>
                
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {[
                    { id: 'default', name: 'Vacío Espacial (Predeterminado)', desc: 'Gris espacial y amarillo stelar', reqExp: '', emoji: '🌌' }, 
  { id: 'explosion-primigenia', name: 'Explosion Primigenia', desc: 'Rojo volcanico y azul artartico', reqExp: 'xy5', emoji: '🌋' },
                    { id: 'aura-divina', name: 'Aura Divina', desc: 'Dorado profundo y negro azabache', reqExp: 'dp6', emoji: '🌟' },
                    { id: 'tormenta-glaciar', name: 'Tormenta Glaciar', desc: 'Azul hielo y grises platinos', reqExp: 'swsh12', emoji: '⛈️' },
                    { id: 'sobrecarga-plasma', name: 'Sobrecarga Plasma', desc: 'Azul cobalto y cian eléctrico', reqExp: 'bw9', emoji: '⚡' },
                    { id: 'estrella-carmesi', name: 'Estrella Carmesí', desc: 'Burdeos elegante y rojo rubí', reqExp: 'xyp', emoji: '💫' },
                    { id: 'cenizas-ardientes', name: 'Cenizas Ardientes', desc: 'Negro con ascuas fuego y fucsia', reqExp: 'sm3', emoji: '🔥' },
                    { id: 'vacio-trueno', name: 'Vacío Trueno', desc: 'Morado índigo y acentos intensos', reqExp: 'zsv10pt5', emoji: '🔮' }
                  ].map((themeOpt) => {
                    const isUnlocked = !themeOpt.reqExp || (currentUser.completedExpansions || []).includes(themeOpt.reqExp);
                    const isSelected = selectedTheme === themeOpt.id;

                    return (
                      <div
                        key={themeOpt.id}
                        onClick={() => isUnlocked && setSelectedTheme(themeOpt.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                          isUnlocked
                            ? isSelected
                              ? `${currentTheme.mobileActiveNavClass} border-current/30 cursor-pointer ${currentTheme.glowClass}`
                              : 'bg-gray-800/20 border-white/5 hover:border-white/10 cursor-pointer'
                            : 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg w-7 h-7 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                            {themeOpt.emoji}
                          </span>
                          <div>
                            <p className="text-white text-[11px] font-black uppercase tracking-wide">{themeOpt.name}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{themeOpt.desc}</p>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? `${currentTheme.accentClass}` : 'border-white/20'
                          }`}>
                            {isSelected && <span className="text-[9px] font-black">✓</span>}
                          </div>
                        ) : (
                          <span className="text-xs">🔒</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs uppercase font-bold tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveShowcase}
                  className={`flex-1 py-3 rounded-xl ${currentTheme.accentClass} ${currentTheme.accentHoverClass} text-xs uppercase font-bold tracking-wider transition-all duration-300 ${currentTheme.glowClass}`}
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
