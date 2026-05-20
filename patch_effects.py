import os

# Files to patch
mural_file = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Mural.tsx"
album_file = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx"

with open(mural_file, "r", encoding="utf-8") as f:
    mural_content = f.read()

with open(album_file, "r", encoding="utf-8") as f:
    album_content = f.read()

# 1. Update super-secret particles in both files
old_particles = """) : isSuperSecret ? (
                    <div className="w-2.5 h-2.5 rotate-45 rounded-sm bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 blur-[0.3px] shadow-[0_0_7px_#34d399]" />
                  ) :"""
new_particles = """) : isSuperSecret ? (
                    <div className={`w-2.5 h-2.5 rotate-45 rounded-sm blur-[0.3px] ${i % 2 === 0 ? 'bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 shadow-[0_0_7px_#34d399]' : 'bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 shadow-[0_0_7px_#fde047]'}`} />
                  ) :"""
mural_content = mural_content.replace(old_particles, new_particles)

old_particles_album = """) : isSuperSecret ? (
                                <div className="w-2.5 h-2.5 rotate-45 rounded-sm bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 blur-[0.3px] shadow-[0_0_7px_#34d399]" />
                              ) :"""
new_particles_album = """) : isSuperSecret ? (
                                <div className={`w-2.5 h-2.5 rotate-45 rounded-sm blur-[0.3px] ${i % 2 === 0 ? 'bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 shadow-[0_0_7px_#34d399]' : 'bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 shadow-[0_0_7px_#fde047]'}`} />
                              ) :"""
album_content = album_content.replace(old_particles_album, new_particles_album)

# 2. Update rarity badges in Mural.tsx Grid
old_mural_grid_badge = """                    {entry.card.rarity.toLowerCase() === 'divine' ? (
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
                    )}"""
new_mural_grid_badge = """                    {entry.card.rarity.toLowerCase() === 'divine' ? (
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
                    ) : ['ultra-secret', 'ultra secret'].includes(entry.card.rarity.toLowerCase()) ? (
                      <motion.div 
                        animate={{ 
                          color: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15'],
                          borderColor: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15']
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 py-0.5 rounded-full bg-black/70 border backdrop-blur-sm"
                      >
                        {entry.card.rarity}
                      </motion.div>
                    ) : (
                      <div className={`absolute bottom-2 left-2 right-2 text-[7px] font-black uppercase text-center z-30 py-0.5 rounded-full bg-black/70 border ${['super-secret', 'super secret'].includes(entry.card.rarity.toLowerCase()) ? 'border-emerald-400' : style.border} ${style.text} backdrop-blur-sm`}>
                        {entry.card.rarity}
                      </div>
                    )}"""
mural_content = mural_content.replace(old_mural_grid_badge, new_mural_grid_badge)

# 3. Update rarity text in Mural.tsx Modal
old_mural_modal_text = """                      {selectedEntry.card.rarity.toLowerCase() === 'divine' ? (
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
                      )}"""
new_mural_modal_text = """                      {selectedEntry.card.rarity.toLowerCase() === 'divine' ? (
                        <motion.p 
                          animate={{ 
                            color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="text-sm font-black mt-1 uppercase"
                        >
                          {selectedEntry.card.rarity}
                        </motion.p>
                      ) : ['ultra-secret', 'ultra secret'].includes(selectedEntry.card.rarity.toLowerCase()) ? (
                        <motion.p 
                          animate={{ 
                            color: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15']
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="text-sm font-black mt-1 uppercase"
                        >
                          {selectedEntry.card.rarity}
                        </motion.p>
                      ) : (
                        <p className={`text-sm font-bold mt-1 uppercase ${style.text}`}>{selectedEntry.card.rarity}</p>
                      )}"""
mural_content = mural_content.replace(old_mural_modal_text, new_mural_modal_text)

# 4. Update rarity badges in Album.tsx Modal/Footer
old_album_badge = """                        {entry.card.rarity.toLowerCase() === 'divine' ? (
                          <motion.span 
                            animate={{ 
                              color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24'],
                              borderColor: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase"
                          >
                            {entry.card.rarity}
                          </motion.span>
                        ) : (
                          <span className={`text-[7px] px-2 py-0.5 rounded-full border ${style.border} ${style.text} bg-black/60 font-black tracking-tighter inline-block uppercase`}>{entry.card.rarity}</span>
                        )}"""
new_album_badge = """                        {entry.card.rarity.toLowerCase() === 'divine' ? (
                          <motion.span 
                            animate={{ 
                              color: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24'],
                              borderColor: ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4', '#fbbf24']
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase"
                          >
                            {entry.card.rarity}
                          </motion.span>
                        ) : ['ultra-secret', 'ultra secret'].includes(entry.card.rarity.toLowerCase()) ? (
                          <motion.span 
                            animate={{ 
                              color: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15'],
                              borderColor: ['#facc15', '#f43f5e', '#d946ef', '#8b5cf6', '#facc15']
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="text-[7px] px-2 py-0.5 rounded-full border bg-black/60 font-black tracking-tighter inline-block uppercase"
                          >
                            {entry.card.rarity}
                          </motion.span>
                        ) : (
                          <span className={`text-[7px] px-2 py-0.5 rounded-full border ${['super-secret', 'super secret'].includes(entry.card.rarity.toLowerCase()) ? 'border-emerald-400' : style.border} ${style.text} bg-black/60 font-black tracking-tighter inline-block uppercase`}>{entry.card.rarity}</span>
                        )}"""
album_content = album_content.replace(old_album_badge, new_album_badge)

with open(mural_file, "w", encoding="utf-8") as f:
    f.write(mural_content)

with open(album_file, "w", encoding="utf-8") as f:
    f.write(album_content)

print("Patch applied to Mural.tsx and Album.tsx")
