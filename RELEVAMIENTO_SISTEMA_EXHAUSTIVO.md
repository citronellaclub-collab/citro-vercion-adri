# RELEVAMIENTO EXHAUSTIVO DEL SISTEMA - Cultivo Virtual MVP

**Fecha:** 23 de Enero, 2026  
**Versión:** 1.0.1  
**Estado:** MVP Fullstack funcional

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Visión y Objetivos del Producto](#visión-y-objetivos-del-producto)
3. [Arquitectura Técnica](#arquitectura-técnica)
4. [Modelo de Datos](#modelo-de-datos)
5. [Funcionalidades Implementadas](#funcionalidades-implementadas)
6. [Stack Tecnológico](#stack-tecnológico)
7. [Endpoints de API](#endpoints-de-api)
8. [Estructura del Proyecto](#estructura-del-proyecto)
9. [Flujos de Usuario Principales](#flujos-de-usuario-principales)
10. [Sistema de Tokens (Economía Virtual)](#sistema-de-tokens-economía-virtual)
11. [Estado Actual vs. Pendiente](#estado-actual-vs-pendiente)
12. [Problemas Conocidos](#problemas-conocidos)
13. [Recomendaciones](#recomendaciones)

---

## 📌 RESUMEN EJECUTIVO

**Cultivo Virtual** es una plataforma web **gamificada** para entusiastas de la hidroponía y jardineros novatos. Combina simulación técnica de cultivos con un **marketplace comunitario** y un **sistema de tokens virtual** para incentivar la participación.

### Logros Principales
- ✅ **Migración completa** de SPA estática a arquitectura **Fullstack Cliente-Servidor**
- ✅ **Base de datos persistente** con PostgreSQL y ORM Prisma
- ✅ **Sistema de autenticación** robusto (JWT + Bcrypt)
- ✅ **Interfaz moderna** con Dark Mode nativo
- ✅ **Infraestructura en nube** lista para producción (Vercel + Easypanel + Brevo)
- ✅ **MVP funcional** con 7 módulos principales

### Estado General
- **Núcleo Backend:** 85% funcional
- **Frontend Core:** 70% funcional
- **Integraciones:** 90% configurado
- **Testing/Validación:** Pendiente

---

## 🎯 VISIÓN Y OBJETIVOS DEL PRODUCTO

### Declaración de Visión
Para entusiastas de la hidroponía que buscan aprender y gestionar sus cultivos de forma **lúdica y eficiente**.

**Diferenciador clave:** Un **ecosistema persistente y gamificado** donde el éxito del cultivo se traduce en:
- 📊 **Reputación** del usuario
- 💰 **Moneda virtual** (Tokens GTL)
- 🏆 **Estatus dentro de la comunidad**

### Personas Target
1. **El Novato Curioso**
   - Quiere aprender sin invertir dinero real
   - Busca interacción social y gamificación
   
2. **El Grower Metódico**
   - Necesita herramientas para rastrear parámetros técnicos (pH, EC, nutrientes)
   - Valida su conocimiento en la comunidad

### Objetivos de Negocio (MVP)
- 🎯 **Validar retención:** Que usuarios registren datos semanalmente
- 💱 **Probar economía:** Sistema de Tokens sea atractivo y balanceado
- 🔧 **Estabilidad:** Base de datos robusta en nube (✅ **LOGRADO**)

---

## 🏗️ ARQUITECTURA TÉCNICA

### Diagrama General
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  React 18 + React Router + Lucide Icons                         │
│  AuthContext | State Management | Local Storage                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST (Fetch API)
                         │ JWT Authorization Header
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SERVIDOR (Node.js + Express)                    │
│  - Autenticación (JWT + Bcrypt)                                 │
│  - Controllers (Auth, Crop, Market, Forum, Orders, Events)      │
│  - Middleware (Auth Protection, Error Handling)                 │
│  - Servicios (Mail via Brevo, Blob Storage via Vercel)          │
└────────────────────────┬────────────────────────────────────────┘
                         │ Prisma ORM
                         │ Connection Pooling
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              BASE DE DATOS (PostgreSQL en Easypanel)            │
│  13 Modelos: User, Crop, CropLog, Product, Order, Post, etc.   │
└─────────────────────────────────────────────────────────────────┘

SERVICIOS EXTERNOS:
├─ Brevo (Email Verification) - SMTP
└─ Vercel Blob Storage (Imágenes) - CDN
```

### Patrón Arquitectónico
- **Patrón MVC:** Controllers + Routes + Servicios
- **Autenticación:** Middleware JWT en todas las rutas protegidas
- **Transacciones:** Prisma `$transaction` para operaciones críticas (Marketplace)
- **Almacenamiento de archivos:** Vercel Blob (Público, acceso directo)

### Despliegue
- **Frontend:** Vite Build → Vercel (SPA)
- **Backend:** Node.js → Vercel Serverless (10s timeout)
- **Database:** PostgreSQL → Easypanel
- **Configuración:** Vercel `vercel.json` con rewrites y function mapping

---

## 🗄️ MODELO DE DATOS

### Diagrama Entidad-Relación (ERD)

```
User (Central)
├── 1:N → Crop (Cultivos del usuario)
│        └── 1:N → CropLog (Bitácoras semanales)
├── 1:N → Product (Publicaciones en marketplace como vendedor)
├── 1:N → Order (Compras realizadas como comprador)
├── 1:N → Post (Publicaciones en foro)
├── 1:N → Comment (Comentarios en posts)
├── 1:N → Wishlist (Lista de deseados)
├── 1:N → Notification (Notificaciones personales)
├── 1:N → Subscription (Suscripciones a posts)
├── 1:N → Reaction (Reacciones a posts)
├── 1:N → Review (Reviews dejadas como comprador)
└── 1:N → Reservation (Reservas de tickets a eventos)

Product
├── 1:N → OrderItem (Líneas en órdenes de compra)
├── 1:N → Wishlist
├── 1:N → Review
└── N:1 → User (Vendedor)

Order
├── 1:N → OrderItem (Detalles del pedido)
└── 1:1 → Review (Review del pedido)

Post (Forum)
├── 1:N → Comment
├── 1:N → Attachment (Documentos adjuntos)
├── 1:N → Subscription (Usuarios suscritos)
└── 1:N → Reaction (Reacciones: Interesante, Útil, Científico)

Event
└── 1:N → TicketCategory
       └── 1:N → Reservation (Tickets vendidos)
```

### Descripción de Modelos Principales

#### **User**
```prisma
model User {
  id                    Int      @id @default(autoincrement())
  username              String   @unique
  password              String   (bcrypt hash)
  email                 String?
  role                  String   @default("USER")  // USER, ADMIN
  isDev                 Boolean  @default(false)   // Bypass dev
  tokens                Int      @default(100)     // Moneda virtual
  isVerified            Boolean  @default(false)   // Email verificado
  emailVerified         Boolean  @default(false)
  verificationToken     String?  // Token único para verificación
  lastVerificationSent  DateTime?
  
  // Relaciones (1:N)
  crops                 Crop[]
  buyerOrders           Order[]  @relation("BuyerOrders")
  sellerProducts        Product[] @relation("SellerProducts")
  sellerReviews         Review[] @relation("SellerReviews")
  posts                 Post[]
  comments              Comment[]
  wishlist              Wishlist[]
  notifications         Notification[]
  subscriptions         Subscription[]
  reactions             Reaction[]
  reservations          Reservation[]
}
```
**Notas:**
- `tokens`: Sistema de gamificación. Se transfieren en marketplace
- `isDev`: Bypass especial para desarrolladores (acceso sin DB si es necesario)
- `emailVerified`: Distinct de `isVerified`. Uno es técnico, otro es de negocio

#### **Crop**
```prisma
model Crop {
  id        Int       @id @default(autoincrement())
  bucketName String   // Nombre descriptivo (ej: "Cultivo 1")
  imageUrl  String?   // Foto del contenedor
  status    String    @default("Verde")  // Verde, Amarillo, Rojo
  userId    Int
  user      User      @relation(fields: [userId], references: [id])
  logs      CropLog[]
  createdAt DateTime  @default(now())
}
```

#### **CropLog**
```prisma
model CropLog {
  id        Int      @id @default(autoincrement())
  week      String   // "Semana 1", "Semana 2", etc
  phase     String   @default("Vegetación") // Germinación, Vegetación, Floración, Senescencia
  ph        Float    // 0-14, rango óptimo: 5.8-6.2
  ec        Float    // EC (Electrical Conductivity)
  grow      Float    @default(0)  // dosis de nutriente base
  micro     Float    @default(0)  // dosis de micronutrientes
  bloom     Float    @default(0)  // dosis de floración
  notes     String?
  imageUrl  String?  // Foto del cultivo en esa semana
  feedback  String?  // Análisis automático generado
  cropId    Int
  crop      Crop     @relation(fields: [cropId], references: [id])
  createdAt DateTime @default(now())
}
```
**Lógica de Feedback Automático:**
- pH ideal: 5.8-6.2 (Rojo si <5.0 o >7.0)
- EC rangos por fase:
  - Germinación: 0.4-0.8
  - Vegetación: 1.2-1.6
  - Floración: 1.8-2.2
  - Senescencia: 1.0-1.4

#### **Product (Marketplace)**
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  category    String   // "Flores", "Parafernalia", "Genéticas"
  price       Int      // Tokens
  basePrice   Int      // Precio original (para cálculo de descuentos)
  stock       Int
  imageUrl    String?  // Vercel Blob
  sellerId    Int
  seller      User     @relation("SellerProducts", fields: [sellerId])
  status      String   @default("Active") // Active, Paused, SoldOut
  orderItems  OrderItem[]
  wishlistedBy Wishlist[]
  reviews     Review[]
  createdAt   DateTime @default(now())
}
```

#### **Order & OrderItem**
```prisma
model Order {
  id          Int      @id @default(autoincrement())
  buyerId     Int
  buyer       User     @relation("BuyerOrders", fields: [buyerId])
  items       OrderItem[]
  totalPrice  Int      // Total en tokens
  status      String   @default("Pendiente") // Pendiente, Entregado, Cancelado
  review      Review?  // Una review por orden
  createdAt   DateTime @default(now())
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  orderId   Int
  order     Order   @relation(fields: [orderId])
  productId Int
  product   Product @relation(fields: [productId])
  quantity  Int     @default(1)
  price     Int     // Capturado al momento de compra
}
```

#### **Post (Forum)**
```prisma
model Post {
  id             Int      @id @default(autoincrement())
  title          String
  content        String   // Markdown o HTML
  category       String   // Clases, Investigaciones, FAQ, Debates, Papers, Noticias, Anuncios
  youtubeLink    String?  // Incrustación de videos
  fileUrl        String?  // Documento principal (Vercel Blob)
  authorId       Int
  author         User     @relation(fields: [authorId])
  likes          Int      @default(0)
  attachments    Attachment[]
  subscriptions  Subscription[]
  reactions      Reaction[]  // Tipo: Interesante, Útil, Científico
  isPinned       Boolean  @default(false)
  isImmutable    Boolean  @default(false)  // No puede editarse
  createdAt      DateTime @default(now())
  comments       Comment[]
}
```

#### **Event & Reservation**
```prisma
model Event {
  id           Int      @id @default(autoincrement())
  title        String
  description  String
  date         DateTime
  time         String   // "18:30"
  location     String
  requirements String?
  flyerUrl     String?  // Poster del evento
  capacity     Int      @default(50)
  categories   TicketCategory[]
  createdAt    DateTime @default(now())
}

model TicketCategory {
  id           Int      @id @default(autoincrement())
  eventId      Int
  event        Event    @relation(fields: [eventId])
  name         String   // General, VIP, Socio
  price        Int      // Tokens
  benefits     String?
  reservations Reservation[]
}

model Reservation {
  id         Int      @id @default(autoincrement())
  userId     Int
  user       User     @relation(fields: [userId])
  categoryId Int
  category   TicketCategory @relation(fields: [categoryId])
  qrCode     String?  // Simulado (no generado en MVP)
  createdAt  DateTime @default(now())
}
```

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. **Autenticación y Usuarios**
- ✅ Registro con validación (username 6+, password 6+, email opcional)
- ✅ Login con JWT (24h expiration)
- ✅ Email verification con Brevo
- ✅ Resend verification token
- ✅ Perfil de usuario (`/api/auth/me`)
- ✅ Sistema de roles (USER, ADMIN)
- ✅ Bypass dev para desarrolladores (isDev flag)

**Endpoints:**
```
POST   /api/auth/register      - Crear cuenta
POST   /api/auth/login         - Obtener JWT
GET    /api/auth/me            - Datos del usuario autenticado
PUT    /api/auth/update-email  - Cambiar email
POST   /api/auth/resend-verification - Reenviar token
GET    /api/auth/verify/:token - Verificar email por token
```

### 2. **Mi Cultivo (Dashboard)**
- ✅ Crear cultivos (con imagen)
- ✅ Añadir bitácoras semanales (pH, EC, nutrientes)
- ✅ Visualizar historial de logs
- ✅ Feedback automático basado en parámetros
- ✅ Cálculo de estado del cultivo (Verde/Amarillo/Rojo)
- ✅ Gráficos de tendencias (Trends)
- ✅ Eliminar cultivos y logs

**Endpoints:**
```
GET    /api/crops              - Listar cultivos del usuario
POST   /api/crops              - Crear nuevo cultivo (con imagen)
DELETE /api/crops/:id          - Eliminar cultivo
POST   /api/crops/:id/logs     - Añadir bitácora semanal
GET    /api/crops/:id/logs     - Ver historial de logs
DELETE /api/logs/:id           - Eliminar un log específico
```

### 3. **Marketplace (GTL)**
- ✅ Explorar productos con filtros (categoría, precio, búsqueda)
- ✅ Publicar productos como vendedor
- ✅ Editar productos
- ✅ Sistema de wishlist
- ✅ Cálculo de reputación (ratings de reviews)
- ✅ Stock management
- ✅ Mostrar ofertas (precio < basePrice)

**Endpoints:**
```
GET    /api/market             - Listar productos (con filtros)
POST   /api/market             - Publicar producto
PUT    /api/market/:id         - Editar producto
DELETE /api/market/:id         - Eliminar producto
GET    /api/market/my-sales    - Mis publicaciones
POST   /api/market/wishlist    - Agregar/quitar de wishlist
GET    /api/notifications      - Notificaciones del usuario
POST   /api/notifications/read - Marcar leído
```

### 4. **Pedidos (Orders)**
- ✅ Crear órdenes (carrito → transacción atómica)
- ✅ Validación de stock y saldo
- ✅ Transferencia de tokens (comprador → vendedor)
- ✅ Historial de compras
- ✅ Historial de ventas
- ✅ Sistema de reviews

**Endpoints:**
```
POST   /api/orders             - Crear orden (transacción Prisma)
GET    /api/orders             - Mi historial de compras
GET    /api/orders/sales       - Mi historial de ventas
POST   /api/orders/:id/review  - Dejar review de una orden
```

### 5. **Foro (Forum)**
- ✅ Crear posts con múltiples categorías
- ✅ Adjuntar archivos (hasta 5 por post)
- ✅ Comentarios en posts
- ✅ Sistema de suscripciones (notificaciones)
- ✅ Reacciones (Interesante, Útil, Científico)
- ✅ Búsqueda y filtro por categoría
- ✅ Posts inmovilizados (isPinned)
- ✅ Posts inmutables (no editables)

**Endpoints:**
```
GET    /api/forum              - Listar posts
POST   /api/forum              - Crear post (con attachments)
DELETE /api/forum/:id          - Eliminar post (solo autor)
POST   /api/forum/:id/comment  - Comentar
POST   /api/forum/:id/subscribe - Suscribirse/desuscribirse
POST   /api/forum/:id/react    - Reaccionar
GET    /api/forum/subscriptions - Mis suscripciones
```

### 6. **Eventos (Events)**
- ✅ Crear eventos con categorías de tickets
- ✅ Múltiples tipos de tickets (General, VIP, Socio)
- ✅ Reservar tickets
- ✅ QR simulado
- ✅ Listar mis reservaciones

**Endpoints:**
```
GET    /api/events             - Listar eventos
POST   /api/events             - Crear evento (con flyer)
POST   /api/events/reserve     - Reservar ticket
GET    /api/events/my-reservations - Mis tickets
```

### 7. **Admin Panel**
- ✅ Verificación de staff (password-based)
- ✅ Gestión de tokens de usuarios
- ✅ Gestión de contenido legal (T&C, Privacy)
- ✅ Listado de usuarios
- ✅ Moderación de posts

**Endpoints:**
```
POST   /api/admin/verify       - Convertir a ADMIN con password
GET    /api/admin/users        - Listar usuarios (admin only)
POST   /api/admin/tokens       - Añadir/restar/establecer tokens
POST   /api/admin/legal        - Actualizar T&C y Privacy
POST   /api/admin/forum/:postId - Moderar/eliminar posts
```

### 8. **Servicios Generales**
- ✅ Email verification vía Brevo SMTP
- ✅ Upload de imágenes a Vercel Blob
- ✅ Error handling centralizado
- ✅ Logging detallado en stdout
- ✅ CORS configurado

**Endpoints:**
```
POST   /api/upload             - Subir imagen (middleware)
GET    /api/health             - Health check
GET    /api/test               - Test endpoint
GET    /api/ping               - Ping
```

---

## 💻 STACK TECNOLÓGICO

### Frontend
| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|----------|
| Framework | React | 18.2.0 | SPA interactiva |
| Router | React Router DOM | 6.22.0 | Enrutamiento |
| Icons | Lucide React | 0.344.0 | Iconografía |
| Build Tool | Vite | 5.1.4 | Build moderno |
| Styling | CSS3 + Dark Mode | Vanilla | Diseño responsivo |

### Backend
| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|----------|
| Runtime | Node.js | 18+ | Ejecución JS |
| Framework | Express.js | 4.18.2 | REST API |
| Autenticación | JWT | 9.0.2 | Tokens seguros |
| Hashing | Bcrypt | 2.4.3 | Password hashing |
| Database | PostgreSQL | 12+ | Datos persistentes |
| ORM | Prisma | 5.22.0 | Query builder |
| Upload | Multer | 2.0.2 | File handling |
| Email | Brevo API | - | Envío de emails |
| CORS | cors | 2.8.5 | Cross-origin |

### Infraestructura
| Componente | Tecnología | Propósito |
|------------|-----------|----------|
| VCS | Git | Control de versiones |
| Dev Monitor | Nodemon | 3.0.2 | Auto-reload |
| Host Frontend | Vercel | SPA deployment |
| Host Backend | Vercel Serverless | API deployment |
| Database Host | Easypanel | PostgreSQL managed |
| File Storage | Vercel Blob | CDN público |
| Email Service | Brevo SMTP | Transactional email |

---

## 🔌 ENDPOINTS DE API

### Estructura Base
**Base URL:** `https://citro-web-2-0.vercel.app/api` (Producción)  
**Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

### Tabla Resumida de Endpoints

| Método | Endpoint | Autenticación | Propósito |
|--------|----------|---|----------|
| GET | `/health` | No | Health check del servidor |
| GET | `/test` | No | Test endpoint |
| GET | `/ping` | No | Ping |
| **AUTH** | | | |
| POST | `/auth/register` | No | Registrar usuario |
| POST | `/auth/login` | No | Login |
| GET | `/auth/me` | **SÍ** | Datos del usuario |
| PUT | `/auth/update-email` | **SÍ** | Cambiar email |
| POST | `/auth/resend-verification` | **SÍ** | Reenviar token |
| GET | `/auth/verify/:token` | No | Verificar email |
| **CROPS** | | | |
| GET | `/crops` | **SÍ** | Listar mis cultivos |
| POST | `/crops` | **SÍ** | Crear cultivo (multipart) |
| DELETE | `/crops/:id` | **SÍ** | Eliminar cultivo |
| POST | `/crops/:id/logs` | **SÍ** | Añadir log (multipart) |
| GET | `/crops/:id/logs` | **SÍ** | Ver logs del cultivo |
| DELETE | `/logs/:id` | **SÍ** | Eliminar log |
| **MARKET** | | | |
| GET | `/market` | **SÍ** | Explorar productos (con filtros) |
| GET | `/market/my-sales` | **SÍ** | Mis publicaciones |
| POST | `/market` | **SÍ** | Publicar producto (multipart) |
| PUT | `/market/:id` | **SÍ** | Editar producto |
| DELETE | `/market/:id` | **SÍ** | Eliminar producto |
| POST | `/market/wishlist` | **SÍ** | Toggle wishlist |
| GET | `/notifications` | **SÍ** | Notificaciones |
| POST | `/notifications/read` | **SÍ** | Marcar leído |
| **ORDERS** | | | |
| POST | `/orders` | **SÍ** | Crear orden |
| GET | `/orders` | **SÍ** | Mis compras |
| GET | `/orders/sales` | **SÍ** | Mis ventas |
| POST | `/orders/:id/review` | **SÍ** | Dejar review |
| **FORUM** | | | |
| GET | `/forum` | **SÍ** | Listar posts |
| POST | `/forum` | **SÍ** | Crear post (multipart) |
| DELETE | `/forum/:id` | **SÍ** | Eliminar post |
| POST | `/forum/:id/comment` | **SÍ** | Comentar |
| POST | `/forum/:id/subscribe` | **SÍ** | Toggle suscripción |
| POST | `/forum/:id/react` | **SÍ** | Reaccionar |
| GET | `/forum/subscriptions` | **SÍ** | Mis suscripciones |
| **EVENTS** | | | |
| GET | `/events` | **SÍ** | Listar eventos |
| POST | `/events` | **SÍ** | Crear evento (multipart) |
| POST | `/events/reserve` | **SÍ** | Reservar ticket |
| GET | `/events/my-reservations` | **SÍ** | Mis tickets |
| **UPLOAD** | | | |
| POST | `/upload` | **SÍ** | Subir imagen (multipart) |
| **ADMIN** | | | |
| POST | `/admin/verify` | **SÍ** | Verificar staff |
| GET | `/admin/users` | **SÍ** (admin) | Listar usuarios |
| POST | `/admin/tokens` | **SÍ** (admin) | Gestionar tokens |
| POST | `/admin/legal` | **SÍ** (admin) | Actualizar T&C |
| POST | `/admin/forum/:postId` | **SÍ** (admin) | Moderar posts |

---

## 📁 ESTRUCTURA DEL PROYECTO

```
citro-web-2.0/
├── api/
│   └── index.js                    # Entry point Vercel Serverless
├── client/                         # Frontend Estático LEGACY
│   ├── index.html
│   ├── login.html
│   ├── css/
│   │   ├── main.css
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js                 # Router legacy
│   │   ├── state.js               # State management legacy
│   │   ├── ui-utils.js
│   │   ├── catalogo.js
│   │   ├── dashboard.js
│   │   ├── licitaciones.js
│   │   ├── novedades.js
│   │   ├── pedidos.js
│   │   ├── perfil.js
│   │   ├── publicar.js
│   │   └── sidebar.js
│   ├── pages/
│   │   ├── ayuda.html
│   │   ├── dashboard.html
│   │   ├── foro.html
│   │   ├── gtl.html
│   │   ├── micultivo.html
│   │   ├── novedades.html
│   │   ├── pedidos.html
│   │   ├── perfil.html
│   │   ├── terminos.html
│   │   └── pruebas/
│   └── doccs/                     # Documentación legacy
├── config/
│   └── db.js                       # PrismaClient singleton
├── docs/                           # Documentación técnica
│   ├── README.md
│   ├── 01_architecture_overview.md
│   ├── 02_database_schema.md
│   ├── 03_backend_api_reference.md
│   ├── 04_frontend_documentation.md
│   ├── 05_business_rules_logic.md
│   ├── 06_verification_flow_brevo.md
│   ├── ESPECIFICACIONES_TECNICAS.md
│   ├── GUIA_USUARIO.md
│   ├── HISTORIAS_DE_USUARIO.md
│   ├── VISION_DEL_PRODUCTO.md
│   └── README.md
├── frontend/                       # Frontend Moderno (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Routes + ProtectedRoute
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # useAuth() hook
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Navbar + Sidebar
│   │   │   ├── ErrorBoundary.jsx   # Error handling
│   │   │   ├── HealthCheck.jsx     # API availability
│   │   │   ├── VerificationBanner.jsx
│   │   │   ├── VerificationGuard.jsx
│   │   │   ├── LogHistory.jsx      # Tabla de logs
│   │   │   ├── CropTrends.jsx      # Gráficos
│   │   │   └── auth/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Mi Cultivo
│   │   │   ├── Market.jsx          # GTL
│   │   │   ├── Forum.jsx           # Foro
│   │   │   ├── Login.jsx           # Auth
│   │   │   ├── Orders.jsx          # Pedidos
│   │   │   ├── Events.jsx          # Eventos
│   │   │   ├── AdminPanel.jsx      # Admin
│   │   │   ├── Profile.jsx         # Perfil
│   │   │   └── Terms.jsx           # T&C
│   │   └── styles/
│   └── dist/                       # Build output
├── prisma/
│   ├── schema.prisma               # Data models
│   ├── seed.js                     # Data seeding
│   ├── migrations/
│   │   └── (migration files)
│   └── migration_lock.toml
├── scripts/                        # Herramientas de mantenimiento
│   ├── add-missing-fields.js
│   ├── cleanup-test-users.js
│   ├── comprehensive-healthcheck.js
│   ├── create-test-user.js
│   ├── db-healthcheck.js
│   ├── delete-all-users.js
│   ├── diagnose-auth.js
│   ├── fix-missing-emails.js
│   ├── maintenance.js
│   ├── remove-duplicates.js
│   ├── reset-db.js
│   ├── verify-users.js
│   └── README.md
├── server/                         # Backend API
│   ├── server.js                   # Express app + middleware
│   ├── auth.js                     # JWT middleware
│   ├── controllers/
│   │   ├── authController.js       # Registro, Login, Verificación
│   │   ├── cropController.js       # Cultivos y logs
│   │   ├── marketController.js     # Marketplace
│   │   ├── orderController.js      # Compras
│   │   ├── forumController.js      # Foro
│   │   ├── eventsController.js     # Eventos
│   │   ├── adminController.js      # Administración
│   │   └── uploadController.js     # Upload
│   ├── routes/
│   │   ├── auth.js                 # /api/auth/*
│   │   └── api.js                  # /api/* (crops, market, etc.)
│   ├── services/
│   │   └── mailService.js          # Brevo SMTP
│   └── utils/
│       └── blobService.js          # Vercel Blob
├── package.json                    # Root dependencies
├── package-lock.json
├── .env                            # Environment variables (local)
├── .env.production                 # Env variables (production)
├── nodemon.json                    # Nodemon config
├── vercel.json                     # Vercel deployment config
└── README.md
```

### Archivos Clave
- **server/server.js**: Punto de entrada del servidor, monta rutas, middleware
- **server/auth.js**: Middleware JWT para proteger rutas
- **config/db.js**: Singleton de PrismaClient con logging
- **frontend/src/context/AuthContext.jsx**: Contexto global de autenticación
- **frontend/src/App.jsx**: Definición de rutas (ProtectedRoute)
- **prisma/schema.prisma**: Modelos de datos

---

## 🔄 FLUJOS DE USUARIO PRINCIPALES

### Flujo 1: Registro e Ingreso
```
1. Usuario: Ingresa a /login
2. Frontend: Renderiza formulario de registro
3. Usuario: Completa username, password, email (opcional)
4. Frontend: POST /api/auth/register
5. Backend:
   - Valida credenciales
   - Hash password con bcrypt
   - Crea user en DB con 100 tokens iniciales
   - Genera JWT (24h)
   - Si email: Envía verificación vía Brevo
6. Frontend: Guarda JWT en localStorage
7. Frontend: Redirige a /micultivo (Dashboard)
8. AuthContext: Fetches /api/auth/me y carga datos del usuario
```

### Flujo 2: Crear Cultivo
```
1. Usuario: Navega a /micultivo
2. Frontend: Renderiza Dashboard con lista de cultivos
3. Usuario: Clickea "Nuevo Cultivo" → Modal
4. Usuario: Ingresa nombre, selecciona imagen
5. Frontend: POST /api/crops (multipart/form-data)
6. Backend:
   - Verifica JWT
   - Sube imagen a Vercel Blob
   - Crea Crop en DB
   - Retorna crop object
7. Frontend: Refresh lista de cultivos
```

### Flujo 3: Registrar Bitácora Semanal
```
1. Usuario: Selecciona cultivo → "Añadir Log"
2. Frontend: Abre modal con formulario
3. Usuario: Ingresa semana, pH, EC, fase, nutrientes, notas, imagen
4. Frontend: POST /api/crops/:id/logs (multipart/form-data)
5. Backend:
   - Verifica propiedad del cultivo
   - Sube imagen del log
   - Calcula estado automático (Verde/Amarillo/Rojo)
   - Genera feedback basado en parámetros
   - Crea CropLog en DB
6. Frontend: Actualiza gráficos de tendencias y historial
```

### Flujo 4: Publicar Producto en Marketplace
```
1. Usuario: Navega a /gtl → "Mis Publicaciones" → "Nueva Publicación"
2. Frontend: Modal con campos (nombre, descripción, categoría, precio, imagen)
3. Usuario: Completa y selecciona imagen
4. Frontend: POST /api/market (multipart/form-data)
5. Backend:
   - Sube imagen
   - Crea Product en DB con sellerId = req.user.id
   - Inicia stock en 1 (default)
6. Frontend: Actualiza "Mis Publicaciones"
```

### Flujo 5: Comprar Producto (Transacción)
```
1. Usuario Comprador: Explora /gtl
2. Frontend: GET /api/market (con filtros)
3. Usuario: Selecciona producto → "Agregar al carrito"
4. Frontend: Acumula items en estado local
5. Usuario: "Finalizar compra"
6. Frontend: POST /api/orders { items: [{productId, quantity}] }
7. Backend (Prisma Transaction):
   - Valida stock de cada producto
   - Valida que vendedor ≠ comprador
   - Valida saldo de comprador
   - Descuenta tokens del comprador
   - Transfiere tokens a cada vendedor
   - Descuenta stock
   - Crea Order + OrderItems
8. Frontend: Muestra confirmación
9. Usuario puede dejar review en /pedidos
```

### Flujo 6: Crear Post en Foro
```
1. Usuario: Navega a /foro → "Nuevo Post"
2. Frontend: Modal con título, contenido, categoría, link YouTube, attachments
3. Usuario: Completa y selecciona hasta 5 archivos
4. Frontend: POST /api/forum (multipart/form-data)
5. Backend:
   - Crea Post en DB
   - Sube attachments a Vercel Blob
   - Crea Attachment records
   - Retorna post con adjuntos
6. Frontend: Refresh lista de posts
7. Otros usuarios: Pueden comentar, reaccionar, suscribirse
```

### Flujo 7: Email Verification
```
1. User registers con email
2. Backend genera token único (crypto.randomBytes + hash)
3. Brevo SMTP: Envía email con link /api/auth/verify/:token
4. Usuario: Clickea link
5. Backend: GET /api/auth/verify/:token
   - Busca user por verificationToken
   - Si existe: marca emailVerified = true, borra token
   - Retorna éxito/error
6. Frontend: Muestra confirmación
```

---

## 💰 SISTEMA DE TOKENS (ECONOMÍA VIRTUAL)

### Distribución Inicial
- **Usuarios nuevos:** 100 tokens
- **Bonus por acciones:** (TBD en próximas fases)

### Flujos de Tokens

#### **Ingresos**
| Evento | Tokens | Notas |
|--------|--------|-------|
| Registro | +100 | Inicial |
| Vender producto | +X | Precio del producto |
| Review positiva | TBD | Gamificación futura |

#### **Egresos**
| Evento | Tokens | Notas |
|--------|--------|-------|
| Comprar producto | -X | Precio del producto |
| Operaciones futuras | TBD | Por definir |

### Implementación
- Moneda almacenada en `User.tokens` (Int)
- Transacciones atómicas en endpoint `/api/orders` usando Prisma `$transaction`
- No hay historial de transacciones (simple cuenta corriente)
- Admin puede ajustar tokens vía `/api/admin/tokens`

---

## 📊 ESTADO ACTUAL VS. PENDIENTE

### Implementado ✅

#### Backend
- [x] Autenticación JWT + Email verification
- [x] CRUD Cultivos + Logs
- [x] Marketplace completo (explorar, publicar, filtrar)
- [x] Sistema de transacciones (Orders)
- [x] Foro con comments + subscriptions + reactions
- [x] Eventos + reservas de tickets
- [x] Admin panel
- [x] Servicios (Mail, Blob Storage)
- [x] Error handling y logging
- [x] Middleware seguridad

#### Frontend (React)
- [x] AuthContext (login, logout, user state)
- [x] ProtectedRoute component
- [x] Dashboard (Mi Cultivo) con gráficos
- [x] Marketplace explore + mis publicaciones
- [x] Orders (historial compras/ventas)
- [x] Forum basic
- [x] Events listing
- [x] Admin panel
- [x] Layout (Navbar + Sidebar)
- [x] Dark mode nativo
- [x] Responsive design

### En Desarrollo 🚧

#### Backend
- [ ] WebSocket para notificaciones real-time
- [ ] Histórico de transacciones
- [ ] Sistema de badges/achievements
- [ ] Recomendaciones inteligentes
- [ ] Rate limiting

#### Frontend
- [ ] Forum avanzado (mejor editor de posts)
- [ ] Carrito de compras persistente
- [ ] Búsqueda full-text
- [ ] Paginación refinada
- [ ] Animaciones transiciones

### Pendiente 📋

#### MVP Fase 2
- [ ] Gamificación avanzada (badges, leaderboard)
- [ ] Integración con riego automático (API IoT)
- [ ] Generador de reportes PDF
- [ ] Exportar datos de cultivo
- [ ] Chat privado entre usuarios
- [ ] Monetización (pagos reales con Stripe)

---

## ⚠️ PROBLEMAS CONOCIDOS

### 1. **Coexistencia Frontend Legacy + Moderno**
- **Problema:** Existen dos versiones de frontend (`/client` estática y `/frontend` React)
- **Impacto:** Confusión, posible duplication, conflictos de rutas
- **Solución:** Deprecar `/client` y usar solo `/frontend`

### 2. **Falta de Transacciones DB en algunas operaciones**
- **Problema:** Algunos endpoints no usan `$transaction`, riesgo de data inconsistency
- **Impacto:** Si falla el servidor a mitad de operación, data queda corrupta
- **Solución:** Auditar todos los controllers y envolver operaciones multi-step en transacciones

### 3. **Rate Limiting Ausente**
- **Problema:** Sin rate limiting, vulnerable a brute force (auth) y spam
- **Impacto:** Seguridad
- **Solución:** Implementar middleware rate-limit con express-rate-limit

### 4. **Logging Disperso**
- **Problema:** Logs ad-hoc con console.log sin estructura
- **Impacto:** Difícil debugging en producción
- **Solución:** Implementar logger centralizado (Winston o Pino)

### 5. **Testing Ausente**
- **Problema:** No hay unit tests ni integration tests
- **Impacto:** Regresiones inadvertidas
- **Solución:** Añadir Jest + Supertest para backend

### 6. **Validación de Entrada Inconsistente**
- **Problema:** Algunas rutas validan, otras no
- **Impacto:** Inyecciones, datos inválidos
- **Solución:** Usar middleware como joi o zod

### 7. **Timeout Vercel (10s)**
- **Problema:** Timeout máximo en serverless limita operaciones largas
- **Impacto:** Upload de archivos grandes puede fallar
- **Solución:** Implementar upload asíncrono o mover a container

### 8. **CORS Hardcodeado**
- **Problema:** CORS permite solo localhost:5173 en desarrollo
- **Impacto:** Problemas en otros ambientes
- **Solución:** Usar env variable para CORS_ORIGIN

### 9. **JWT Secret en .env**
- **Problema:** Si se expone .env, JWT secret comprometido
- **Impacto:** Seguridad
- **Solución:** Usar secret management (Vercel Secrets)

### 10. **Caché Ausente**
- **Problema:** Cada request toca la DB
- **Impacto:** Lentitud, carga DB
- **Solución:** Implementar Redis para caché

---

## 💡 RECOMENDACIONES

### CORTO PLAZO (1-2 sprints)

1. **Deprecar Frontend Legacy**
   - Eliminar `/client` carpeta
   - Documentar migración de landing pages a React
   - Actualizar vercel.json

2. **Implementar Validación Global**
   ```javascript
   // Usar zod para validación declarativa
   const createProductSchema = z.object({
     name: z.string().min(1),
     price: z.number().positive(),
     ...
   });
   ```

3. **Añadir Rate Limiting**
   ```javascript
   const limiter = require('express-rate-limit');
   app.use('/api/auth/login', limiter({ windowMs: 15*60*1000, max: 5 }));
   ```

4. **Implementar Tests Básicos**
   ```bash
   npm install --save-dev jest supertest
   ```

5. **Fix CORS Configuration**
   ```javascript
   // Usar env variable
   const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
   app.use(cors({ origin: ALLOWED_ORIGINS }));
   ```

### MEDIANO PLAZO (1-2 meses)

6. **Logging Centralizado**
   ```javascript
   const winston = require('winston');
   const logger = winston.createLogger({ ... });
   ```

7. **Implementar Transacciones en todos los Controllers**
   - Auditar cada operación multi-step
   - Envolver en `prisma.$transaction`

8. **Cacheing con Redis**
   - Caché de productos marketplace
   - Caché de posts del foro
   - User session cache

9. **CI/CD Pipeline**
   - GitHub Actions para tests automáticos
   - Pre-push hooks
   - Staging environment

10. **Monitoring & Alerting**
    - Sentry para error tracking
    - Datadog para metrics
    - Alerts para downtimes

### LARGO PLAZO (3+ meses)

11. **Microservicios**
    - Separar módulos en servicios independientes
    - Message queue (RabbitMQ) para async tasks
    - API Gateway

12. **GraphQL**
    - Migrar REST API a GraphQL
    - Apollo Server
    - Mejor performance con queries selectivas

13. **Mobile App**
    - React Native
    - Sincronización offline-first
    - Notificaciones push

14. **IA/ML**
    - Recomendaciones de productos
    - Análisis predictivo de cultivos
    - Chatbot en foro

---

## 📞 CONTACTO & SOPORTE

**Documentación adicional:**
- [Architecture Overview](./docs/01_architecture_overview.md)
- [Database Schema](./docs/02_database_schema.md)
- [Backend API Reference](./docs/03_backend_api_reference.md)
- [Frontend Documentation](./docs/04_frontend_documentation.md)
- [Business Rules](./docs/05_business_rules_logic.md)

**Equipo de Desarrollo:**
- Project Manager: [TBD]
- Backend Lead: [TBD]
- Frontend Lead: [TBD]
- DevOps: [TBD]

---

**Última actualización:** 23 de Enero, 2026  
**Autor:** Sistema de Relevamiento Automático  
**Versión:** 1.0
