import re

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. ALBUM.TSX
album_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx"
album = read(album_path)

# Fix inner particles for secret, super-secret, ultra-secret to be truly scattered (uniform pseudo-random)
OLD_TOP_LEFT = """                          const top = isUltraSecret \r\n                            ? 5 + ((i * 12) % 65) \r\n                            : 8 + Math.abs(Math.sin(i * 137 + 1)) * 78;\r\n                          const left = isUltraSecret \r\n                            ? 10 + (i * 10) \r\n                            : 8 + Math.abs(Math.cos(i * 97  + 2)) * 78;"""
NEW_TOP_LEFT = """                          const top = isUltraSecret \r\n                            ? 5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80 \r\n                            : 5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80;\r\n                          const left = isUltraSecret \r\n                            ? 5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80 \r\n                            : 5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80;"""
album = album.replace(OLD_TOP_LEFT, NEW_TOP_LEFT)

OLD_DIAMOND = """const top  = 8 + Math.abs(Math.sin(i * 137 + 5)) * 78;\n                            const left = 8 + Math.abs(Math.cos(i * 97  + 7)) * 78;"""
NEW_DIAMOND = """const top = 5 + ((Math.abs(Math.sin(i * 19)) * 1000) % 1) * 85;\n                            const left = 5 + ((Math.abs(Math.cos(i * 23)) * 1000) % 1) * 85;"""
album = album.replace(OLD_DIAMOND, NEW_DIAMOND)

# Divine reduce to 6
OLD_DIVINE = "{[...Array(8)].map((_, i) => {"
NEW_DIVINE = "{[...Array(6)].map((_, i) => {"
album = album.replace(OLD_DIVINE, NEW_DIVINE)

# Divine true scatter
OLD_DIVINE_TL = """                            const top  = 8 + Math.abs(Math.sin(i * 137 + 1)) * 78;\n                            const left = 8 + Math.abs(Math.cos(i * 97  + 2)) * 78;"""
NEW_DIVINE_TL = """                            const top  = 5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80;\n                            const left = 5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80;"""
album = album.replace(OLD_DIVINE_TL, NEW_DIVINE_TL)

write(album_path, album)

# 2. SHOP.TSX
shop_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Shop.tsx"
shop = read(shop_path)

# Fix inner particles just like Album
OLD_SHOP_TL = """const top = isUltraSecret \r\n                                ? 5 + ((i * 12) % 65) \r\n                                : 8 + Math.abs(Math.sin(i * 137 + 1)) * 78;\r\n                              const left = isUltraSecret \r\n                                ? 10 + (i * 10) \r\n                                : 8 + Math.abs(Math.cos(i * 97  + 2)) * 78;"""
shop = shop.replace(OLD_SHOP_TL, NEW_TOP_LEFT)

# Fix secret background flickering (Shop lines ~449)
OLD_SECRET_BG = """                animate={{ 
                  x: [
                    Math.random() * window.innerWidth - window.innerWidth/2, 
                    Math.random() * window.innerWidth - window.innerWidth/2,
                    Math.random() * window.innerWidth - window.innerWidth/2
                  ],
                  y: [
                    Math.random() * window.innerHeight - window.innerHeight/2,
                    Math.random() * window.innerHeight - window.innerHeight/2,
                    Math.random() * window.innerHeight - window.innerHeight/2
                  ],"""

NEW_SECRET_BG = """                animate={{ 
                  x: [
                    `${((Math.abs(Math.sin(i * 11)) * 1000) % 1) * 100 - 50}vw`,
                    `${((Math.abs(Math.cos(i * 22)) * 1000) % 1) * 100 - 50}vw`,
                    `${((Math.abs(Math.sin(i * 33)) * 1000) % 1) * 100 - 50}vw`
                  ],
                  y: [
                    `${((Math.abs(Math.cos(i * 44)) * 1000) % 1) * 100 - 50}vh`,
                    `${((Math.abs(Math.sin(i * 55)) * 1000) % 1) * 100 - 50}vh`,
                    `${((Math.abs(Math.cos(i * 66)) * 1000) % 1) * 100 - 50}vh`
                  ],"""
