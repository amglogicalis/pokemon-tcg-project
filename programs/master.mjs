import fs from 'fs';
import path from 'path';
import readline from 'readline';

// --- CONFIGURACIÓN DE RUTAS ---
const BACKEND_DATA_PATH = './backend/data'; // Ajusta según tu carpeta real
const BACKEND_CONFIG_PATH = './backend/src/config/expansions.ts';
const API_KEY = ""; // Pon tu clave aquí si tienes una

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// --- LÓGICA DE MAPEADO DE RAREZA (Tu lógica original) ---
function mapRarity(r) {
    if (!r) return "common";
    const lowR = r.toLowerCase();
    if (lowR.includes('common') && !lowR.includes('uncommon')) return "common";
    if (lowR.includes('uncommon')) return "uncommon";
    if (lowR.includes('rare holo') || lowR.includes('illustration') || lowR.includes('shiny')) return "ultra-rare";
    if (lowR.includes('rare')) return "rare";
    return "common";
}

async function main() {
    console.log("\x1b[35m%s\x1b[0m", "=== TCG EXPANSION AUTOMATOR ===");

    // 1. Recoger datos
    const setId = await question("🆔 Inserte el SET ID de Pokémon TCG API (ej: sv3pt5, base1): ");
    const internalId = await question("🔑 ID interno para la App (ej: 151, base): ");
    const publicName = await question("📛 Nombre público de la colección: ");
    const color = await question("🎨 Color Tailwind (ej: text-blue-500): ");

    console.log("\x1b[33m%s\x1b[0m", `\n🔍 Descargando cartas de: ${setId}...`);

    try {
        // 2. Fetch de datos
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`, {
            headers: API_KEY ? { 'X-Api-Key': API_KEY } : {}
        });
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            throw new Error("No se encontraron cartas. Revisa el SET ID.");
        }

        // 3. Formateo de cartas (Tu lógica de stats)
        const formattedCards = data.data.map(card => {
            const hp = parseInt(card.hp) || 60;
            const attack = card.attacks ? Math.max(...card.attacks.map(a => parseInt(a.damage) || 0)) : 40;
            const defense = Math.floor(hp / 2);

            return {
                id: `card-${card.number.padStart(3, '0')}`,
                pokemonId: card.nationalPokedexNumbers ? card.nationalPokedexNumbers[0] : 0,
                name: card.name,
                rarity: mapRarity(card.rarity),
                hp: hp,
                type: card.types ? card.types[0] : "Normal",
                attack: attack > 0 ? attack : 20,
                defense: defense,
                imageUrl: card.images.large
            };
        });

        formattedCards.sort((a, b) => a.id.localeCompare(b.id));

        // 4. Guardar archivo JSON en el Backend
        const fileName = `cards-${setId}.json`;
        const fullPath = path.join(BACKEND_DATA_PATH, fileName);

        // Asegurar que la carpeta existe
        if (!fs.existsSync(BACKEND_DATA_PATH)) fs.mkdirSync(BACKEND_DATA_PATH, { recursive: true });

        fs.writeFileSync(fullPath, JSON.stringify({ cards: formattedCards }, null, 2));
        console.log("\x1b[32m%s\x1b[0m", `\n✅ Archivo ${fileName} guardado en ${BACKEND_DATA_PATH}`);

        // 5. Generar Snippets de código
        console.log("\n" + "=".repeat(50));
        console.log("\x1b[36m%s\x1b[0m", "📝 PASO 1: Copia esto en backend/src/config/expansions.ts");
        console.log(`
'${internalId}': { 
    id: '${internalId}', 
    apiId: '${setId}', 
    name: '${publicName}', 
    fileName: '${fileName}' 
},`);

        console.log("\n" + "=".repeat(50));
        console.log("\x1b[36m%s\x1b[0m", "📝 PASO 2: Copia esto en Shop.tsx (EXPANSIONS)");
        console.log(`{ id: '${internalId}', name: '${publicName}', color: '${color}' },`);

        console.log("\n" + "=".repeat(50));
        console.log("\x1b[36m%s\x1b[0m", "📝 PASO 3: Copia esto en BoosterPack.tsx (PACK_THEMES)");
        console.log(`
'${setId}': { 
    body: 'from-gray-700 via-slate-600 to-gray-800', 
    top: 'from-slate-500', 
    glow: 'bg-blue-400' 
},`);
        console.log("=".repeat(50));

    } catch (err) {
        console.error("\x1b[31m%s\x1b[0m", "❌ Error fatal: " + err.message);
    } finally {
        rl.close();
    }
}

main();