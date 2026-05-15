const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

async function main() {
    console.log("==================================================");
    console.log(" 🌟 GENERADOR AUTOMÁTICO DE NUEVAS EXPANSIONES 🌟");
    console.log("==================================================\n");

    const id = await ask("1. Escribe el ID de la expansión (ej: xy1, base1, etc): ");
    if (!id) return rl.close();

    const color = await ask("2. Escribe la clase CSS de color del texto (ej: text-purple-500): ");
    if (!color) return rl.close();

    const packUrl = await ask("3. Escribe la ruta de la imagen en el repo (ej: xy1/packshots/XY1_Booster_Venusaur.webp): ");
    if (!packUrl) return rl.close();

    console.log("\n⏳ [1/4] Descargando y procesando cartas desde la API...");
    try {
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${id}`);
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            console.error("❌ No se encontraron cartas para este ID. Revisa el ID en pokemontcg.io.");
            return rl.close();
        }

        const formattedCards = data.data.map(card => {
            const hp = parseInt(card.hp) || 60;
            const attack = card.attacks ? Math.max(...card.attacks.map(a => parseInt(a.damage) || 0)) : 40;
            return {
                id: `card-${card.number.padStart(3, '0')}`,
                pokemonId: card.nationalPokedexNumbers ? card.nationalPokedexNumbers[0] : 0,
                name: card.name,
                rarity: mapRarity(card.rarity),
                hp: hp,
                type: card.types ? card.types[0] : "Normal",
                attack: attack > 0 ? attack : 20,
                defense: Math.floor(hp / 2),
                imageUrl: card.images.large
            };
        });

        formattedCards.sort((a, b) => a.id.localeCompare(b.id));

        const dataPath = path.join(__dirname, 'backend', 'src', 'data', `cards-${id}.json`);
        // Tu app espera un objeto con la propiedad "cards"
        fs.writeFileSync(dataPath, JSON.stringify({ cards: formattedCards }, null, 2));
        console.log(`✅ ¡Archivo JSON creado con éxito! (${formattedCards.length} cartas)`);

    } catch (err) {
        console.error("❌ Error descargando cartas:", err.message);
        return rl.close();
    }

    // Archivos a modificar
    const paths = {
        expansions: path.join(__dirname, 'backend', 'src', 'expansions.ts'),
        mongo: path.join(__dirname, 'backend', 'src', 'repositories', 'MongoUserRepository.ts'),
        shop: path.join(__dirname, 'frontend', 'src', 'pages', 'Shop.tsx'),
        booster: path.join(__dirname, 'frontend', 'src', 'components', 'BoosterPack.tsx')
    };

    console.log("\n📦 [2/4] Creando backup .zip...");
    const timestamp = Date.now();
    const backupName = `backup_${timestamp}.zip`;
    const filesList = Object.values(paths).join(',');
    try {
        execSync(`powershell Compress-Archive -Path ${filesList} -DestinationPath ${backupName} -Force`);
        console.log(`✅ Backup guardado como ${backupName}`);
    } catch (e) {
        console.log("⚠️ No se pudo crear el .zip automáticamente. Continuando...");
    }

    console.log("\n🛠️ [3/4] Modificando código fuente...");

    try {
        // 1. Modificar backend/src/expansions.ts
        let expContent = fs.readFileSync(paths.expansions, 'utf8');
        expContent = expContent.replace(
            /export const AVAILABLE_EXPANSIONS: Record<string, ExpansionConfig> = \{([\s\S]*?)\n\};/m,
            (match, p1) => {
                const sep = p1.trim().endsWith(',') ? '' : ',';
                return `export const AVAILABLE_EXPANSIONS: Record<string, ExpansionConfig> = {${p1}${sep}\n  '${id}': {\n    id: '${id}',\n    apiId: '${id}',\n    name: '${id.toUpperCase()} Expansion',\n    fileName: 'cards-${id}.json'\n  }\n};`;
            }
        );
        fs.writeFileSync(paths.expansions, expContent);

        // 2. Modificar MongoUserRepository.ts
        let mongoContent = fs.readFileSync(paths.mongo, 'utf8');
        // Insertar el import (busca el último import de cards)
        mongoContent = mongoContent.replace(
            /(import .* from '\.\.\/data\/.*\.json';\r?\n)(?!import .* from '\.\.\/data\/.*\.json';)/,
            `$1import ${id}Cards from '../data/cards-${id}.json';\n`
        );
        // Insertar en expansionsData
        mongoContent = mongoContent.replace(
            /const expansionsData: Record<string, any> = \{([\s\S]*?)\n\};/m,
            (match, p1) => {
                const sep = p1.trim().endsWith(',') ? '' : ',';
                return `const expansionsData: Record<string, any> = {${p1}${sep}\n  '${id}': ${id}Cards\n};`;
            }
        );
        fs.writeFileSync(paths.mongo, mongoContent);

        // 3. Modificar Shop.tsx
        let shopContent = fs.readFileSync(paths.shop, 'utf8');
        shopContent = shopContent.replace(
            /const EXPANSIONS = \[([\s\S]*?)\n\];/m,
            (match, p1) => {
                const sep = p1.trim().endsWith(',') ? '' : ',';
                return `const EXPANSIONS = [${p1}${sep}\n  { id: '${id}', name: '${id.toUpperCase()} EXPANSION', color: '${color}' }\n];`;
            }
        );
        fs.writeFileSync(paths.shop, shopContent);

        // 4. Modificar BoosterPack.tsx
        let boosterContent = fs.readFileSync(paths.booster, 'utf8');
        boosterContent = boosterContent.replace(
            /const PACK_ASSETS: Record<string, \{ imagePath: string; glow: string \}> = \{([\s\S]*?)\n\};/m,
            (match, p1) => {
                const sep = p1.trim().endsWith(',') ? '' : ',';
                const glow = color.replace('text-', 'bg-'); // Convierte text-red-500 a bg-red-500
                return `const PACK_ASSETS: Record<string, { imagePath: string; glow: string }> = {${p1}${sep}\n  '${id}': {\n    imagePath: '${packUrl}',\n    glow: '${glow}'\n  }\n};`;
            }
        );
        fs.writeFileSync(paths.booster, boosterContent);

        console.log(`✅ ¡Archivos modificados correctamente!`);

    } catch (e) {
        console.error("❌ Error inyectando el código:", e);
    }

    console.log("\n🚀 [4/4] Todo finalizado con éxito. ¡Recarga tu app para ver la nueva colección!");
    rl.close();
}

function mapRarity(r) {
    if (!r) return "common";
    const lowR = r.toLowerCase();
    if (lowR.includes('common') && !lowR.includes('uncommon')) return "common";
    if (lowR.includes('uncommon')) return "uncommon";
    if (lowR.includes('rare holo') || lowR.includes('illustration') || lowR.includes('shiny') || lowR.includes('v') || lowR.includes('ex')) return "ultra-rare";
    if (lowR.includes('rare')) return "rare";
    return "common";
}

main();