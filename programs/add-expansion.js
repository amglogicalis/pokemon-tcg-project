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
// Detecta si se está ejecutando desde 'programs' o desde la raíz
const PROJECT_ROOT = path.basename(__dirname) === 'programs' ? path.join(__dirname, '..') : __dirname;

const PATHS = {
    expansions: path.join(PROJECT_ROOT, 'backend', 'src', 'expansions.ts'),
    mongo: path.join(PROJECT_ROOT, 'backend', 'src', 'repositories', 'MongoUserRepository.ts'),
    shop: path.join(PROJECT_ROOT, 'frontend', 'src', 'pages', 'Shop.tsx'),
    booster: path.join(PROJECT_ROOT, 'frontend', 'src', 'components', 'BoosterPack.tsx'),
    album: path.join(PROJECT_ROOT, 'frontend', 'src', 'pages', 'Album.tsx'),
    dataDir: path.join(PROJECT_ROOT, 'backend', 'src', 'data')
};

// --- MAPEO DE RAREZAS ---
function mapRarity(r) {
    if (!r) return "common";
    const lowR = r.toLowerCase();
    if (lowR.includes('common')) return "common";
    if (lowR.includes('uncommon')) return "uncommon";
    if (lowR.includes('rare holo') || lowR.includes('illustration') || lowR.includes('shiny') || lowR.includes('v') || lowR.includes('ex')) return "ultra-rare";
    return "rare";
}

// --- LÓGICA DE INYECCIÓN SEGURA ---
function safeInject(file, id, entry, anchorRegex) {
    if (!fs.existsSync(file)) {
        console.log(`[!] Archivo no encontrado: ${path.basename(file)}`);
        return;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Verificamos si el ID ya existe con alta precisión para no duplicar
    const existRegex = new RegExp(`(['"])${id}\\1\\s*:|\\b(id)\\s*:\\s*(['"])${id}\\3`);
    if (existRegex.test(content)) {
        return; // Ya existe, no inyectamos
    }

    // Inyectamos justo después del anclaje de apertura (ej: "const EXPANSIONS = [")
    // $& representa la coincidencia del anclaje. Se añade la entrada de forma limpia.
    if (anchorRegex.test(content)) {
        content = content.replace(anchorRegex, `$& \n  ${entry},`);
        fs.writeFileSync(file, content);
    } else {
        console.log(`[!] No se encontró el punto de anclaje en ${path.basename(file)}. Revisa la sintaxis.`);
    }
}

function safeModify(file, id, newEntry, fallbackEntry, anchorRegex) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Expresiones regulares ultra-robustas para no romper llaves de cierre.
    // Detienen la búsqueda exactamente en la primera llave de cierre que encuentran (})
    // Caso 1: Estructura de Diccionario (ej. 'base1': { ... })
    const objectPropRegex = new RegExp(`['"]?${id}['"]?\\s*:\\s*\\{[^}]*\\}`, 'g');
    // Caso 2: Estructura de Array de objetos (ej. { id: 'base1', ... })
    const arrayItemRegex = new RegExp(`\\{\\s*id\\s*:\\s*['"]${id}['"][^}]*\\}`, 'g');
    
    let modified = false;

    if (objectPropRegex.test(content)) {
        // Como el newEntry viene con llaves formatadas, el reemplazo es 100% seguro
        content = content.replace(objectPropRegex, newEntry);
        modified = true;
    } else if (arrayItemRegex.test(content)) {
        content = content.replace(arrayItemRegex, newEntry);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content);
    } else {
        // Autorreparación: Si no se encuentra el bloque a modificar, se inyecta desde cero
        console.log(`[R] Autorreparación: ID '${id}' no encontrado en ${path.basename(file)}. Añadiendo...`);
        safeInject(file, id, fallbackEntry, anchorRegex);
    }
}

// --- OPERACIONES ---

