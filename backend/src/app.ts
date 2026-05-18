import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { AuthController } from './controllers/AuthController';
import { PackController } from './controllers/PackController';
import { AlbumController } from './controllers/AlbumController';
import { TradeController } from './controllers/TradeController';
import { NotificationController } from './controllers/NotificationController';
import { authMiddleware } from './middleware/authMiddleware';
import { connectDB } from './db';

// ─── CONTROL DE VARIABLES CRÍTICAS AL INICIO ─────────────────────────────────
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ ERROR CRÍTICO: JWT_SECRET no está configurada en producción.");
    process.exit(1);
  } else {
    console.warn("⚠️  JWT_SECRET no definida. Usando 'dev_secret' solo en desarrollo.");
  }
}
if (!process.env.MONGODB_URI) {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ ERROR CRÍTICO: MONGODB_URI no está configurada en producción.");
    process.exit(1);
  } else {
    console.warn("⚠️  MONGODB_URI no definida. Asegúrate de que .env esté configurado.");
  }
}

const app = express();
const PORT = process.env.PORT ?? 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── 1. CABECERAS DE SEGURIDAD HTTP (HELMET) ─────────────────────────────────
app.use(helmet());

// ─── 2. CONEXIÓN A MONGODB ────────────────────────────────────────────────────
connectDB();

// ─── 3. RATE LIMITERS (ANTI DDOS Y BRUTE FORCE) ──────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP. Inténtalo en 15 minutos.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso. Inténtalo en 15 minutos.' }
});

app.use(globalLimiter);

// ─── 4. CORS (solo orígenes autorizados) ─────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ─── 5. PARSERS ───────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// ─── 6. MIDDLEWARE DE LOGGING DE SEGURIDAD ────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const status = res.statusCode;

    // Log de eventos relevantes para la seguridad
    if (status === 401 || status === 403) {
      console.warn(`🔐 [SECURITY] ${status} | ${req.method} ${req.path} | IP: ${ip} | ${duration}ms`);
    } else if (status === 429) {
      console.warn(`🚫 [RATE-LIMIT] IP bloqueada: ${ip} | ${req.method} ${req.path}`);
    } else if (status >= 500) {
      console.error(`💥 [ERROR-500] ${req.method} ${req.path} | IP: ${ip} | ${duration}ms`);
    }
  });
  next();
});

// ─── 7. INTERCEPTOR DE ERRORES 500 (ocultar detalles en producción) ───────────
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (res.statusCode === 500 && IS_PROD) {
      return originalJson.call(this, { error: 'Ha ocurrido un error interno en el servidor.' });
    }
    return originalJson.call(this, body);
  };
  next();
});

// ─── CONTROLADORES ───────────────────────────────────────────────────────────
const authController = new AuthController();
const packController = new PackController();
const albumController = new AlbumController();
const tradeController = new TradeController();
const notificationController = new NotificationController();

// ─── RUTAS PÚBLICAS ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' }); // Sin timestamp para no revelar info extra
});

// ─── RUTAS DE AUTENTICACIÓN (rate limiter estricto) ──────────────────────────
app.post('/api/auth/register', authLimiter, (req, res) => authController.register(req, res));
app.post('/api/auth/login',    authLimiter, (req, res) => authController.login(req, res));
app.post('/api/auth/logout',               (req, res) => authController.logout(req, res));

// ─── RUTAS PROTEGIDAS POR JWT ─────────────────────────────────────────────────
app.post('/api/packs/open',        authMiddleware, (req, res) => packController.openPack(req as any, res));
app.post('/api/packs/claim-daily', authMiddleware, (req, res) => packController.claimDailyPacks(req as any, res));
app.get ('/api/user/album',        authMiddleware, (req, res) => albumController.getAlbum(req as any, res));
app.post('/api/user/favorite',     authMiddleware, (req, res) => albumController.setFavoriteCard(req as any, res));
app.get ('/api/mural',                             (req, res) => albumController.getMural(req, res));

// ─── RUTAS DE INTERCAMBIOS ────────────────────────────────────────────────────
app.get ('/api/trades/search-cards',                     authMiddleware, (req, res) => tradeController.searchCards(req as any, res));
app.get ('/api/trades/users-with-duplicate/:cardId',     authMiddleware, (req, res) => tradeController.getUsersWithDuplicate(req as any, res));
app.post('/api/trades/propose',                          authMiddleware, (req, res) => tradeController.proposeTrade(req as any, res));
app.get ('/api/trades/public',                           authMiddleware, (req, res) => tradeController.getPublicTrades(req as any, res));
app.get ('/api/trades/my-offers',                        authMiddleware, (req, res) => tradeController.getMyOffers(req as any, res));
app.post('/api/trades/:id/accept',                       authMiddleware, (req, res) => tradeController.acceptTrade(req as any, res));
app.post('/api/trades/:id/reject',                       authMiddleware, (req, res) => tradeController.rejectTrade(req as any, res));

// ─── RUTAS DE NOTIFICACIONES ──────────────────────────────────────────────────
app.get ('/api/notifications',       authMiddleware, (req, res) => notificationController.getNotifications(req as any, res));
app.post('/api/notifications/read',  authMiddleware, (req, res) => notificationController.markAllAsRead(req as any, res));
app.post('/api/notifications/clear', authMiddleware, (req, res) => notificationController.clearNotifications(req as any, res));

// ─── ARRANQUE ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 TCG Backend corriendo de forma segura en el puerto ${PORT}`);
});

export default app;
