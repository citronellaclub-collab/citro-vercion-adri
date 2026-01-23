# MATRIZ DE FUNCIONALIDADES & MAPA TÉCNICO DETALLADO

**Documento Complementario al Relevamiento Exhaustivo**  
**Fecha:** 23 de Enero, 2026

---

## TABLA 1: MATRIZ DE FUNCIONALIDADES POR MÓDULO

### MÓDULO: AUTENTICACIÓN (Auth)

| Funcionalidad | Endpoint | Método | Auth | Estado | Última Revisión |
|---------------|----------|--------|------|--------|-----------------|
| Registrar usuario | `/api/auth/register` | POST | No | ✅ Funcional | 2026-01 |
| Login | `/api/auth/login` | POST | No | ✅ Funcional | 2026-01 |
| Obtener perfil actual | `/api/auth/me` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Actualizar email | `/api/auth/update-email` | PUT | **SÍ** | ✅ Funcional | 2026-01 |
| Reenviar verificación | `/api/auth/resend-verification` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Verificar email por token | `/api/auth/verify/:token` | GET | No | ✅ Funcional | 2026-01 |

**Servicios Involucrados:**
- `mailService.js`: Envío de emails con Brevo SMTP
- `bcryptjs`: Hashing de passwords
- JWT: Generación y validación de tokens

**Validaciones:**
- Username: 3+ caracteres, único
- Password: 6+ caracteres
- Email: Formato válido (opcional)
- Token JWT: 24h expiration

---

### MÓDULO: MI CULTIVO (Crops)

| Funcionalidad | Endpoint | Método | Auth | Estado | Última Revisión |
|---------------|----------|--------|------|--------|-----------------|
| Listar mis cultivos | `/api/crops` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Crear cultivo | `/api/crops` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Eliminar cultivo | `/api/crops/:id` | DELETE | **SÍ** | ✅ Funcional | 2026-01 |
| Añadir bitácora semanal | `/api/crops/:id/logs` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Obtener logs del cultivo | `/api/crops/:id/logs` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Eliminar un log | `/api/logs/:id` | DELETE | **SÍ** | ✅ Funcional | 2026-01 |

**Lógica de Salud del Cultivo:**
```
Status: Verde (optimal)
  - pH: 5.8 - 6.2
  - EC: dentro de rango por fase
  
Status: Amarillo (warning)
  - pH: 5.5 - 5.8 o 6.2 - 6.5
  - EC: ligeramente fuera de rango
  
Status: Rojo (critical)
  - pH: < 5.0 o > 7.0
  - EC: > rango máximo por fase + 0.4
```

**Fases del Cultivo:**
1. Germinación: EC 0.4-0.8
2. Vegetación: EC 1.2-1.6
3. Floración: EC 1.8-2.2
4. Senescencia: EC 1.0-1.4

**Servicios Involucrados:**
- `blobService.js`: Upload de imágenes a Vercel Blob
- Prisma: CRUD de Crop y CropLog

---

### MÓDULO: MARKETPLACE (GTL)

| Funcionalidad | Endpoint | Método | Auth | Estado | Última Revisión |
|---------------|----------|--------|------|--------|-----------------|
| Explorar productos | `/api/market` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Mis publicaciones | `/api/market/my-sales` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Publicar producto | `/api/market` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Editar producto | `/api/market/:id` | PUT | **SÍ** | ✅ Funcional | 2026-01 |
| Eliminar producto | `/api/market/:id` | DELETE | **SÍ** | ✅ Funcional | 2026-01 |
| Toggle wishlist | `/api/market/wishlist` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Ver notificaciones | `/api/notifications` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Marcar notificación leída | `/api/notifications/read` | POST | **SÍ** | ✅ Funcional | 2026-01 |

**Filtros de Exploración:**
- `category`: Flores, Parafernalia, Genéticas
- `search`: Búsqueda por nombre
- `minPrice` / `maxPrice`: Rango de precio
- `sortBy`: price_asc, price_desc, stock, createdAt
- `isVerified`: Solo de vendedores verificados
- `wishlistedOnly`: Solo deseados

