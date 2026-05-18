const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

// --- RUTAS ABSOLUTAS ---
const PROJECT_ROOT = path.basename(__dirname) === 'programs' ? path.join(__dirname, '..') : __dirname;

const PATHS = {
    expansions: path.join(PROJECT_ROOT, 'backend', 'src', 'expansions.ts'),
    mongo: path.join(PROJECT_ROOT, 'backend', 'src', 'repositories', 'MongoUserRepository.ts'),
    albumController: path.join(PROJECT_ROOT, 'backend', 'src', 'controllers', 'AlbumController.ts'),
    shop: path.join(PROJECT_ROOT, 'frontend', 'src', 'pages', 'Shop.tsx'),
    booster: path.join(PROJECT_ROOT, 'frontend', 'src', 'components', 'BoosterPack.tsx'),
    album: path.join(PROJECT_ROOT, 'frontend', 'src', 'pages', 'Album.tsx'),
    dataDir: path.join(PROJECT_ROOT, 'backend', 'src', 'data')
};

// --- FUNCIÓN DE BACKUP ---
function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(PROJECT_ROOT, 'backups', `backup_${timestamp}`);
    
    if (!fs.existsSync(path.join(PROJECT_ROOT, 'backups'))) {
        fs.mkdirSync(path.join(PROJECT_ROOT, 'backups'));
    }
    fs.mkdirSync(backupDir);

    console.log(`\n📦 Creando backup de seguridad en: /backups/backup_${timestamp}/`);
    
    Object.values(PATHS).forEach(filePath => {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            const dest = path.join(backupDir, path.basename(filePath));
            fs.copyFileSync(filePath, dest);
        }
    });
}

// --- MAPEO DE RAREZAS ---
function mapRarity(r) {
    if (!r) return "common";
    const lowR = r.toLowerCase();
    if (lowR.includes('ultra secret') || lowR.includes('ultra-secret')) return "ultra-secret";
    if (lowR.includes('super secret') || lowR.includes('super-secret')) return "super-secret";
    if (lowR.includes('secret') || lowR.includes('hyper') || lowR.includes('gold')) return "secret";
    if (lowR.includes('common')) return "common";
    if (lowR.includes('uncommon')) return "uncommon";
    if (lowR.includes('rare holo') || lowR.includes('illustration') || lowR.includes('shiny') || lowR.includes('v') || lowR.includes('ex')) return "ultra-rare";
    return "rare";
}

// --- LÓGICA DE INYECCIÓN SEGURA ---
function safeInject(file, id, entry, anchorRegex) {
    if (!fs.existsSync(file)) return;
    
    let content = fs.readFileSync(file, 'utf8');
    
    const existRegex = new RegExp(`['"]${id.trim()}['"]\\s*:|id\\s*:\\s*['"]${id.trim()}['"]`);
    if (existRegex.test(content)) {
        console.log(`[-] El ID '${id}' ya existe en ${path.basename(file)}. Saltando...`);
        return;
    }

    if (anchorRegex.test(content)) {
        content = content.replace(anchorRegex, `$& \n  ${entry.trim()},`);
        fs.writeFileSync(file, content);
        console.log(`[+] Inyectado en ${path.basename(file)}`);
    } else {
        console.log(`[!] No se encontró el punto de anclaje en ${path.basename(file)}.`);
    }
}

function safeModify(file, id, newEntry, fallbackEntry, anchorRegex) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    const objectPropRegex = new RegExp(`['"]?${id}['"]?\\s*:\\s*\\{[^}]*\\}`, 'g');
    const arrayItemRegex = new RegExp(`\\{\\s*id\\s*:\\s*['"]${id}['"][^}]*\\}`, 'g');
    
    let modified = false;

    if (objectPropRegex.test(content)) {
        content = content.replace(objectPropRegex, newEntry.trim());
        modified = true;
    } else if (arrayItemRegex.test(content)) {
        content = content.replace(arrayItemRegex, newEntry.trim());
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log(`[*] Modificado ID '${id}' en ${path.basename(file)}`);
    } else {
        console.log(`[R] Reparando: ID '${id}' no encontrado en ${path.basename(file)}.`);
        safeInject(file, id, fallbackEntry, anchorRegex);
    }
}

