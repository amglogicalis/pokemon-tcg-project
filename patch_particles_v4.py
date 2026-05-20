import re

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

shop_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Shop.tsx"
shop = read(shop_path)

# 1. Bump secret background particles to 22
shop = re.sub(
    r'\{\[\.\.\.Array\(15\)\]\.map\(\(_, i\) => \(\s*<motion\.div\s*key=\{i\}\s*initial=\{\{\s*x: `\$\{\(\(Math\.abs\(Math\.sin\(i \* 11\)\) \* 1000\) % 1\) \* 100 - 50\}vw`,',
    r'{[...Array(22)].map((_, i) => (\n              <motion.div\n                key={i}\n                initial={{ \n                  x: `${((Math.abs(Math.sin(i * 11)) * 1000) % 1) * 100 - 50}vw`,',
    shop
)

# Wait, let's just do a simpler replace for the secret background array length
old_secret = """            {/* ESTRELLAS / PARTÍCULAS FUCSIA-NARANJA */}
            {[...Array(15)].map((_, i) => ("""
new_secret = """            {/* ESTRELLAS / PARTÍCULAS FUCSIA-NARANJA */}
            {[...Array(22)].map((_, i) => ("""
shop = shop.replace(old_secret, new_secret)


# 2. Fix inner particle diagonals in Shop.tsx, Album.tsx, and Mural.tsx
# In all three files, there's a block defining `top` and `left` for inner card particles.
# Let's write a robust regex that finds this exact block regardless of exact indentation.

regex_pattern = r"const top = isUltraSecret\s*\?\s*5 \+ \(\(i \* 12\) % 65\)\s*:\s*[^\n]+;\s*const left = isUltraSecret\s*\?\s*10 \+ \(\(i \* 10\)\)\s*:\s*[^\n]+;"

replacement = """const top = isUltraSecret 
                                  ? 5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80 
                                  : 5 + ((Math.abs(Math.sin(i * 13)) * 1000) % 1) * 80;
                                const left = isUltraSecret 
                                  ? 5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80 
                                  : 5 + ((Math.abs(Math.cos(i * 17)) * 1000) % 1) * 80;"""

shop_new = re.sub(regex_pattern, replacement, shop)
if shop_new != shop:
    print("Fixed inner particles in Shop.tsx")
shop = shop_new

write(shop_path, shop)

album_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx"
album = read(album_path)
album_new = re.sub(regex_pattern, replacement, album)
if album_new != album:
    print("Fixed inner particles in Album.tsx")
album = album_new
write(album_path, album)

mural_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Mural.tsx"
mural = read(mural_path)
mural_new = re.sub(regex_pattern, replacement, mural)
if mural_new != mural:
    print("Fixed inner particles in Mural.tsx")
mural = mural_new
write(mural_path, mural)

print("Patch v4 complete")
