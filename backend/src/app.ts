import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AuthController } from './controllers/AuthController';
import { PackController } from './controllers/PackController';
import { AlbumController } from './controllers/AlbumController';
import { TradeController } from './controllers/TradeController';
import { NotificationController } from './controllers/NotificationController';
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
const tradeController = new TradeController();
const notificationController = new NotificationController();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Rutas de Autenticación REALES
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// Rutas protegidas (Requieren token para que no cualquiera abra sobres o reclame gratis)
app.post('/api/packs/open', authMiddleware, (req, res) => packController.openPack(req as any, res));
app.post('/api/packs/claim-daily', authMiddleware, (req, res) => packController.claimDailyPacks(req as any, res));
app.get('/api/user/album', authMiddleware, (req, res) => albumController.getAlbum(req as any, res));
app.post('/api/user/favorite', authMiddleware, (req, res) => albumController.setFavoriteCard(req as any, res));
app.get('/api/mural', (req, res) => albumController.getMural(req, res));

// Rutas de Intercambios (Trades)
app.get('/api/trades/search-cards', authMiddleware, (req, res) => tradeController.searchCards(req as any, res));
app.get('/api/trades/users-with-duplicate/:cardId', authMiddleware, (req, res) => tradeController.getUsersWithDuplicate(req as any, res));
app.post('/api/trades/propose', authMiddleware, (req, res) => tradeController.proposeTrade(req as any, res));
app.get('/api/trades/public', authMiddleware, (req, res) => tradeController.getPublicTrades(req as any, res));
app.get('/api/trades/my-offers', authMiddleware, (req, res) => tradeController.getMyOffers(req as any, res));
app.post('/api/trades/:id/accept', authMiddleware, (req, res) => tradeController.acceptTrade(req as any, res));
app.post('/api/trades/:id/reject', authMiddleware, (req, res) => tradeController.rejectTrade(req as any, res));

// Rutas de Notificaciones (Notifications)
app.get('/api/notifications', authMiddleware, (req, res) => notificationController.getNotifications(req as any, res));
app.post('/api/notifications/read', authMiddleware, (req, res) => notificationController.markAllAsRead(req as any, res));
app.post('/api/notifications/clear', authMiddleware, (req, res) => notificationController.clearNotifications(req as any, res));

app.listen(PORT, () => {
  console.log(`🚀 TCG Backend corriendo en el puerto ${PORT}`);
});

export default app;