// --- OPERACIONES ---

async function addNewExpansion() {
    console.log("\n--- ✨ AÑADIR NUEVA COLECCIÓN ---");
    const id = await ask("ID de la expansión (ej: sv8): ");
    const name = await ask("Nombre público (ej: Surging Sparks): ");
    const color = await ask("Color CSS (ej. text-blue-600): ");
    const total = await ask("Total cartas (número): ");
    let pack = await ask("URL Imagen Sobre (GitHub o Local): ");
    pack = pack.replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/main\//i, '');

    createBackup();

    console.log("\n⏳ Descargando datos de la API...");
    try {
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${id}`);
        const data = await res.json();
        if (data.data) {
            const cards = data.data.map(c => ({
                id: `${id}-${c.number.padStart(3, '0')}`,
                pokemonId: c.nationalPokedexNumbers ? c.nationalPokedexNumbers[0] : 0,
                name: c.name,
                rarity: mapRarity(c.rarity),
                hp: parseInt(c.hp) || 60,
                type: c.types ? c.types[0] : "Normal",
                attack: c.attacks ? Math.max(...c.attacks.map(a => parseInt(a.damage) || 0)) : 20,
                defense: Math.floor((parseInt(c.hp) || 60) / 2),
                imageUrl: c.images.large
            })).sort((a, b) => a.id.localeCompare(b.id));
            
            if (!fs.existsSync(PATHS.dataDir)) fs.mkdirSync(PATHS.dataDir, { recursive: true });
            fs.writeFileSync(path.join(PATHS.dataDir, `cards-${id}.json`), JSON.stringify({ cards }, null, 2));
            console.log(`[+] cards-${id}.json creado.`);
        }
    } catch(e) { 
        console.log("[!] Error en API. Se creará config básica."); 
    }

    // 1. Backend Expansions
    safeInject(PATHS.expansions, id, `'${id}': { id: '${id}', apiId: '${id}', name: '${name}', fileName: 'cards-${id}.json' }`, /const AVAILABLE_EXPANSIONS.*\{/);
    
    // 2. Mongo Repository Imports & Data
    if (fs.existsSync(PATHS.mongo)) {
        let mongo = fs.readFileSync(PATHS.mongo, 'utf8');
        if (!mongo.includes(`import ${id}Cards`)) {
            mongo = mongo.replace(/(import .* from '\.\.\/data\/.*\.json';\n)/, `$1import ${id}Cards from '../data/cards-${id}.json';\n`);
            fs.writeFileSync(PATHS.mongo, mongo);
        }
        safeInject(PATHS.mongo, id, `'${id}': ${id}Cards`, /const expansionsData.*\{/);
    }

    // 3. AlbumController Sync (IMPORTANTE)
    if (fs.existsSync(PATHS.albumController)) {
        let albumC = fs.readFileSync(PATHS.albumController, 'utf8');
        if (!albumC.includes(`import ${id}Cards`)) {
            albumC = albumC.replace(/(import .* from '\.\.\/data\/.*\.json';\n)/, `$1import ${id}Cards from '../data/cards-${id}.json';\n`);
            albumC = albumC.replace(/(addCardsToMap\(.*\.cards, '.*\.json'\);\n)/, `$1      addCardsToMap(${id}Cards.cards, 'cards-${id}.json');\n`);
            fs.writeFileSync(PATHS.albumController, albumC);
            console.log(`[+] AlbumController actualizado con ${id}`);
        }
    }
    
    // 4. Frontend Shop
    safeInject(PATHS.shop, id, `{ id: '${id}', name: '${name.toUpperCase()}', color: '${color}' }`, /const EXPANSIONS\s*=\s*\[/);
    
    // 5. Frontend Booster
    const glow = color.replace('text-', 'bg-');
    safeInject(PATHS.booster, id, `'${id}': { imagePath: '${pack}', glow: '${glow}' }`, /const PACK_ASSETS.*\{/);
    
    // 6. Frontend Album UI & Filter (NUEVO: Incluye el filtro)
    const bar = color.replace('text-', 'from-').replace('600', '700') + ' to-' + color.replace('text-', '').replace('600', '300');
    safeInject(PATHS.album, id, `${id}: { id: '${id}', name: '${name}', total: ${total}, color: '${color}', bar: '${bar}' }`, /const EXPANSIONS.*\{/);
    
    // Inyectar lógica de filtro en Album.tsx
    let albumTsx = fs.readFileSync(PATHS.album, 'utf8');
    if (!albumTsx.includes(`activeTab === '${id}'`)) {
        const filterSnippet = `      if (activeTab === '${id}') {\n        return cardId.startsWith('${id}-');\n      }`;
        albumTsx = albumTsx.replace(/(const filteredEntries = entries.filter\(e => \{\n\s*const cardId = e.card.id.toLowerCase\(\);\n)/, `$1\n${filterSnippet}`);
        fs.writeFileSync(PATHS.album, albumTsx);
        console.log(`[+] Filtro de Álbum añadido para ${id}`);
    }

    console.log("\n✅ ¡Colección añadida con éxito!");
}

async function modifyExpansion() {
    console.log("\n--- 🛠️ MODIFICAR / REPARAR COLECCIÓN ---");
    const id = await ask("ID de la expansión a modificar: ");
    const name = await ask("Nuevo Nombre: ");
    const color = await ask("Nuevo Color CSS: ");
    const total = await ask("Nuevo Total: ");
    let pack = await ask("Nueva URL Imagen Sobre: ");
    pack = pack ? pack.replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/main\//i, '') : "";

    createBackup();

    const expEntry = `'${id}': { id: '${id}', apiId: '${id}', name: '${name}', fileName: 'cards-${id}.json' }`;
    const shopEntry = `{ id: '${id}', name: '${name.toUpperCase()}', color: '${color}' }`;
    const glow = color.replace('text-', 'bg-');
    const boosterEntry = `'${id}': { imagePath: '${pack}', glow: '${glow}' }`;
    const bar = color.replace('text-', 'from-').replace('600', '700') + ' to-' + color.replace('text-', '').replace('600', '300');
    const albumEntry = `${id}: { id: '${id}', name: '${name}', total: ${total}, color: '${color}', bar: '${bar}' }`;

    safeModify(PATHS.expansions, id, expEntry, expEntry, /const AVAILABLE_EXPANSIONS.*\{/);
    safeModify(PATHS.shop, id, shopEntry, shopEntry, /const EXPANSIONS\s*=\s*\[/);
    safeModify(PATHS.booster, id, boosterEntry, boosterEntry, /const PACK_ASSETS.*\{/);
    safeModify(PATHS.album, id, albumEntry, albumEntry, /const EXPANSIONS.*\{/);

    console.log("✅ ¡Modificación completada!");
}

function cleanBackups() {
    const backupRoot = path.join(PROJECT_ROOT, 'backups');
    if (!fs.existsSync(backupRoot)) {
        console.log("No existe carpeta de backups.");
        return;
    }
    console.log("\n--- 🗑️ LIMPIANDO BACKUPS ---");
    try {
        const folders = fs.readdirSync(backupRoot);
        folders.forEach(f => {
            const folderPath = path.join(backupRoot, f);
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`[x] Eliminado: ${f}`);
        });
        console.log("✅ Limpieza completada.");
    } catch (e) {
        console.error("[!] Error:", e.message);
    }
}

async function main() {
    console.log("\n===== SCRIPT ADMINISTRACIÓN 6.0 (ULTRA-SAFE) =====");
    console.log("1. Añadir Nueva Colección");
    console.log("2. Modificar/Reparar Colección");
    console.log("3. Limpiar Carpeta de Backups");
    console.log("4. Salir");
    console.log("==================================================");
    
    const op = await ask("\nElige una opción (1-4): ");
    
    if (op === '1') {
        await addNewExpansion();
        main();
    } else if (op === '2') {
        await modifyExpansion();
        main();
    } else if (op === '3') {
        cleanBackups();
        main();
    } else if (op === '4') {
        console.log("Saliendo...");
        process.exit(0);
    } else {
        main();
    }
}

main();
