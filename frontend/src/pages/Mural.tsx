import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelTextStyle, getLevelStyle } from '../constants/levels';

interface MuralEntry {
  username: string;
  userLevel?: number;
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

  if (!isUltra && !isHolo && !isShiny && !isSecret && !isSuperSecret && !isUltraSecret) {
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
            className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none opacity-70" 
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
              <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-2 rounded-xl z-35 pointer-events-none border-yellow-400/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
            </>
          )}
          {isSuperSecret && (
            <>
              <motion.div animate={{ backgroundColor: ['rgba(16,185,129,0.25)', 'rgba(234,179,8,0.25)', 'rgba(16,185,129,0.25)'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)]" />
              <motion.div animate={{ opacity: [0.7, 1.0, 0.7], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.7),inset_0_0_15px_rgba(52,211,153,0.5)]" />
            </>
          )}
          {isUltraSecret && (
            <>
              <motion.div animate={{ backgroundColor: ['rgba(234,179,8,0.25)', 'rgba(244,63,94,0.25)', 'rgba(234,179,8,0.25)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
              <motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.7, 1.0, 0.7] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-yellow-400/80 shadow-[0_0_30px_rgba(234,179,8,0.6)]" />
            </>
          )}
        </>
      )}

      {/* Capa de textura de brillo foil holográfico */}
      {(isShiny || isSecret || isSuperSecret || isUltraSecret) && (
        <>
          {[...Array(8)].map((_, i) => {
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
          })}
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
  dp6: { name: 'Legends Awakened', color: 'text-yellow-400' },
  bw9: { name: 'Plasma Blast', color: 'text-blue-400' },
  xyp: { name: 'XY Black Star Promos', color: 'text-red-500' },
  zsv10pt5: { name: 'Black Bolt', color: 'text-indigo-600' },
  sm3: { name: 'Burning Shadows', color: 'text-red-800' }
};

export default function Mural() {
  const [entries, setEntries] = useState<MuralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<MuralEntry | null>(null);

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white/10 border-t-yellow-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 relative overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.5em] text-yellow-500/60 mb-2">Colección Pública</p>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic text-white leading-none">
            Mural de<br />
            <span className="text-yellow-500">Cartas</span>
          </h1>
          <p className="text-gray-500 text-sm mt-4 max-w-md mx-auto">
            Las cartas favoritas de los entrenadores. Selecciona la tuya desde tu álbum.
          </p>
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
                    <div className={`absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 
                      py-0.5 rounded-full bg-black/70 border ${style.border} ${style.text} backdrop-blur-sm`}>
                      {entry.card.rarity}
                    </div>
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
                      <p className={`text-sm font-bold mt-1 uppercase ${style.text}`}>{selectedEntry.card.rarity}</p>
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
                        <p className="text-yellow-500 font-black text-lg uppercase tracking-wide mt-1.5 flex items-center justify-center gap-2">
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
    </div>
  );
}
