import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AuthController } from './controllers/AuthController';
import { PackController } from './controllers/PackController';
import { AlbumController } from './controllers/AlbumController';
import { authMiddleware } from './middleware/authMiddleware';
import { connectDB } from './db';

const app = express();
const PORT = process.env.PORT ?? 3001;

// 1. Conectar a MongoDB
connectDB();

// 2. Configurar CORS dinámico para permitir el frontend en producción o local
const allowedOrigins = [
  'http://localhost:5173', 
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const authController = new AuthController();
const packController = new PackController(); 
const albumController = new AlbumController();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Rutas de Autenticación REALES
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// Rutas protegidas (Requieren token para que no cualquiera abra sobres)
app.post('/api/packs/open', authMiddleware, (req, res) => packController.openPack(req as any, res));
app.get('/api/user/album', authMiddleware, (req, res) => albumController.getAlbum(req as any, res));

app.listen(PORT, () => {
  console.log(`🚀 TCG Backend corriendo en el puerto ${PORT}`);
});

export default app;
