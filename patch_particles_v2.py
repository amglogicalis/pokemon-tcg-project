"""
Patch script: stable pseudo-random card particles + screen-filling ultra-secret + reduced super-secret/divine
"""
import re

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# ─── 1. ALBUM.TSX ────────────────────────────────────────────────────────────
album_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx"
album = read(album_path)

# Fix: Divine inner particles – merge 8 spheres + 8 stars into single 8-item array
# that alternates, AND use different trig for top vs left so no diagonal pattern.
OLD_DIVINE_PARTICLES = """                        <>
                          {/* 1. Esferas doradas independientes para Divine */}
                          {[...Array(8)].map((_, i) => {
                            const top = 5 + Math.abs(Math.cos(i * 456)) * 80;
                            const left = 5 + Math.abs(Math.cos(i * 456)) * 80;
                            const scale = 0.6 + Math.abs(Math.cos(i * 101)) * 0.7;
                            const delay = i * 0.25;
                            const duration = 1.6 + Math.abs(Math.sin(i * 202)) * 1.4;

                            return (
                              <motion.div
                                key={`divine-card-sphere-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 0.95, 0],
                                  scale: [0, scale, 0],
                                  x: [0, Math.sin(i * 123) * 16, 0],
                                  y: [0, Math.sin(i * 123) * 16, 0]
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
                            const top = 5 + Math.abs(Math.cos(i * 456)) * 80;
                            const left = 5 + Math.abs(Math.cos(i * 456)) * 80;
                            const scale = 0.6 + Math.abs(Math.cos(i * 101)) * 0.7;
                            const delay = i * 0.25 + 0.12; // Desfasado de las esferas para que aparezcan alternadas
                            const duration = 1.6 + Math.abs(Math.sin(i * 202)) * 1.4;

                            // Asignamos un color estable del array de colores divinos según el índice i
                            const DIVINE_COLORS = ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4'];
                            const starColor = DIVINE_COLORS[i % DIVINE_COLORS.length];

                            return (
                              <motion.div
                                key={`divine-card-star-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 0.95, 0],
                                  scale: [0, scale, 0],
                                  x: [0, Math.sin(i * 123) * 16, 0],
                                  y: [0, Math.sin(i * 123) * 16, 0]
                                }}
                                transition={{ repeat: Infinity, duration, delay, ease: "easeInOut" }}
                                style={{ top: `${top}%`, left: `${left}%` }}
                                className="absolute z-20 pointer-events-none"
                              >
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 4 + Math.abs(Math.sin(i * 404)) * 4, ease: "linear" }}
                                >
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ color: starColor, filter: `drop-shadow(0 0 6px ${starColor})` }}>
                                    <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                                  </svg>
                                </motion.div>
                              </motion.div>
                            );
                          })}
                        </>"""

# New: 8 particles alternating sphere/star, using different seeds for top vs left
NEW_DIVINE_PARTICLES = """                        <>
                          {/* Divine inner particles – 8 alternating spheres/stars, stable random grid */}
                          {[...Array(8)].map((_, i) => {
                            // Different trig seeds for top and left → no diagonal clustering
                            const top  = 8 + Math.abs(Math.sin(i * 137 + 1)) * 78;
                            const left = 8 + Math.abs(Math.cos(i * 97  + 2)) * 78;
                            const scale = 0.6 + Math.abs(Math.sin(i * 53)) * 0.6;
                            const delay = i * 0.3;
                            const duration = 1.8 + Math.abs(Math.cos(i * 71)) * 1.2;
                            const isSphere = i % 2 === 0;
                            const DIVINE_COLORS = ['#fbbf24', '#a78bfa', '#ef4444', '#06b6d4'];
                            const starColor = DIVINE_COLORS[i % DIVINE_COLORS.length];
                            const dx = Math.sin(i * 41) * 12;
                            const dy = Math.cos(i * 67) * 12;

                            return (
                              <motion.div
                                key={`divine-p-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 0.95, 0],
                                  scale: [0, scale, 0],
                                  x: [0, dx, 0],
                                  y: [0, dy, 0]
                                }}
                                transition={{ repeat: Infinity, duration, delay, ease: "easeInOut" }}
                                style={{ top: `${top}%`, left: `${left}%` }}
                                className="absolute z-20 pointer-events-none"
                              >
                                {isSphere ? (
                                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 blur-[0.2px] shadow-[0_0_8px_#fbbf24] rotate-45" />
                                ) : (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 4 + Math.abs(Math.sin(i * 404)) * 3, ease: "linear" }}
                                  >
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ color: starColor, filter: `drop-shadow(0 0 6px ${starColor})` }}>
                                      <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                                    </svg>
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}
                        </>"""

if OLD_DIVINE_PARTICLES in album:
    album = album.replace(OLD_DIVINE_PARTICLES, NEW_DIVINE_PARTICLES)
    print("Divine card particles patched")
else:
    print("Divine card particles block NOT found - maybe already patched")

# Fix: Generic card particles (secret, super-secret, ultra-secret) – top and left use different seeds
# Currently both use Math.abs(Math.cos(i * 456)) which puts them on a diagonal
OLD_CARD_PARTICLE_TOP = "5 + Math.abs(Math.cos(i * 456)) * 80;\r\n                           const left = isUltraSecret \r\n                             ? 10 + (i * 10) \r\n                             : 5 + Math.abs(Math.cos(i * 456)) * 80;"
NEW_CARD_PARTICLE_TOP = "8 + Math.abs(Math.sin(i * 137 + 1)) * 78;\r\n                           const left = isUltraSecret \r\n                             ? 10 + (i * 10) \r\n                             : 8 + Math.abs(Math.cos(i * 97  + 2)) * 78;"
album = album.replace(OLD_CARD_PARTICLE_TOP, NEW_CARD_PARTICLE_TOP)

