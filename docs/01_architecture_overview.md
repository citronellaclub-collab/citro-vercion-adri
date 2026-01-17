# Citro Web 2.0 - Architecture Overview

## Stack Tecnológico Completo

### Frontend

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.4.21
- **Routing**: React Router DOM 6.22.0
- **Icons**: Lucide React 0.344.0
- **Styling**: Vanilla CSS con variables CSS personalizadas

### Backend

- **Runtime**: Node.js 24.13.0
- **Framework**: Express 4.18.2
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL (Producción) / SQLite (Desarrollo)
- **Authentication**: JSON Web Tokens (JWT) 9.0.2
- **Password Hashing**: bcryptjs 2.4.3
- **File Upload**: Multer 2.0.2
- **HTTP Client**: Axios (para Brevo API)

### Servicios Externos

- **Email**: Brevo API (Correos transaccionales)
- **Storage**: Vercel Blob (Almacenamiento de imágenes)
- **Database Host**: Easypanel (PostgreSQL)

### DevOps & Tooling

- **Process Manager**: Nodemon 3.0.2
- **Concurrent Execution**: Concurrently 9.2.1
- **CORS**: cors 2.8.5
- **Environment Variables**: dotenv 16.3.1

---

## Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React SPA (Vite)                                       │ │
│  │  - AuthContext (Estado Global)                          │ │
│  │  - React Router (Navegación)                            │ │
│  │  - Componentes UI                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
                       │ (Fetch API)
┌──────────────────────▼──────────────────────────────────────┐
│                  SERVIDOR (Node.js + Express)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                       │ │
│  │  - CORS                                                 │ │
│  │  - JWT Authentication                                   │ │
│  │  - Multer (File Upload)                                 │ │
│  │  - Error Handler                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes Layer                                           │ │
│  │  - /api/auth (Authentication)                           │ │
│  │  - /api/crops (Mi Cultivo)                              │ │
│  │  - /api/market (Marketplace)                            │ │
│  │  - /api/forum (Foro)                                    │ │
│  │  - /api/events (Eventos)                                │ │
│  │  - /api/admin (Panel Staff)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers Layer                                      │ │
│  │  - authController                                       │ │
│  │  - cropController                                       │ │
│  │  - marketController                                     │ │
│  │  - forumController                                      │ │
│  │  - eventsController                                     │ │
│  │  - adminController                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services Layer                                         │ │
│  │  - mailService (Brevo API)                              │ │
│  │  - blobService (Vercel Blob)                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Data Access Layer (Prisma ORM)                         │ │
│  │  - User, Post, Product, Event, etc.                     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              BASE DE DATOS (PostgreSQL)                      │
│  - Tablas: User, Crop, Product, Order, Post, Event, etc.    │
│  - Índices: username, email, verificationToken              │
│  - Relaciones: 1:N, N:M con tablas intermedias              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  SERVICIOS EXTERNOS                          │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Brevo API      │  │  Vercel Blob    │                   │
│  │  (Emails)       │  │  (Storage)      │                   │
│  └─────────────────┘  └─────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos Cliente-Servidor

### 1. Autenticación (Login)

```
Cliente                    Servidor                  Base de Datos
  │                          │                            │
  │──POST /api/auth/login──→│                            │
  │  {username, password}    │                            │
  │                          │──findUnique(username)────→│
  │                          │←─────User data────────────│
  │                          │                            │
  │                          │ (bcrypt.compare)           │
  │                          │ (jwt.sign)                 │
  │                          │                            │
  │←─────{token, user}───────│                            │
  │                          │                            │
  │ localStorage.setItem     │                            │
  │ ('token', data.token)    │                            │
```

### 2. Petición Protegida

```
Cliente                    Middleware                Controller
  │                          │                            │
  │──GET /api/crops────────→│                            │
  │  Header: Authorization   │                            │
  │  Bearer <token>          │                            │
  │                          │ jwt.verify(token)          │
  │                          │ req.user = decoded         │
  │                          │                            │
  │                          │──────────────────────────→│
  │                          │                            │
  │                          │                            │ Prisma query
  │←─────────────────────────────────{crops}──────────────│
```

### 3. Upload de Archivos

```
Cliente                    Multer                    Blob Service
  │                          │                            │
  │──POST /api/forum────────→│                            │
  │  FormData:               │                            │
  │  - title                 │ multer.array()             │
  │  - content               │ req.files                  │
  │  - attachments[]         │                            │
  │                          │──uploadToBlob()──────────→│
  │                          │←─────URL──────────────────│
  │                          │                            │
  │                          │ Prisma.create({            │
  │                          │   attachments: [urls]      │
  │                          │ })                         │
  │←─────{post}──────────────│                            │
```

