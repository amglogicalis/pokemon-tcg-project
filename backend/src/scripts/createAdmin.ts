import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel';
import dp6Cards from '../data/cards.json';
import swsh12Cards from '../data/cards-swsh12.json';
import sm3Cards from '../data/cards-sm3.json';
import bw9Cards from '../data/cards-bw9.json';
import xypCards from '../data/cards-xyp.json';
import zsv10pt5Cards from '../data/cards-zsv10pt5.json';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

const expansionsData: Record<string, any> = { 
  'dp6': dp6Cards,
  'swsh12': swsh12Cards, 
  'sm3': sm3Cards, 
  'bw9': bw9Cards,
  'xyp': xypCards,
  'zsv10pt5': zsv10pt5Cards
};

async function createAdmin() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI no está definido en el archivo .env');
    process.exit(1);
  }

  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB.');

    // Eliminar si ya existe
    console.log('🔄 Eliminando usuario admin previo si existe...');
    await UserModel.deleteOne({ username: 'admin' });

    console.log('🔄 Encriptando contraseña "password123"...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log('🔄 Construyendo álbum con 100% de cartas completas...');
    const album: any[] = [];
    const completedExpansions: string[] = [];

    for (const [expId, data] of Object.entries(expansionsData)) {
      const cards = data.cards || [];
      console.log(`- Procesando colección [${expId}]: ${cards.length} cartas.`);
      cards.forEach((c: any) => {
        const cleanId = String(c.id).trim();
        album.push({
          card: {
            id: cleanId,
            name: c.name,
            rarity: c.rarity,
            imageUrl: c.imageUrl,
            supertype: c.supertype,
            subtypes: c.subtypes,
            types: c.types,
            expansion: c.expansion || expId
          },
          quantity: 3, // Otorga 3 copias de cada carta para facilitar trades y visualización
          obtainedAt: new Date().toISOString()
        });
      });
      completedExpansions.push(expId);
    }

    const adminUser = new UserModel({
      userId: 'admin-test-id-0001',
      username: 'admin',
      passwordHash,
      packsAvailable: 9999,
      album,
      level: 10000,
      xp: 0,
      completedExpansions,
      showcasedMedals: ['dp6', 'swsh12', 'bw9'],
      activeTheme: 'default',
      createdAt: new Date().toISOString()
    });

    console.log('🔄 Guardando usuario admin en MongoDB Atlas...');
    await adminUser.save();
    console.log('🎉 ¡Usuario admin creado con éxito!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Usuario: admin');
    console.log('🔑 Contraseña: password123');
    console.log('📦 Sobres: 9999');
    console.log('🌟 Nivel: 10000');
    console.log('🏆 Medallas: Todas Desbloqueadas y Colecciones Completadas (3 copias de c/u)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando el usuario admin:', error);
    process.exit(1);
  }
}

createAdmin();