async function addNewExpansion() {
    console.log("\n--- ✨ AÑADIR NUEVA COLECCIÓN ---");
    const id = await ask("ID de la expansión: ");
    const name = await ask("Nombre público: ");
    const color = await ask("Color CSS (ej. text-blue-600): ");
    const total = await ask("Total cartas: ");
    let pack = await ask("URL Sobre (se limpiará automáticamente): ");
    pack = pack.replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/main\//i, '');

    console.log("\n⏳ Creando expansión y descargando datos...");
    
    // 1. Descarga API
    try {
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${id}`);
        const data = await res.json();
        if (data.data) {
            const cards = data.data.map(c => ({
                id: `card-${c.number.padStart(3, '0')}`,
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
            console.log(`[+] Datos de cartas guardados en cards-${id}.json`);
        } else {
             console.log("[-] No se encontraron cartas en la API. Revisa el ID.");
        }
    } catch(e) { 
        console.log("[!] Error conectando a la API. Se usará un esquema vacío."); 
    }

    // 2. Inyectar en archivos usando puntos de anclaje seguros
    safeInject(PATHS.expansions, id, `'${id}': { id: '${id}', apiId: '${id}', name: '${name}', fileName: 'cards-${id}.json' }`, /const AVAILABLE_EXPANSIONS.*\{/);
    
    // Inyección especial para imports en MongoUserRepository
    if (fs.existsSync(PATHS.mongo)) {
        let mongo = fs.readFileSync(PATHS.mongo, 'utf8');
        if (!mongo.includes(`import ${id}Cards`)) {
            mongo = mongo.replace(/(import .* from '\.\.\/data\/.*\.json';\n)/, `$1import ${id}Cards from '../data/cards-${id}.json';\n`);
            fs.writeFileSync(PATHS.mongo, mongo);
        }
        safeInject(PATHS.mongo, id, `'${id}': ${id}Cards`, /const expansionsData.*\{/);
    }
    
    safeInject(PATHS.shop, id, `{ id: '${id}', name: '${name.toUpperCase()}', color: '${color}' }`, /const EXPANSIONS\s*=\s*\[/);
    
    const glow = color.replace('text-', 'bg-');
    safeInject(PATHS.booster, id, `'${id}': { imagePath: '${pack}', glow: '${glow}' }`, /const PACK_ASSETS.*\{/);
    
    safeInject(PATHS.album, id, `'${id}': { name: '${name}', totalCards: ${total}, color: '${color}' }`, /const COLLECTIONS.*\{/);

    console.log("✅ ¡Colección añadida exitosamente!");
}

async function modifyExpansion() {
    console.log("\n--- 🛠️ MODIFICAR / REPARAR COLECCIÓN ---");
    const id = await ask("ID de la expansión a modificar: ");
    
    // Valores por defecto
    let current = { name: id, color: 'text-blue-600', total: '100', pack: '' };
    
    const name = await ask(`Nuevo Nombre [${current.name}]: `) || current.name;
    const color = await ask(`Nuevo Color [${current.color}]: `) || current.color;
    const total = await ask(`Nuevo Total [${current.total}]: `) || current.total;
    let pack = await ask(`Nueva URL Sobre: `);
    pack = pack ? pack.replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/main\//i, '') : current.pack;

    console.log("\n⏳ Aplicando modificaciones (o reparando si faltan)...");

    // Formateamos las entradas completas. Esto es clave para no romper las llaves.
    const expEntry = `'${id}': { id: '${id}', apiId: '${id}', name: '${name}', fileName: 'cards-${id}.json' }`;
    const shopEntry = `{ id: '${id}', name: '${name.toUpperCase()}', color: '${color}' }`;
    const glow = color.replace('text-', 'bg-');
    const boosterEntry = `'${id}': { imagePath: '${pack}', glow: '${glow}' }`;
    const albumEntry = `'${id}': { name: '${name}', totalCards: ${total}, color: '${color}' }`;

    // Modificar (con autorreparación inyectando el fallback si no existe)
    safeModify(PATHS.expansions, id, expEntry, expEntry, /const AVAILABLE_EXPANSIONS.*\{/);
    safeModify(PATHS.shop, id, shopEntry, shopEntry, /const EXPANSIONS\s*=\s*\[/);
    safeModify(PATHS.booster, id, boosterEntry, boosterEntry, /const PACK_ASSETS.*\{/);
    safeModify(PATHS.album, id, albumEntry, albumEntry, /const COLLECTIONS.*\{/);

    console.log("✅ ¡Modificación y reparación completada sin romper sintaxis!");
}

function cleanBackups() {
    console.log("\n--- 🗑️ LIMPIANDO BACKUPS ---");
    let count = 0;
    try {
        const files = fs.readdirSync(PROJECT_ROOT);
        files.filter(f => f.startsWith('backup_') && f.endsWith('.zip')).forEach(f => {
            fs.unlinkSync(path.join(PROJECT_ROOT, f));
            console.log(`[x] Eliminado: ${f}`);
            count++;
        });
        if (count === 0) console.log("No se encontraron backups (.zip) para eliminar.");
        else console.log(`✅ ¡${count} backups eliminados!`);
    } catch (e) {
        console.error("[!] Error al limpiar backups:", e.message);
    }
}

async function main() {
    console.log("\n===== SCRIPT ADMINISTRACIÓN 4.0 =====");
    console.log("1. Añadir Nueva Colección");
    console.log("2. Modificar/Reparar Colección");
    console.log("3. Limpiar Backups (.zip)");
    console.log("4. Salir");
    console.log("=====================================");
    
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
        console.log("Opción no válida.");
        main();
    }
}

// Iniciar
main();