# Fix: ultra-secret extra diamond sparkles top/left also diagonal – fix
OLD_DIAMOND = """const top = 8 + Math.abs(Math.sin(i * 789)) * 74;
                            const left = 8 + Math.abs(Math.sin(i * 789)) * 74;"""
NEW_DIAMOND = """const top  = 8 + Math.abs(Math.sin(i * 137 + 5)) * 78;
                            const left = 8 + Math.abs(Math.cos(i * 97  + 7)) * 78;"""
album = album.replace(OLD_DIAMOND, NEW_DIAMOND)

write(album_path, album)
print("Album.tsx written")

# ─── 2. SHOP.TSX ─────────────────────────────────────────────────────────────
shop_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Shop.tsx"
shop = read(shop_path)

# Fix 1: super-secret background – reduce 22 → 14 particles
shop = shop.replace("[...Array(22)].map", "[...Array(14)].map")

# Fix 2: ultra-secret background – make meteors fill the whole screen by
# distributing them uniformly in both axes instead of random clusters.
OLD_US_METEORS = """            {/* LUVIA DE METEOROS DORADOS DIAGONALES */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: `${Math.sin(i * 33) * 60 - 30}vw`, 
                  y: '-60vh',
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  x: `calc(${Math.cos(i * 44) * 50 - 50}vw - 200px)`,
                  y: '60vh',
                  scale: [0, 2, 0],
                  opacity: [0, 0.95, 0],
                }}
                transition={{ 
                  duration: 3 + Math.abs(Math.cos(i * 505)) * 3, 
                  repeat: Infinity, 
                  delay: Math.abs(Math.cos(i * 707)) * 8,
                  ease: "linear"
                }}
                className="absolute w-1.5 h-16 rounded-full bg-gradient-to-b from-yellow-300 via-rose-400 to-transparent -rotate-[35deg] blur-[1px] shadow-[0_0_15px_#eab308]"
              />
            ))}"""

# 15 meteors evenly covering -45vw to +45vw in 3 rows of 5
NEW_US_METEORS = """            {/* METEOROS DORADOS – distribución uniforme en toda la pantalla */}
            {[...Array(15)].map((_, i) => {
              // Dividimos en 3 bandas de 5 – fila determina la altura inicial
              const band   = Math.floor(i / 5);          // 0 | 1 | 2
              const col    = i % 5;                       // 0..4 dentro de la banda
              // X inicial: reparte -44vw … +44vw uniformemente y añade pequeño offset por banda
              const xStart = -44 + col * 22 + band * 4;
              // X final desplazado diagonalmente (meteoros van abajo-derecha)
              const xEnd   = xStart - 18;
              // Y inicial escalonado por banda para que no salgan todos a la vez
              const yStart = -60 - band * 15;
              const dur    = 3.2 + Math.abs(Math.cos(i * 179)) * 2.5;
              const delay  = (col * 0.55) + band * 1.1;
              return (
                <motion.div
                  key={i}
                  initial={{ x: `${xStart}vw`, y: `${yStart}vh`, scale: 0, opacity: 0 }}
                  animate={{ x: `${xEnd}vw`, y: '65vh', scale: [0, 2, 0], opacity: [0, 0.95, 0] }}
                  transition={{ duration: dur, repeat: Infinity, delay, ease: "linear" }}
                  className="absolute w-1.5 h-16 rounded-full bg-gradient-to-b from-yellow-300 via-rose-400 to-transparent -rotate-[35deg] blur-[1px] shadow-[0_0_15px_#eab308]"
                />
              );
            })}"""

if OLD_US_METEORS in shop:
    shop = shop.replace(OLD_US_METEORS, NEW_US_METEORS)
    print("Ultra-secret meteors patched")
else:
    print("Ultra-secret meteors block NOT found")

# Fix 3: Shop inner-card particles (secret/super-secret rows) – use different seeds for top vs left
OLD_SHOP_INNER = """const top = isUltraSecret \r\n                                ? 5 + ((i * 12) % 65) \r\n                                : 5 + Math.abs(Math.cos(i * 456)) * 80;\r\n                              const left = isUltraSecret \r\n                                ? 10 + (i * 10) \r\n                                : 5 + Math.abs(Math.cos(i * 456)) * 80;"""
NEW_SHOP_INNER = """const top = isUltraSecret \r\n                                ? 5 + ((i * 12) % 65) \r\n                                : 8 + Math.abs(Math.sin(i * 137 + 1)) * 78;\r\n                              const left = isUltraSecret \r\n                                ? 10 + (i * 10) \r\n                                : 8 + Math.abs(Math.cos(i * 97  + 2)) * 78;"""
shop = shop.replace(OLD_SHOP_INNER, NEW_SHOP_INNER)

write(shop_path, shop)
print("Shop.tsx written")

# ─── 3. MURAL.TSX ────────────────────────────────────────────────────────────
mural_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Mural.tsx"
mural = read(mural_path)

OLD_MURAL_INNER = "5 + Math.abs(Math.cos(i * 456)) * 80;"
if OLD_MURAL_INNER in mural:
    import re as _re
    counter = [0]
    def _replace(m):
        counter[0] += 1
        if counter[0] % 2 == 1:
            return "8 + Math.abs(Math.sin(i * 137 + 1)) * 78;"
        else:
            return "8 + Math.abs(Math.cos(i * 97  + 2)) * 78;"
    mural = _re.sub(r'5 \+ Math\.abs\(Math\.cos\(i \* 456\)\) \* 80;', _replace, mural)
    write(mural_path, mural)
    print("Mural.tsx particle positions patched")
else:
    print("Mural.tsx – no pattern found, skipping")

print("All done!")
