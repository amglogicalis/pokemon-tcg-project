import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface BoosterPackProps {
  onOpen: () => void;
  isLoading: boolean;
  expansionId: string;
}

const PACK_ASSETS: Record<string, { imagePath: string; glow: string }> = { 
  'swsh12': { imagePath: 'swsh12/packshots/image_1_394x_f23c7f88-ca92-46a0-88bd-574db522aa80_394x.webp', glow: ' bg-slate-400' }, 
  'sm3': { imagePath: 'sm3/packshots/SM3_Booster_Ho-Oh.webp', glow: 'bg-red-950' }, 
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

      {/* Animación Épica del Vórtice de Invocación */}
      {isRipped && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          {/* Fogonazo inicial al romperse (enmascara la desaparición del sobre) */}
          <motion.div 
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 4 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 bg-white rounded-full blur-2xl z-50 pointer-events-none"
          />

          {/* Anillo de energía exterior rotando (El Vórtice) */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [1, 1.15, 1], rotate: 360 }}
            transition={{ 
              opacity: { duration: 0.4 },
              scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 3, ease: "linear" }
            }}
            className="absolute w-56 h-56 rounded-full border-[6px] border-dashed border-white/30 z-40"
            style={{ borderTopColor: 'white', borderBottomColor: 'white' }}
          />

          {/* Anillo de energía interior rápido en sentido inverso */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [1, 0.85, 1], rotate: -360 }}
            transition={{ 
              opacity: { duration: 0.4 },
              scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 },
              rotate: { repeat: Infinity, duration: 1.5, ease: "linear" }
            }}
            className="absolute w-40 h-40 rounded-full border-4 border-white/50 z-40"
            style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
          />

          {/* Núcleo de energía pulsante (Color de la expansión) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.8, 1.4, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className={`absolute w-32 h-32 rounded-full ${packConfig.glow} blur-2xl z-30`}
          />

          {/* Brillo intenso central (Núcleo caliente) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.8, 1, 0.8], scale: [0.9, 1.2, 0.9] }}
            transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
            className="absolute w-16 h-16 bg-white rounded-full blur-md z-50"
          />
          
          {/* Partículas de energía/chispas saliendo del vórtice */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`spark-${i}`}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 300, 
                y: (Math.random() - 0.5) * 300, 
                opacity: [0, 1, 0],
                scale: [0, Math.random() * 1.5 + 0.5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.8 + Math.random(), 
                delay: Math.random() * 0.5,
                ease: "easeOut" 
              }}
              className="absolute w-2 h-2 bg-white rounded-full blur-[1px] z-50 shadow-[0_0_10px_#fff]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
