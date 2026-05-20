import os
import re

# 1. Patch Shop.tsx
shop_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Shop.tsx"
with open(shop_path, "r", encoding="utf-8") as f:
    shop_content = f.read()

# Fix 1: isUltra fixed background
old_ultra_bg = """className={`fixed inset-0 pointer-events-none z-0 flex items-center justify-center ${currentTheme.textAccentClass}`}"""
new_ultra_bg = """className={`fixed inset-0 pointer-events-none z-0 flex items-center justify-center text-yellow-400`}"""
shop_content = shop_content.replace(old_ultra_bg, new_ultra_bg)

# Fix 2: Secret particles in Shop.tsx
# Replace Math.random() in particles with stable seeded values to stop jumping
old_secret_particles = """{/* ESTRELLAS / PARTÍCULAS FUCSIA-NARANJA */}
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
                  x: `calc(${Math.random() * window.innerWidth - window.innerWidth/2}px + ${Math.random() > 0.5 ? 200 : -200}px)`,
                  y: Math.random() > 0.5 ? window.innerHeight/2 + 100 : -window.innerHeight/2 - 100,
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3, 
                  repeat: Infinity, 
                  delay: Math.random() * 5,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_#f43f5e]"
              />
            ))}"""

new_secret_particles = """{/* ESTRELLAS / PARTÍCULAS FUCSIA-NARANJA ESTABLES */}
            {[...Array(15)].map((_, i) => {
              const r1 = Math.sin(i * 123.45);
              const r2 = Math.cos(i * 678.9);
              const r3 = Math.sin(i * 321.0);
              const r4 = Math.cos(i * 456.7);
              return (
              <motion.div
                key={i}
                initial={{ 
                  x: r1 * window.innerWidth * 0.8 - window.innerWidth * 0.4, 
                  y: r2 * window.innerHeight * 0.8 - window.innerHeight * 0.4,
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  x: r3 * window.innerWidth * 0.8 - window.innerWidth * 0.4 + (r4 > 0 ? 200 : -200),
                  y: r4 > 0 ? window.innerHeight/2 + 100 : -window.innerHeight/2 - 100,
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{ 
                  duration: 2 + Math.abs(r1) * 3, 
                  repeat: Infinity, 
                  delay: Math.abs(r2) * 5,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_#f43f5e]"
              />
            )})}"""
shop_content = shop_content.replace(old_secret_particles, new_secret_particles)

old_secret_particles2 = """{[...Array(8)].map((_, i) => (
              <motion.div
                key={`ray-${i}`}
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
            ))}"""

new_secret_particles2 = """{[...Array(8)].map((_, i) => {
              const r1 = Math.sin(i * 111.1);
              const r2 = Math.cos(i * 222.2);
              const r3 = Math.sin(i * 333.3);
              return (
              <motion.div
                key={`ray-${i}`}
                initial={{ 
                  x: r1 * window.innerWidth * 0.6 - window.innerWidth * 0.3, 
                  y: -window.innerHeight/2 - 100,
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  x: r2 * window.innerWidth * 0.8 - window.innerWidth * 0.4 - 200,
                  y: window.innerHeight/2 + 100,
                  scale: [0, 2, 0],
                  opacity: [0, 0.95, 0],
                }}
                transition={{ 
                  duration: 3 + Math.abs(r1) * 3, 
                  repeat: Infinity, 
                  delay: Math.abs(r3) * 8,
                  ease: "linear"
                }}
                className="absolute w-1.5 h-16 rounded-full bg-gradient-to-b from-yellow-300 via-rose-400 to-transparent -rotate-[35deg] blur-[1px] shadow-[0_0_15px_#eab308]"
              />
            )})}"""
shop_content = shop_content.replace(old_secret_particles2, new_secret_particles2)

# Fix 3: Shop.tsx card inner optimizations
replaces_shop = [
    (
        """<motion.div animate={{ backgroundColor: ['rgba(255,30,0,0.1)', 'rgba(0,100,255,0.1)', 'rgba(0,255,100,0.1)', 'rgba(255,30,0,0.1)'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none" />""",
        """<div className="absolute inset-0 z-0 pointer-events-none animate-shiny-bg" />"""
    ),
    (
        """<motion.div animate={{ borderColor: ['#ff2000', '#0066ff', '#00ff66', '#ffcc00', '#ff2000'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none opacity-80" />""",
        """<div className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none opacity-80 animate-shiny-border" />"""
    ),
    (
        """<motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-yellow-400 shadow-[0_0_15px_rgba(255,180,0,0.4)]" />""",
        """<div className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-yellow-400 shadow-[0_0_15px_rgba(255,180,0,0.4)] animate-ultra-pulse" />"""
    ),
    (
        """<motion.div animate={{ backgroundColor: ['rgba(16,185,129,0.25)', 'rgba(234,179,8,0.25)', 'rgba(16,185,129,0.25)'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />""",
        """<div className="absolute inset-0 z-0 pointer-events-none animate-super-secret-bg" />"""
    ),
    (
        """<motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)]" />""",
        """<div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)] animate-spin-slow-8s" />"""
    ),
    (
        """<motion.div animate={{ opacity: [0.7, 1.0, 0.7], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.7),inset_0_0_15px_rgba(52,211,153,0.5)]" />""",
        """<div className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.7),inset_0_0_15px_rgba(52,211,153,0.5)] animate-super-secret-pulse" />"""
    ),
    (
        """<motion.div animate={{ backgroundColor: ['rgba(234,179,8,0.15)', 'rgba(244,63,94,0.15)', 'rgba(234,179,8,0.15)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />""",
        """<div className="absolute inset-0 z-0 pointer-events-none animate-ultra-secret-bg" />"""
    ),
    (
        """<motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.7, 1.0, 0.7] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-yellow-400/80 shadow-[0_0_30px_rgba(234,179,8,0.6)]" />""",
        """<div className="absolute inset-0 border-[3px] rounded-xl z-30 pointer-events-none border-yellow-400/80 shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-ultra-secret-pulse" />"""
    )
]

