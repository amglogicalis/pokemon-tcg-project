import os

files_to_patch = [
    r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Mural.tsx",
    r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx",
    r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Shop.tsx"
]

replacements = {
    # 1
    """<motion.div 
            animate={{ backgroundColor: ['rgba(255,30,0,0.15)', 'rgba(200,0,150,0.1)', 'rgba(0,70,255,0.1)', 'rgba(0,255,100,0.1)', 'rgba(255,30,0,0.15)'] }} 
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }} 
            className="absolute inset-0 z-0 pointer-events-none" 
          />""": """<div className="absolute inset-0 z-0 pointer-events-none animate-shiny-bg" />""",
    
    # 2
    """<motion.div 
            animate={{ borderColor: ['#ff2000', '#cc0099', '#0066ff', '#00ff66', '#ffcc00', '#ff2000'] }} 
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }} 
            className="absolute inset-0 border-[2.5px] rounded-xl z-35 pointer-events-none opacity-100" 
          />""": """<div className="absolute inset-0 border-[2.5px] rounded-xl z-35 pointer-events-none opacity-100 animate-shiny-border" />""",

    # 3
    """<motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />""": """<div className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-skew-slide-3s" />""",

    # 4
    """<motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent" />""": """<div className="absolute inset-0 z-20 pointer-events-none -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-skew-slide-2_5s" />""",

    # 5
    """<motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-2 rounded-xl z-35 pointer-events-none border-yellow-400/85 shadow-[0_0_30px_rgba(234,179,8,0.85)]" />""": """<div className="absolute inset-0 border-2 rounded-xl z-35 pointer-events-none border-yellow-400/85 shadow-[0_0_30px_rgba(234,179,8,0.85)] animate-ultra-pulse" />""",

    # 6
    """<motion.div animate={{ backgroundColor: ['rgba(16,185,129,0.25)', 'rgba(234,179,8,0.25)', 'rgba(16,185,129,0.25)'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)]" />
              <motion.div animate={{ opacity: [0.8, 1.0, 0.8], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-emerald-400/95 shadow-[0_0_35px_rgba(52,211,153,0.95),inset_0_0_20px_rgba(52,211,153,0.8)]" />""": """<div className="absolute inset-0 z-0 pointer-events-none animate-super-secret-bg" />
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle,rgba(52,211,153,0.3)_0%,transparent_60%)] animate-spin-slow-8s" />
              <div className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-emerald-400/95 shadow-[0_0_35px_rgba(52,211,153,0.95),inset_0_0_20px_rgba(52,211,153,0.8)] animate-super-secret-pulse" />""",

    # 7
    """<motion.div animate={{ backgroundColor: ['rgba(234,179,8,0.25)', 'rgba(244,63,94,0.25)', 'rgba(234,179,8,0.25)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />
              <motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.8, 1.0, 0.8] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-yellow-400/95 shadow-[0_0_40px_rgba(234,179,8,0.95)]" />""": """<div className="absolute inset-0 z-0 pointer-events-none animate-ultra-secret-bg" />
              <div className="absolute inset-0 border-[2px] rounded-xl z-35 pointer-events-none border-yellow-400/95 shadow-[0_0_40px_rgba(234,179,8,0.95)] animate-ultra-secret-pulse" />""",

    # 8
    """<motion.div animate={{ backgroundColor: ['rgba(251,191,36,0.25)', 'rgba(120,40,180,0.15)', 'rgba(217,119,6,0.25)', 'rgba(251,191,36,0.25)'] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0 pointer-events-none" />""": """<div className="absolute inset-0 z-0 pointer-events-none animate-divine-bg" />""",

    # 9
    """<motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] z-0 opacity-70 pointer-events-none bg-[conic-gradient(from_0deg,transparent_10%,rgba(251,191,36,0.45)_25%,transparent_40%,rgba(251,191,36,0.45)_60%,transparent_75%,rgba(167,139,250,0.3)_90%,transparent_100%)] blur-[8px]"
              />""": """<div className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] z-0 opacity-70 pointer-events-none bg-[conic-gradient(from_0deg,transparent_10%,rgba(251,191,36,0.45)_25%,transparent_40%,rgba(251,191,36,0.45)_60%,transparent_75%,rgba(167,139,250,0.3)_90%,transparent_100%)] blur-[8px] animate-spin-slow-15s" />""",

    # 10
    """<motion.div 
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
              />""": """<div className="absolute inset-0 border-[2.5px] rounded-xl z-35 pointer-events-none border-amber-400 animate-divine-pulse" />""",

    # TEXT BADGES (Mural and Album)
    """<motion.div 
                        animate={{ 
                          color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24'],
                          borderColor: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 py-0.5 rounded-full bg-black/70 border backdrop-blur-sm"
                      >""": """<div className="absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 py-0.5 rounded-full bg-black/70 border backdrop-blur-sm animate-divine-text-badge">""",
    
    """</motion.div>
                    ) : ['ultra-secret', 'ultra secret'].includes(entry.card.rarity.toLowerCase()) ? (
                      <motion.div 
                        animate={{ 
                          color: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15'],
                          borderColor: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15']
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 py-0.5 rounded-full bg-black/70 border backdrop-blur-sm"
                      >""": """</div>
                    ) : ['ultra-secret', 'ultra secret'].includes(entry.card.rarity.toLowerCase()) ? (
                      <div className="absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 py-0.5 rounded-full bg-black/70 border backdrop-blur-sm animate-ultra-secret-text-badge">""",

    """</motion.div>
                    ) : (""": """</div>
                    ) : (""",

    """<motion.p 
                          animate={{ 
                            color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="text-sm font-black mt-1 uppercase"
                        >""": """<p className="text-sm font-black mt-1 uppercase animate-divine-text-badge">""",

    """</motion.p>
                      ) : ['ultra-secret', 'ultra secret'].includes(selectedEntry.card.rarity.toLowerCase()) ? (
                        <motion.p 
                          animate={{ 
                            color: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15']
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="text-sm font-black mt-1 uppercase"
                        >""": """</p>
                      ) : ['ultra-secret', 'ultra secret'].includes(selectedEntry.card.rarity.toLowerCase()) ? (
                        <p className="text-sm font-black mt-1 uppercase animate-ultra-secret-text-badge">""",

    """</motion.p>
                      ) : (""": """</p>
                      ) : (""",

    """<motion.span 
                            animate={{ 
                              color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24'],
                              borderColor: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase"
                          >""": """<span className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase animate-divine-text-badge">""",

    """</motion.span>
                        ) : ['ultra-secret', 'ultra secret'].includes(entry.card.rarity.toLowerCase()) ? (
                          <motion.span 
                            animate={{ 
                              color: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15'],
                              borderColor: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15']
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase"
                          >""": """</span>
                        ) : ['ultra-secret', 'ultra secret'].includes(entry.card.rarity.toLowerCase()) ? (
                          <span className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase animate-ultra-secret-text-badge">""",
                          
    """</motion.span>
                        ) : (""": """</span>
                        ) : ("""
}

for file_path in files_to_patch:
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

print("All files patched successfully.")
