# 🔐 Análisis de Seguridad — Pokémon TCG Project
**Stack:** Express (Render) + React/Vite (Vercel) + MongoDB Atlas

---

> [!CAUTION]
> Algunas de estas vulnerabilidades permiten a un atacante **manipular el juego, robar cuentas o tirar el servidor** sin necesidad de conocimientos avanzados. Se recomienda abordarlas antes de compartir la URL públicamente.

---

## ✅ Lo que ya está bien hecho

| Elemento | Estado |
|---|---|
| Contraseñas hasheadas con `bcrypt` (10 salt rounds) | ✅ Correcto |
| JWT verificado en middleware antes de acceder a rutas | ✅ Correcto |
| CORS restringido a `FRONTEND_URL` de entorno | ✅ Correcto |
| Cooldown de sobres diarios verificado en servidor | ✅ Correcto |
| Verificación de `packsAvailable > 0` en servidor | ✅ Correcto |
| Mongoose como ODM (protección básica NoSQL) | ✅ Correcto |
| MongoDB Atlas en la nube con conexión por string | ✅ Correcto |

---

## 🚨 Vulnerabilidades Críticas

### 1. **Sin Rate Limiting en ningún endpoint** ⚠️ CRÍTICO
**Archivos afectados:** `app.ts`

No hay ningún middleware de limitación de peticiones (`express-rate-limit` o similar) en **ninguna ruta**. Esto expone el servidor a:

- **Brute Force en Login:** Un atacante puede intentar millones de combinaciones de contraseñas contra un usuario concreto de forma automatizada. Con contraseñas de solo 6 caracteres (el mínimo actual), esto es especialmente peligroso.
- **Spam de Registro:** Se pueden crear miles de cuentas automáticamente en segundos, llenando la base de datos de MongoDB Atlas y consumiendo el tier gratuito.
- **Spam de apertura de sobres:** Aunque valida `packsAvailable`, cada petición realiza una consulta a MongoDB. Con peticiones masivas paralelas puede saturar la base de datos o incurrir en costes inesperados.
- **DoS (Denegación de Servicio):** Sin límite, cualquiera puede enviar 10.000 peticiones/segundo al servidor de Render, que al estar en tier gratuito tiene recursos muy limitados.

```js
// Actualmente — sin protección:
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// Lo que debería haber:
app.post('/api/auth/login', loginLimiter, (req, res) => authController.login(req, res));
```

---

### 2. **JWT Secret con fallback inseguro** ⚠️ CRÍTICO
**Archivo:** `authMiddleware.ts` línea 19 y `AuthService.ts` línea 8

```ts
// authMiddleware.ts
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

// AuthService.ts
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';
```

Si la variable de entorno `JWT_SECRET` **no está configurada en Render**, el servidor usa `'secret'` o `'dev_secret'` como clave. Con esa clave, un atacante puede **forjar tokens JWT válidos para cualquier usuario** (incluyendo admin) usando herramientas online públicas.

> Aunque en producción la tengas configurada, el fallback es una trampa de seguridad activa. Debería lanzar un error fatal si no existe en vez de usar un fallback.

---

### 3. **Sin cabeceras de seguridad HTTP (Helmet)** ⚠️ ALTO
**Archivo:** `app.ts`

No hay ningún middleware que configure las cabeceras de seguridad HTTP estándar. Esto significa que el servidor no envía:

| Cabecera | Protección que falta |
|---|---|
| `X-Content-Type-Options: nosniff` | Previene ataques MIME-type sniffing |
| `X-Frame-Options: DENY` | Previene ataques de Clickjacking (iframe malicioso) |
| `Content-Security-Policy` | Previene inyección de scripts (XSS) |
| `Strict-Transport-Security` | Fuerza HTTPS en navegadores |
| `X-XSS-Protection` | Activa filtro XSS en navegadores antiguos |
| `Referrer-Policy` | Evita filtración de URLs internas |

---

### 4. **Sin límite de tamaño en el cuerpo de las peticiones** ⚠️ ALTO
**Archivo:** `app.ts` línea 25

```ts
app.use(express.json()); // Sin límite de tamaño
```

Un atacante puede enviar un cuerpo JSON de **varios megabytes o gigabytes** en una sola petición, consumiendo toda la memoria RAM del servidor de Render. El límite por defecto de Express es 100kb, pero no está explícitamente configurado.

---

## 🔶 Vulnerabilidades Medias

### 5. **Enumeración de usuarios en Registro**
**Archivo:** `AuthService.ts` línea 28

```ts
throw new Error('Ese nombre de usuario ya está en uso.');
```

El endpoint de registro devuelve un error diferente cuando el usuario **ya existe** versus cuando no. Esto permite a un atacante confirmar si un username concreto tiene cuenta en el sistema (user enumeration), facilitando ataques dirigidos.

---

### 6. **Mensajes de error internos expuestos al cliente**
**Archivos:** `AuthController.ts`, `PackController.ts`, `TradeController.ts`

```ts
// En múltiples controllers:
res.status(500).json({ error: error.message });
```

