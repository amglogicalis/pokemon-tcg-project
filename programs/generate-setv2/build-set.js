const fs = require('fs');

// Configuración rápida
const API_KEY = ""; // Opcional pero recomendado si haces muchos sets
const SET_ID = process.argv[2]; // Captura el set que escribas en la terminal

if (!SET_ID) {
    console.error("❌ Por favor, indica un SET ID. Ejemplo: node build-set.js sv3pt5");
    process.exit(1);
}

async function generateJson() {
    console.log(`\x1b[33m%s\x1b[0m`, `🔍 Extrayendo datos de la colección: ${SET_ID}...`);
    
    try {
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${SET_ID}`, {
            headers: API_KEY ? { 'X-Api-Key': API_KEY } : {}
        });
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            throw new Error("No se encontraron cartas para este ID. Revisa si el ID es correcto en Scrydex.");
        }

        const formattedCards = data.data.map(card => {
            // Mapeo de stats (la API de TCG no da stats RPG directos, así que los derivamos de sus ataques o HP)
            const hp = parseInt(card.hp) || 60;
            const attack = card.attacks ? Math.max(...card.attacks.map(a => parseInt(a.damage) || 0)) : 40;
            const defense = Math.floor(hp / 2); // Estimación para cumplir tu formato

            return {
                id: `card-${card.number.padStart(3, '0')}`, // Formato card-001
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

        // Ordenar por número para que el JSON sea legible
        formattedCards.sort((a, b) => a.id.localeCompare(b.id));

        fs.writeFileSync(`${SET_ID}.json`, JSON.stringify(formattedCards, null, 2));
        console.log(`\x1b[32m%s\x1b[0m`, `✅ ¡Archivo ${SET_ID}.json creado con éxito! (${formattedCards.length} cartas)`);

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

function mapRarity(r) {
    if (!r) return "common";
    const lowR = r.toLowerCase();
    
    if (lowR.includes('common') && !lowR.includes('uncommon')) return "common";
    if (lowR.includes('uncommon')) return "uncommon";
    if (lowR.includes('rare holo') || lowR.includes('illustration') || lowR.includes('shiny')) return "ultra-rare";
    if (lowR.includes('rare')) return "rare";
    
    return "common";
}

generateJson();