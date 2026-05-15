import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface BoosterPackProps {
  onOpen: () => void;
  isLoading: boolean;
  expansionId: string;
}

const PACK_ASSETS: Record<string, { imagePath: string; glow: string }> = { 
  dp6: {
    imagePath: 'dp6/packshots/DP6_Booster_Giratina.webp',
    glow: 'bg-yellow-500' // Legends Awakened
  },
  bw9: {
    imagePath: 'bw9/packshots/BW9_Booster_Thundurus.webp',
    glow: 'bg-cyan-500' // Plasma Blast
  },
  '621': { 
    imagePath: 'g1/packshots/Generations_Booster_Charizard.webp',
    glow: 'bg-red-600' // Generations (XYP Promos)
  },
  'zsv10pt5': { imagePath: 'zsv10pt5/packshots/Pokemon_TCG_Scarlet_Violet%E2%80%94Black_Bolt_Booster_Wrap_Zekrom.png', glow: 'bg-indigo-600' }
};

export default function BoosterPack({ onOpen, isLoading, expansionId }: BoosterPackProps) {
  const [isRipped, setIsRipped] = useState(false);
  const x = useMotionValue(0);

  const packConfig = PACK_ASSETS[expansionId] || PACK_ASSETS['dp6'];
  const imageUrl = `https://raw.githubusercontent.com/1niceroli/ptcg-assets/main/${packConfig.imagePath}`;

  // Animaciones que ahora aplican SÓLO a la tira recortada
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    // Si la tira se arrastra más de 100px y no estamos cargando, abrimos el sobre
    if (Math.abs(info.offset.x) > 100 && !isLoading) {
      setIsRipped(true);
      onOpen();
    }
  };

  return (
    <div className="relative w-64 h-96 flex items-center justify-center select-none hover:scale-105 transition-transform duration-300">
      
      {!isRipped && (
        <>
          {/* 1. CUERPO ESTÁTICO (El sobre sin la tira superior) */}
          {/* clipPath: inset(14% 0 0 0) oculta el 14% de arriba imitando un corte */}
          <div 
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ clipPath: 'inset(14% 0 0 0)' }}
          >
            <img 
              src={imageUrl} 
              alt={`Cuerpo del sobre ${expansionId}`}
              className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
          </div>

          {/* 2. TIRA RECORTADA MOVIBLE (La parte que arrastramos) */}
          {/* clipPath: inset(0 0 86% 0) oculta el 86% de abajo, dejando viva solo la tira */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -200, right: 200 }}
            style={{ x, rotate, opacity, clipPath: 'inset(0 0 86% 0)' }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
          >
            <img 
              src={imageUrl} 
              alt={`Tira del sobre ${expansionId}`}
              className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
          </motion.div>
        </>
      )}

      {/* Efecto de explosión de luz cuando se abre el sobre */}
      {isRipped && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 2 }}
          className={`absolute inset-0 ${packConfig.glow} blur-3xl rounded-full z-40 opacity-40`}
        />
      )}
      
      {/* Rueda de carga mientras el backend genera las cartas */}
      {isLoading && !isRipped && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-50 rounded-2xl">
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