**Cálculos:**
- `avgRating`: Promedio de ratings de reviews
- `reviewCount`: Cantidad de reviews
- `isOffer`: Cuando price < basePrice

**Servicios Involucrados:**
- `blobService.js`: Upload de imágenes
- Prisma Queries complejas: `findMany` con `include` anidado

---

### MÓDULO: PEDIDOS (Orders)

| Funcionalidad | Endpoint | Método | Auth | Estado | Última Revisión |
|---------------|----------|--------|------|--------|-----------------|
| Crear orden (checkout) | `/api/orders` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Historial de compras | `/api/orders` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Historial de ventas | `/api/orders/sales` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Dejar review | `/api/orders/:id/review` | POST | **SÍ** | ✅ Funcional | 2026-01 |

**Lógica de Transacción:**
```
Prisma.$transaction(async (tx) => {
  1. Validar que todos los productos existan
  2. Validar stock suficiente para cada item
  3. Validar que vendedor ≠ comprador
  4. Calcular total en tokens
  5. Validar saldo del comprador
  6. Descontar tokens del comprador (-X)
  7. Transferir tokens a vendedores (+X cada uno)
  8. Decrementar stock de productos
  9. Crear Order + OrderItems
  10. Retornar order confirmado
})
```

**Statuses de Orden:**
- Pendiente: Creada, esperando entrega
- Entregado: Completada
- Cancelado: Rechazada o revertida

**Servicios Involucrados:**
- Prisma `$transaction`: Atomicidad garantizada
- Calcular economia: tokens += price * quantity

---

### MÓDULO: FORO (Forum)

| Funcionalidad | Endpoint | Método | Auth | Estado | Última Revisión |
|---------------|----------|--------|------|--------|-----------------|
| Listar posts | `/api/forum` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Crear post | `/api/forum` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Comentar post | `/api/forum/:id/comment` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Suscribirse a post | `/api/forum/:id/subscribe` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Reaccionar a post | `/api/forum/:id/react` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Ver suscripciones | `/api/forum/subscriptions` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Eliminar post | `/api/forum/:id` | DELETE | **SÍ** | ✅ Funcional | 2026-01 |

**Categorías de Post:**
- Clases
- Investigaciones
- FAQ
- Debates
- Papers
- Noticias
- Anuncios

**Tipos de Reacción:**
- Interesante
- Útil
- Científico

**Restricciones:**
- Un usuario: una reacción por post (unique constraint)
- Un usuario: una suscripción por post (unique constraint)
- Posts inmovilizados (`isPinned`): Aparecen primero
- Posts inmutables (`isImmutable`): No pueden editarse

**Servicios Involucrados:**
- `blobService.js`: Upload de attachments (hasta 5 archivos)
- `uploadToBlob()`: Soporta multipart/form-data

---

### MÓDULO: EVENTOS (Events)

| Funcionalidad | Endpoint | Método | Auth | Estado | Última Revisión |
|---------------|----------|--------|------|--------|-----------------|
| Listar eventos | `/api/events` | GET | **SÍ** | ✅ Funcional | 2026-01 |
| Crear evento | `/api/events` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Reservar ticket | `/api/events/reserve` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Mis reservaciones | `/api/events/my-reservations` | GET | **SÍ** | ✅ Funcional | 2026-01 |

**Estructura de Evento:**
```javascript
Event {
  id, title, description, date, time, location,
  requirements, flyerUrl, capacity,
  categories: TicketCategory[] {
    id, name (General/VIP/Socio), price, benefits
  }
}
```

**Reserva:**
```javascript
Reservation {
  id, userId, categoryId, qrCode (simulado), createdAt
}
```

**Servicios Involucrados:**
- `blobService.js`: Upload del flyer
- Prisma relations: Event → TicketCategory → Reservation

---

### MÓDULO: ADMIN

