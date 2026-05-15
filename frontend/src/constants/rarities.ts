// src/constants/rarities.ts
export const rarityStyles: Record<string, { border: string, bg: string, text: string, shadow: string, animate?: string }> = {
  common: { 
    border: 'border-gray-500/50', 
    bg: 'bg-gray-800', 
    text: 'text-gray-400',
    shadow: 'shadow-none'
  },
  uncommon: { 
    border: 'border-blue-400/60', 
    bg: 'bg-blue-900/20', 
    text: 'text-blue-400',
    shadow: 'shadow-[0_0_10px_rgba(96,165,250,0.2)]'
  },
  rare: { 
    border: 'border-yellow-500', 
    bg: 'bg-yellow-900/30', 
    text: 'text-yellow-500',
    shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]'
  },
  holographic: { 
    border: 'border-purple-500', 
    bg: 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40', 
    text: 'text-purple-300',
    shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    animate: 'animate-pulse'
  },
  'ultra rare': { 
    border: 'border-pink-500', 
    bg: 'bg-gradient-to-tr from-fuchsia-900/60 via-purple-900/40 to-pink-600/30', 
    text: 'text-fuchsia-300',
    shadow: 'shadow-[0_0_50px_rgba(217,70,239,0.9)]',
  },
  'ultra-rare': { 
    border: 'border-pink-500', 
    bg: 'bg-gradient-to-tr from-fuchsia-900/60 via-purple-900/40 to-pink-600/30', 
    text: 'text-fuchsia-300',
    shadow: 'shadow-[0_0_50px_rgba(217,70,239,0.9)]',
  },
  'shiny': {
    border: 'border-white/50',
    bg: 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-purple-400 to-red-400 bg-[length:200%_auto] animate-gradient-x font-black',
    shadow: 'shadow-[0_0_30px_rgba(255,255,255,0.4)]',
  },
  'secret': { 
    border: 'border-cyan-400', 
    bg: 'bg-gradient-to-br from-sky-900 via-cyan-700/40 to-indigo-950 animate-diamond-pulse', 
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-red-500 to-orange-400 bg-[length:200%_auto] animate-text-fire font-black italic uppercase tracking-tighter',
    shadow: 'shadow-[0_0_70px_rgba(34,211,238,0.7)]',
    animate: 'animate-shimmer'
  }
};