for old_s, new_s in replaces_shop:
    shop_content = shop_content.replace(old_s, new_s)

with open(shop_path, "w", encoding="utf-8") as f:
    f.write(shop_content)


# 2. Patch Album.tsx
album_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx"
with open(album_path, "r", encoding="utf-8") as f:
    album_content = f.read()

replaces_album = [
    (
        """<motion.div animate={{ backgroundColor: ['rgba(16,185,129,0.25)', 'rgba(234,179,8,0.25)', 'rgba(16,185,129,0.25)'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />""",
        """<div className="absolute inset-0 z-0 pointer-events-none animate-super-secret-bg" />"""
    ),
    (
        """<motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)]" />""",
        """<div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)] animate-spin-slow-8s" />"""
    ),
    (
        """<motion.div animate={{ opacity: [0.8, 1.0, 0.8], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-emerald-400/95 shadow-[0_0_35px_rgba(52,211,153,0.95),inset_0_0_20px_rgba(52,211,153,0.8)]" />""",
        """<div className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-emerald-400/95 shadow-[0_0_35px_rgba(52,211,153,0.95),inset_0_0_20px_rgba(52,211,153,0.8)] animate-super-secret-pulse" />"""
    ),
    (
        """<motion.div animate={{ backgroundColor: ['rgba(234,179,8,0.25)', 'rgba(244,63,94,0.25)', 'rgba(234,179,8,0.25)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />""",
        """<div className="absolute inset-0 z-0 pointer-events-none animate-ultra-secret-bg" />"""
    ),
    (
        """<motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.8, 1.0, 0.8] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-yellow-400/95 shadow-[0_0_40px_rgba(234,179,8,0.95)]" />""",
        """<div className="absolute inset-0 border-[2px] rounded-xl z-30 pointer-events-none border-yellow-400/95 shadow-[0_0_40px_rgba(234,179,8,0.95)] animate-ultra-secret-pulse" />"""
    ),
    (
        """<motion.div \n                                animate={{ rotate: 360 }} \n                                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}\n                                className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] z-0 opacity-70 pointer-events-none bg-[conic-gradient(from_0deg,transparent_10%,rgba(251,191,36,0.45)_25%,transparent_40%,rgba(251,191,36,0.45)_60%,transparent_75%,rgba(167,139,250,0.3)_90%,transparent_100%)] blur-[8px]"\n                              />""",
        """<div className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] z-0 opacity-70 pointer-events-none bg-[conic-gradient(from_0deg,transparent_10%,rgba(251,191,36,0.45)_25%,transparent_40%,rgba(251,191,36,0.45)_60%,transparent_75%,rgba(167,139,250,0.3)_90%,transparent_100%)] blur-[8px] animate-spin-slow-15s" />"""
    ),
    (
        """<motion.div \n                                animate={{ \n                                  scale: [0.97, 1.02, 0.97], \n                                  opacity: [0.8, 1.0, 0.8],\n                                  boxShadow: [\n                                    '0 0 45px rgba(251,191,36,0.95), inset 0 0 20px rgba(251,191,36,0.65)',\n                                    '0 0 65px rgba(251,191,36,1.0), inset 0 0 30px rgba(251,191,36,0.85)',\n                                    '0 0 45px rgba(251,191,36,0.95), inset 0 0 20px rgba(251,191,36,0.65)'\n                                  ]\n                                }} \n                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} \n                                className="absolute inset-0 border-[2.5px] rounded-xl z-30 pointer-events-none border-amber-400" \n                              />""",
        """<div className="absolute inset-0 border-[2.5px] rounded-xl z-30 pointer-events-none border-amber-400 animate-divine-pulse" />"""
    )
]

for old_s, new_s in replaces_album:
    album_content = album_content.replace(old_s, new_s)

with open(album_path, "w", encoding="utf-8") as f:
    f.write(album_content)


# 3. Patch Mural.tsx
mural_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Mural.tsx"
with open(mural_path, "r", encoding="utf-8") as f:
    mural_content = f.read()

for old_s, new_s in replaces_album:
    mural_content = mural_content.replace(old_s, new_s)

with open(mural_path, "w", encoding="utf-8") as f:
    f.write(mural_content)


print("All patched")
