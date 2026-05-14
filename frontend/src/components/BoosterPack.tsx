import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface BoosterPackProps {
  onOpen: () => void;
  isLoading: boolean;
  expansionId: string;
}

const PACK_THEMES: Record<string, { body: string; top: string; glow: string }> = {
  dp6: {
    body: 'from-amber-600 via-orange-600 to-yellow-500',
    top: 'from-orange-500 via-yellow-500 to-orange-500',
    glow: 'bg-orange-500'
  },
  bw9: {
    body: 'from-blue-700 via-indigo-700 to-cyan-600',
    top: 'from-blue-600 via-cyan-500 to-blue-600',
    glow: 'bg-cyan-500'
  },
  '621': { // Nueva expansión XYP
    body: 'from-gray-900 via-black to-gray-800',
    top: 'from-yellow-600 via-yellow-400 to-yellow-600',
    glow: 'bg-red-600' // Explosión roja al abrir
  }
};

export default function BoosterPack({ onOpen, isLoading, expansionId }: BoosterPackProps) {
  const [isRipped, setIsRipped] = useState(false);
  const x = useMotionValue(0);

  // Mapeo de seguridad para asegurar que use los temas definidos
  const themeKey = PACK_THEMES[expansionId] ? expansionId : 'dp6';
  const theme = PACK_THEMES[themeKey];

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100 && !isLoading) {
      setIsRipped(true);
      onOpen();
    }
  };

  return (
    <div className="relative w-64 h-96 flex items-center justify-center select-none">
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.body} rounded-2xl shadow-2xl border-x-4 border-b-4 border-white/10 overflow-hidden`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white/10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
            <span className="text-4xl filter drop-shadow-md">
              ✨
            </span>
          </div>
          <h3 className="text-white font-black text-5xl italic tracking-tighter opacity-70 leading-none uppercase drop-shadow-lg text-center px-2">
            {expansionId === '621' ? 'XYP' : expansionId}
          </h3>
        </div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.2px)', backgroundSize: '12px 12px' }} />
      </div>

      {!isRipped && (
        <motion.div
          drag="x"
          dragConstraints={{ left: -200, right: 200 }}
          style={{ x, rotate, opacity }}
          onDragEnd={handleDragEnd}
          className={`absolute top-0 w-[110%] h-24 bg-gradient-to-r ${theme.top} z-30 cursor-grab active:cursor-grabbing shadow-lg flex items-center justify-center border-b-2 border-white/20`}
        >
          <div className="absolute bottom-[-10px] left-0 w-full h-4 opacity-30 bg-[radial-gradient(circle,transparent_70%,#000_72%)] bg-[length:15px_15px]" />
          <div className="w-12 h-1.5 bg-white/40 rounded-full" />
        </motion.div>
      )}

      {isRipped && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 2 }}
          className={`absolute inset-0 ${theme.glow} blur-3xl rounded-full z-40 opacity-40`}
        />
      )}
      
      {isLoading && !isRipped && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-50 rounded-2xl">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
             className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full"
           />
        </div>
      )}
    </div>
  );
}