| Funcionalidad | Endpoint | Método | Auth | Estado | Última Revisión |
|---------------|----------|--------|------|--------|-----------------|
| Verificar staff | `/api/admin/verify` | POST | **SÍ** | ✅ Funcional | 2026-01 |
| Listar usuarios | `/api/admin/users` | GET | **SÍ** (admin) | ✅ Funcional | 2026-01 |
| Gestionar tokens | `/api/admin/tokens` | POST | **SÍ** (admin) | ✅ Funcional | 2026-01 |
| Actualizar T&C | `/api/admin/legal` | POST | **SÍ** (admin) | ✅ Funcional | 2026-01 |
| Moderar post | `/api/admin/forum/:postId` | POST | **SÍ** (admin) | ✅ Funcional | 2026-01 |

**Acceso Admin:**
- Password-based: `POST /api/admin/verify { password }`
- Si `STAFF_PASSWORD` coincide: `role = ADMIN`, `isDev = true`
- Bypass especial: Si `isDev = true`, algunos endpoints ignoran DB

**Gestión de Tokens:**
```javascript
{
  action: 'add' | 'subtract' | 'set',
  userId: number,
  amount: number
}
```

**Servicios Involucrados:**
- Environment: `STAFF_PASSWORD`
- Prisma updates: User, Post

---

## TABLA 2: FLUJO DE DATOS (Data Flow)

```
┌──────────────────────────────┐
│   USUARIO (Browser)          │
│  Frontend React + Fetch API  │
└──────────────┬───────────────┘
               │ HTTP POST/GET/PUT/DELETE
               │ Content-Type: application/json
               │ Header: Authorization: Bearer <JWT>
               ▼
┌──────────────────────────────┐
│   SERVIDOR (Node.js)         │
│                              │
│  Express.js                  │
│  ├─ Middleware CORS          │
│  ├─ Middleware JSON Parser   │
│  ├─ Middleware Auth (JWT)    │
│  ├─ Middleware Multer        │
│  └─ Routes + Controllers     │
│                              │
│  Controllers:                │
│  ├─ Validar entrada          │
│  ├─ Transformar datos        │
│  ├─ Llamar servicios         │
│  └─ Responder JSON           │
└──────────────┬───────────────┘
               │ Prisma ORM
               │ SQL Queries
               │ Connection Pool
               ▼
┌──────────────────────────────┐
│   PostgreSQL (Easypanel)     │
│                              │
│  13 Tables:                  │
│  ├─ User                     │
│  ├─ Crop, CropLog            │
│  ├─ Product, Order, OrderItem│
│  ├─ Post, Comment, Reaction  │
│  ├─ Event, TicketCategory    │
│  ├─ Reservation              │
│  ├─ Review, Wishlist         │
│  ├─ Notification, Subscription│
│  └─ Attachment, LegalContent │
└──────────────────────────────┘

SERVICIOS EXTERNOS:

┌──────────────────────────────┐
│   Brevo SMTP (Email)         │
│                              │
│  sendVerificationEmail()     │
│  sendWelcomeEmail()          │
│  mailService.js              │
└──────────────────────────────┘

┌──────────────────────────────┐
│   Vercel Blob (Storage)      │
│                              │
│  uploadToBlob()              │
│  deleteFromBlob()            │
│  blobService.js              │
└──────────────────────────────┘
```

---

## TABLA 3: DEPENDENCIAS CLAVE

### Backend Dependencies

```json
{
  "@prisma/client": "^5.22.0"          // ORM
  "express": "^4.18.2"                 // Web framework
  "jsonwebtoken": "^9.0.2"             // JWT
  "bcryptjs": "^2.4.3"                 // Password hashing
  "cors": "^2.8.5"                     // CORS middleware
  "multer": "^2.0.2"                   // File upload
  "axios": "^1.13.2"                   // HTTP client (Brevo)
  "@vercel/blob": "^2.0.0"             // Blob storage
  "pg": "^8.11.3"                      // PostgreSQL driver
  "dotenv": "^16.3.1"                  // ENV vars
}
```

### Frontend Dependencies