Los mensajes de error de Node.js/MongoDB se envían directamente al cliente. Un atacante puede provocar errores intencionalmente para obtener información sobre la estructura de la base de datos, rutas de archivo o versiones de dependencias.

---

### 7. **Política de contraseñas muy débil**
**Archivo:** `AuthService.ts` línea 20

```ts
if (!password || password.length < 6) { ... }
```

Solo se requiere un mínimo de **6 caracteres**, sin exigir mayúsculas, números o caracteres especiales. Contraseñas como `"123456"` son válidas y fácilmente vulnerables a diccionario.

---

### 8. **Endpoint público `/api/mural` sin autenticación**
**Archivo:** `app.ts` línea 46

```ts
app.get('/api/mural', (req, res) => albumController.getMural(req, res));
```

El mural devuelve datos de todos los usuarios sin requerir autenticación. Aunque es intencionado para la funcionalidad social, expone usernames, carta favorita y nivel de **todos los usuarios registrados** a cualquiera que haga una petición directa a la API, sin siquiera tener cuenta.

---

### 9. **Schema Mongoose `Mixed` para datos de carta**
**Archivo:** `UserModel.ts` línea 9

```ts
card: { type: Schema.Types.Mixed, required: true },
```

El campo `card` dentro de cada entrada del álbum acepta **cualquier estructura de datos**. Aunque el flujo normal está controlado, si en algún futuro un endpoint acepta datos de carta del cliente sin validarlos contra el catálogo del servidor, un atacante podría inyectar objetos arbitrarios en el álbum.

---

### 10. **Sin token de refresco ni revocación de JWT**
**Archivo:** `AuthService.ts`

Los JWT tienen una vida de 24 horas y no hay forma de invalidarlos antes de que expiren. Si una sesión es robada (por ejemplo, desde localStorage del navegador), el token comprometido seguirá siendo válido hasta que caduque. No hay logout real en el servidor.

---

## 🔷 Vulnerabilidades Bajas / Mejoras Recomendadas

### 11. **Endpoint `/health` expuesto sin autenticación**
```ts
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
```
Revela que el servidor está activo y su timestamp. Un atacante puede usarlo para monitorear la disponibilidad antes de un ataque coordinado. Es un riesgo menor pero innecesario.

---

### 12. **Sin logging de seguridad ni alertas**
No existe ningún sistema de logging estructurado que registre intentos fallidos de login, peticiones anómalas o errores repetidos. Si alguien está atacando activamente el sistema, no hay forma de saberlo hasta que el daño esté hecho.

---

### 13. **`localStorage` para JWT en el frontend**
**Implícito por la arquitectura frontend.**

Los tokens JWT se almacenan en `localStorage` (o en el store de Zustand que persiste en localStorage). Aunque el CORS está configurado, los datos en `localStorage` son accesibles desde cualquier script JavaScript que se ejecute en la página. Si en algún momento se introduce contenido de terceros (anuncios, plugins, scripts externos), sería una superficie de ataque para robar sesiones (XSS → Session Hijacking).

---

## 📊 Resumen de Riesgos

| # | Vulnerabilidad | Severidad | Facilidad de explotación |
|---|---|---|---|
| 1 | Sin Rate Limiting | 🔴 Crítico | Muy fácil (herramientas automatizadas) |
| 2 | JWT Secret con fallback | 🔴 Crítico | Fácil si env var no está configurada |
| 3 | Sin cabeceras Helmet | 🟠 Alto | Media (requiere ingeniería social) |
| 4 | Sin límite de payload | 🟠 Alto | Fácil (una sola petición curl) |
| 5 | Enumeración de usuarios | 🟡 Medio | Fácil (peticiones manuales) |
| 6 | Errores internos expuestos | 🟡 Medio | Fácil (provocar errores) |
| 7 | Contraseña mínimo 6 chars | 🟡 Medio | Media (con lista de diccionario) |
| 8 | Mural público sin auth | 🟡 Medio | Trivial (petición directa) |
| 9 | Schema Mixed en carta | 🟡 Medio | Difícil (requiere conocer la API) |
| 10 | Sin revocación de JWT | 🔵 Bajo | Media |
| 11-13 | Otros | 🔵 Bajo | Variable |

---

## 🛠️ Soluciones (resumen de lo que habría que implementar)

```
1. npm install express-rate-limit    → Rate limiting en login, registro, packs
2. npm install helmet                → Todas las cabeceras de seguridad automáticas
3. Verificar JWT_SECRET en startup   → Lanzar error si no está configurada en .env
4. express.json({ limit: '10kb' })  → Limitar tamaño de payloads
5. npm install express-validator     → Validación y sanitización de inputs
6. Mensajes de error genéricos       → No exponer error.message al cliente
7. Política de contraseñas más fuerte → Regex con mayúsculas + números
```

> [!IMPORTANT]
> Las correcciones 1, 2, 3 y 4 son las más urgentes y pueden implementarse en `app.ts` en menos de 30 líneas de código. Di la orden cuando quieras que las aplique.