---

## Gestión de Variables de Entorno

### Archivo `.env` (Raíz del Proyecto)

```env
# Servidor
PORT=3000

# Base de Datos
DATABASE_URL="postgres://user:pass@host:port/db?sslmode=disable"

# Seguridad
JWT_SECRET="clave_secreta_jwt"
STAFF_PASSWORD="clave_maestra_admin"

# Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_token"

# Email (Brevo)
BREVO_API_KEY="api_key_brevo"
BREVO_SENDER_EMAIL="noreply@citronellaclub.com"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

### Carga de Variables

**Backend** (`server/server.js`):

```javascript
require('dotenv').config();
// Variables disponibles en process.env
```

**Frontend** (Vite):

- Variables con prefijo `VITE_` son accesibles en `import.meta.env`
- No se usan variables de entorno en frontend por seguridad
- Configuración en `vite.config.js` (proxy)

---

## Proxy de Desarrollo

### Configuración Vite (`frontend/vite.config.js`)

```javascript
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
```

**Beneficios**:

- Evita problemas de CORS en desarrollo
- Frontend (`localhost:5173`) → Backend (`localhost:3000`)
- Transparente para el código del cliente

---

## Estructura de Directorios

```
citro-web-2.0/
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── context/         # AuthContext (estado global)
│   │   ├── pages/           # Páginas/Rutas
│   │   ├── styles/          # CSS global
│   │   ├── App.jsx          # Router principal
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── controllers/         # Lógica de negocio
│   ├── routes/              # Definición de endpoints
│   ├── services/            # Servicios externos (email, blob)
│   ├── utils/               # Utilidades
│   ├── auth.js              # Middleware JWT
│   └── server.js            # Entry point
├── config/
│   └── db.js                # Prisma Client singleton
├── prisma/
│   └── schema.prisma        # Definición de modelos
├── docs/                    # Documentación técnica
├── .env                     # Variables de entorno
├── .env.example             # Plantilla de variables
└── package.json             # Dependencias raíz
```

---

## Flujo de Desarrollo

### Modo Desarrollo

```bash
# Terminal 1: Backend
npm run dev
# Ejecuta: nodemon server/server.js
# Puerto: 3000

# Terminal 2: Frontend
cd frontend && npm run dev
# Ejecuta: vite
# Puerto: 5173
```

### Modo Producción

```bash
# Build frontend
cd frontend && npm run build
# Genera: frontend/dist/

# Deploy backend (Vercel/Railway)
# Variables de entorno configuradas en plataforma
# NODE_ENV=production
```

---

## Seguridad

### JWT Authentication

- **Generación**: `jwt.sign({ id, role, isDev }, JWT_SECRET, { expiresIn: '24h' })`
- **Verificación**: Middleware `auth.js` valida token en cada petición protegida
- **Payload**: `{ id, role, isDev }`
- **Storage**: `localStorage` (cliente)

### Password Hashing

- **Algoritmo**: bcrypt (10 rounds)
- **Registro**: `bcrypt.hash(password, 10)`
- **Login**: `bcrypt.compare(password, hash)`

### CORS

```javascript
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
```

---

## Escalabilidad

### Consideraciones Actuales

1. **Database Connection Pooling**: Prisma maneja automáticamente
2. **Stateless Authentication**: JWT permite escalado horizontal
3. **File Storage**: Vercel Blob (CDN global)
4. **Email Service**: Brevo (rate limits manejados)

### Próximas Mejoras

- [ ] Redis para caché de sesiones
- [ ] Rate limiting por IP
- [ ] Compresión de respuestas (gzip)
- [ ] CDN para assets estáticos
- [ ] Monitoreo con Sentry/LogRocket

---

## Deployment

### Backend (Vercel/Railway)

1. Configurar variables de entorno
2. `npm run build` (genera Prisma Client)
3. Deploy automático desde Git

### Frontend (Vercel/Netlify)

1. `cd frontend && npm run build`
2. Deploy carpeta `dist/`
3. Configurar rewrites para SPA

### Database (Easypanel)

- PostgreSQL 14+
- Backups automáticos
- SSL habilitado

---

## Monitoreo y Logs

### Backend Logs

```javascript
console.log('[AUTH] Usuario autenticado:', username);
console.error('[EMAIL ERROR]', error.message);
```

### Frontend Error Boundary

```javascript
<ErrorBoundary>
    <App />
</ErrorBoundary>
```

---

## Versión Actual

**Citro Web 2.0** - v1.0.0

- Última actualización: Enero 2026
- Estado: Producción