```json
{
  "react": "^18.2.0"                   // UI framework
  "react-dom": "^18.2.0"               // DOM rendering
  "react-router-dom": "^6.22.0"        // Routing
  "lucide-react": "^0.344.0"           // Icons
  "vite": "^5.1.4"                     // Build tool
}
```

### DevDependencies

```json
{
  "prisma": "^5.x"                     // ORM CLI
  "nodemon": "^3.0.2"                  // Dev auto-reload
  "@vitejs/plugin-react": "^4.2.1"     // React plugin
  "serve": "^14.2.1"                   // Static server
}
```

---

## TABLA 4: VARIABLES DE ENTORNO

### Producción (.env.production)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# JWT
JWT_SECRET=<random_secret_64_chars>

# Email Service (Brevo)
BREVO_API_KEY=<api_key>
BREVO_SENDER_EMAIL=citronellaclub@gmail.com

# File Storage (Vercel)
BLOB_READ_WRITE_TOKEN=<vercel_blob_token>

# Admin
STAFF_PASSWORD=<secure_password>

# Node
NODE_ENV=production
```

### Desarrollo (.env.local)
```bash
DATABASE_URL=postgresql://localhost/citro_dev
JWT_SECRET=dev_secret_do_not_use_in_prod
BREVO_API_KEY=<test_key>
BREVO_SENDER_EMAIL=test@example.com
BLOB_READ_WRITE_TOKEN=<test_token>
STAFF_PASSWORD=dev_password
NODE_ENV=development
```

---

## TABLA 5: MIGRACIONES DE PRISMA

```bash
# Historial de migraciones
migrations/
├── migration_lock.toml
├── 20260116214103_add_gtl_fields/          # Cambios marketplace
└── 20260116214422_add_wishlist_and_reviews/ # Wishlist + reviews
```

**Cambios recientes:**
1. Adición de campos GTL (Marketplace)
2. Sistema de Wishlist
3. Sistema de Reviews

**Ejecutar migraciones:**
```bash
npm run db:push          # Push cambios a DB
npm run db:studio       # Abrir Prisma Studio (GUI)
```

---

## TABLA 6: SCRIPTS DE MANTENIMIENTO

| Script | Propósito | Comando |
|--------|----------|---------|
| `add-missing-fields.js` | Añadir campos faltantes | `npm run db:add-fields` |
| `cleanup-test-users.js` | Limpiar usuarios de prueba | (manual) |
| `comprehensive-healthcheck.js` | Diagnóstico completo | `npm run db:health` |
| `create-test-user.js` | Crear usuario de test | `npm run db:test-user` |
| `db-healthcheck.js` | Health check de DB | `npm run db:sync` |
| `delete-all-users.js` | ⚠️ Borrar TODOS los usuarios | (manual) |
| `diagnose-auth.js` | Diagnóstico de autenticación | (manual) |
| `fix-missing-emails.js` | Corregir emails faltantes | `npm run db:fix-emails` |
| `maintenance.js` | Tareas de mantenimiento | `npm run db:maintenance` |
| `remove-duplicates.js` | Limpiar duplicados | (manual) |
| `reset-db.js` | ⚠️ Reset completo | `npm run db:reset` |
| `verify-users.js` | Verificar integridad usuarios | (manual) |

---

## TABLA 7: MAPEO RUTAS → CONTROLLERS

| Ruta | Controller | Función | Línea |
|------|-----------|---------|-------|
| `GET /api/auth/me` | authController.js | `getMe()` | 211 |
| `POST /api/auth/register` | authController.js | `register()` | 31 |
| `POST /api/auth/login` | authController.js | `login()` | 135 |
| `GET /api/crops` | cropController.js | `getCrops()` | 38 |
| `POST /api/crops` | cropController.js | `createCrop()` | 51 |
| `POST /api/crops/:id/logs` | cropController.js | `addLog()` | 81 |
| `GET /api/market` | marketController.js | `getProducts()` | 5 |
| `POST /api/market` | marketController.js | `createProduct()` | 100 |
| `POST /api/orders` | orderController.js | `createOrder()` | 4 |
| `GET /api/forum` | forumController.js | `getPosts()` | 4 |
| `POST /api/forum` | forumController.js | `createPost()` | 41 |
| `GET /api/events` | eventsController.js | `getEvents()` | 4 |
| `POST /api/admin/verify` | adminController.js | `verifyStaff()` | 3 |

---

## TABLA 8: COMPLEJOS ALGORITMOS / LÓGICA ESPECIAL

### 1. **Cálculo de Salud del Cultivo** (`cropController.js`)
```javascript
function calculateHealthAndAdvice(ph, ec, phase) {
  // Lógica:
  // 1. Evaluar pH (rango ideal 5.8-6.2)
  // 2. Evaluar EC según fase
  // 3. Retornar status (Verde/Amarillo/Rojo) + feedback
  
  return { status, feedback }
}
```
**Ubicación:** `server/controllers/cropController.js` líneas 13-37

### 2. **Transacción Atómica de Orden** (`orderController.js`)
```javascript
const result = await prisma.$transaction(async (tx) => {
  // 1. Validar productos
  // 2. Validar stock y saldo
  // 3. Transferencias de tokens (all-or-nothing)
  // 4. Crear Order + OrderItems
})
```
**Ubicación:** `server/controllers/orderController.js` líneas 4-95

### 3. **Búsqueda Filtrada de Productos** (`marketController.js`)
```javascript
const where = {
  status: 'Active',
  ...(category && category !== 'Todos' ? { category } : {}),
  ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  ...(minPrice || maxPrice ? { price: { gte, lte } } : {}),
  ...(isVerified === 'true' ? { seller: { isVerified: true } } : {}),
  ...(wishlistedOnly === 'true' ? { wishlistedBy: { some: { userId } } } : {})
}
```
**Ubicación:** `server/controllers/marketController.js` líneas 23-33

### 4. **Verificación de Email con Brevo** (`mailService.js`)
```javascript
async function sendEmail({ to, subject, htmlContent }) {
  // 1. Validar parámetros
  // 2. Llamar Brevo SMTP API
  // 3. Manejo robusto de errores (no lanzar 500s)
  
  return { success: true/false, error?: string }
}
```
**Ubicación:** `server/services/mailService.js` líneas 13-92

---

## TABLA 9: CONFIGURACIÓN DE DESPLIEGUE

### vercel.json
```json
{
  "version": 2,
  "outputDirectory": "frontend/dist",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/index.js": {
      "maxDuration": 10,
      "includeFiles": "server/**"
    }
  }
}
```

### nodemon.json
```json
{
  "watch": ["server", "config"],
  "ignore": ["server/**/*.test.js"],
  "ext": "js",
  "env": {
    "NODE_ENV": "development"
  }
}
```

---

## TABLA 10: CHECKLIST DE DESPLIEGUE

### Pre-Deploy
- [ ] `npm run build` pasa sin errores
- [ ] `npm test` pasa (cuando existan tests)
- [ ] Lint sin warnings
- [ ] Variables de entorno configuradas en Vercel
- [ ] Database migrations ejecutadas
- [ ] CORS configurado correctamente

### Post-Deploy
- [ ] `GET /api/health` retorna status ok
- [ ] Login funciona
- [ ] Crear cultivo funciona
- [ ] Marketplace carga productos
- [ ] Emails se envían correctamente
- [ ] Blob uploads funcionan
- [ ] Admin panel accesible

### Monitoreo
- [ ] Sentry conectado para error tracking
- [ ] Logs visible en Vercel
- [ ] Database performance OK
- [ ] No hay N+1 queries
- [ ] Rate limiting activo

---

## CONCLUSIONES

Este proyecto ha alcanzado un **MVP Fullstack robusto** con:
- ✅ 7 módulos funcionales
- ✅ 30+ endpoints implementados
- ✅ Sistema de tokens trabajando
- ✅ Infraestructura escalable

**Prioridades para continuar:**
1. Implementar testing
2. Añadir rate limiting y validación
3. Deprecar frontend legacy
4. Implementar logging centralizado
5. Optimizar con caching

---

**Documento generado automáticamente el 23 de Enero, 2026**