shop = shop.replace(OLD_SECRET_BG, NEW_SECRET_BG)

# Fix super-secret background not filling screen (reduce to 10 for performance, scatter perfectly)
OLD_SUPER_SECRET = """            {[...Array(14)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: `${Math.sin(i * 11) * 50}vw`, 
                  y: '50vh',
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  y: '-50vh',
                  x: `calc(${Math.cos(i * 22) * 50}vw + ${Math.sin(i) * 60}px)`,
                  scale: [0, 2.2, 0],
                  opacity: [0, 0.95, 0],
                }}"""

NEW_SUPER_SECRET = """            {[...Array(10)].map((_, i) => {
              const startX = ((Math.abs(Math.sin(i * 11)) * 1000) % 1) * 120 - 60;
              const startY = ((Math.abs(Math.cos(i * 22)) * 1000) % 1) * 120 - 60;
              const endX = startX + (((Math.abs(Math.sin(i * 33)) * 1000) % 1) * 40 - 20);
              const endY = startY - 100;
              return (
              <motion.div
                key={i}
                initial={{ 
                  x: `${startX}vw`, 
                  y: `${startY}vh`,
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  y: `${endY}vh`,
                  x: `${endX}vw`,
                  scale: [0, 2.2, 0],
                  opacity: [0, 0.95, 0],
                }}"""

shop = shop.replace(OLD_SUPER_SECRET, NEW_SUPER_SECRET)
shop = shop.replace("""className={`absolute w-3 h-3 rotate-45 rounded-sm blur-[0.5px] ${""", """className={`absolute w-3 h-3 rotate-45 rounded-sm blur-[0.5px] ${\n""")
shop = shop.replace("""                }`}
              />
            ))}""", """                }`}
              />
            )})}""")

# Fix ultra-secret background meteors filling screen better
OLD_US_METEORS = """              // X inicial: reparte -44vw … +44vw uniformemente y añade pequeño offset por banda
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
                  animate={{ x: `${xEnd}vw`, y: '65vh', scale: [0, 2, 0], opacity: [0, 0.95, 0] }}"""

NEW_US_METEORS = """              // Reparto puro a lo ancho de toda la pantalla y aún más allá para que cubra bordes
              const xStart = -60 + col * 30 + band * 10;
              const xEnd   = xStart - 30;
              // Y inicial distribuye desde muy arriba hasta medio
              const yStart = -70 - band * 25;
              const yEnd   = 70;
              const dur    = 3.0 + ((Math.abs(Math.cos(i * 179)) * 1000) % 1) * 2.0;
              const delay  = ((Math.abs(Math.sin(i * 101)) * 1000) % 1) * 3;
              return (
                <motion.div
                  key={i}
                  initial={{ x: `${xStart}vw`, y: `${yStart}vh`, scale: 0, opacity: 0 }}
                  animate={{ x: `${xEnd}vw`, y: `${yEnd}vh`, scale: [0, 2, 0], opacity: [0, 0.95, 0] }}"""

shop = shop.replace(OLD_US_METEORS, NEW_US_METEORS)

write(shop_path, shop)

# 3. MURAL.TSX
mural_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Mural.tsx"
mural = read(mural_path)

import re as _re
counter = [0]
def _replace_mural(m):
    counter[0] += 1
    if counter[0] % 2 == 1:
        return "5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80;"
    else:
        return "5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80;"

mural = _re.sub(r'8 \+ Math\.abs\(Math\.sin\(i \* 137 \+ 1\)\) \* 78;', _replace_mural, mural)
mural = _re.sub(r'8 \+ Math\.abs\(Math\.cos\(i \* 97  \+ 2\)\) \* 78;', _replace_mural, mural)

write(mural_path, mural)

print("Patch v3 applied")
