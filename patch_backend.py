import os

app_ts_path = r"c:\tcg-project\pokemon-tcg-project\backend\src\app.ts"
with open(app_ts_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the pack route
old_pack_route = "app.post('/api/packs/open',        authMiddleware, (req, res) => packController.openPack(req as any, res));"
new_pack_route = """
const packLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Estás abriendo sobres demasiado rápido. Espera un momento.' }
});
app.post('/api/packs/open',        authMiddleware, packLimiter, (req, res) => packController.openPack(req as any, res));
"""

content = content.replace(old_pack_route, new_pack_route)

with open(app_ts_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Backend patched")
