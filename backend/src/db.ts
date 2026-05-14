import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI no está definido en el archivo .env');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB Atlas:', error);
    process.exit(1);
  }
}
