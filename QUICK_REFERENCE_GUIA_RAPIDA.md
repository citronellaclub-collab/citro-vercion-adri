# QUICK REFERENCE & DIAGRAMAS VISUALES

**Guía rápida para desarrolladores - Cultivo Virtual**  
**Última actualización:** 23 de Enero, 2026

---

## 🎯 INICIO RÁPIDO

### Primer Paso: Clonar y Configurar

```bash
# 1. Clonar repositorio
git clone <repo_url>
cd citro-web-2.0

# 2. Instalar dependencias
npm install
cd frontend && npm install && cd ..

# 3. Crear .env.local
cat > .env.local << EOF
DATABASE_URL=postgresql://user:pass@localhost/citro
JWT_SECRET=dev_secret_local
BREVO_API_KEY=test_key
BLOB_READ_WRITE_TOKEN=test_token
STAFF_PASSWORD=dev123
NODE_ENV=development
EOF

# 4. Ejecutar en desarrollo
npm run dev          # Backend (con nodemon)
npm run frontend     # Frontend (Vite) en otra terminal

# 5. Acceder a http://localhost:5173
```

---

## 🏗️ ARQUITECTURA EN UN VISTAZO

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (React)                           │
│  ├─ App.jsx (Routes)                                         │
│  ├─ context/AuthContext.jsx (useAuth hook)                  │
│  ├─ components/ (Layout, HealthCheck, etc)                  │
│  └─ pages/ (Dashboard, Market, Forum, etc)                  │
└────────────────┬──────────────────────────────────────────────┘
                 │ HTTP/REST + JWT
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 SERVIDOR (Express.js)                        │
│  ├─ server.js (middleware, rutas)                            │
│  ├─ auth.js (JWT verification)                              │
│  ├─ routes/api.js (30+ endpoints)                            │
│  ├─ controllers/ (lógica de negocio)                         │
│  ├─ services/ (mailService, blobService)                    │
│  └─ utils/ (helpers)                                         │
└────────────────┬──────────────────────────────────────────────┘
                 │ Prisma ORM
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DATOS (PostgreSQL)                      │
│  Tablas: User, Crop, CropLog, Product, Order, Post, etc.    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 FLUJOS CLAVE

### Flujo de Autenticación
```
[Register]        [Login]
    │                 │
    ▼                 ▼
Hash Password    Verify Password
    │                 │
    ▼                 ▼
Create User      Generate JWT
    │                 │
    ▼                 ▼
Send Verification  Return Token
  Email             │
    │               ▼
    │         [Save en localStorage]
    │               │
    └──────┬────────┘
           ▼
    [Fetch /api/auth/me]
           │
           ▼
    [AuthContext actualiza]
           │
           ▼
    [Redirige a /micultivo]
```

### Flujo de Compra (Marketplace)
```
[Seleccionar producto]
    │
    ▼
[Agregar al carrito]
    │
    ▼
[Checkout]
    │
    ▼
POST /api/orders {items: [...]}
    │
    ▼ Prisma.$transaction
┌────────────────────────────┐
│  1. Validar stock          │
│  2. Validar saldo          │
│  3. Restar tokens comprador│
│  4. Sumar tokens vendedor  │
│  5. Actualizar stock       │
│  6. Crear Order + Items    │
└────────────────────────────┘
    │
    ▼
[Confirmación]
    │
    ▼
[Historial de Pedidos]
    │
    ▼
[Dejar Review Opcional]
```

---

## 🔑 ENDPOINTS MÁS USADOS

### Para el Desarrollador Frontend

```javascript
// Autenticación
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me             // Primero! Para obtener user data

// Mi Cultivo (Core feature)
GET  /api/crops
POST /api/crops               // Con imagen
POST /api/crops/:id/logs      // Nuevo log semanal

// Marketplace
GET  /api/market?category=Flores&sortBy=price_asc
POST /api/market              // Publicar producto
POST /api/market/wishlist     // Toggle favorito

// Transacciones
POST /api/orders              // Comprar

// Foro
GET  /api/forum
POST /api/forum               // Con attachments
POST /api/forum/:id/comment

// Eventos
GET  /api/events
POST /api/events/reserve      // Comprar ticket
```

### Para el Desarrollador Backend

```javascript
// Debugging
GET /api/health               // ¿Está vivo el servidor?
GET /api/test                 // ¿Funciona la API?
GET /api/ping                 // Ping rápido

// Admin (requiere STAFF_PASSWORD)
POST /api/admin/verify        // Convertir en admin
GET  /api/admin/users         // Ver todos los usuarios
POST /api/admin/tokens        // Dar/quitar tokens a usuarios
```

---

## 🗄️ MODELOS DE DATOS RÁPIDO

### User
```javascript
{
  id: number,
  username: string (unique),
  password: string (hashed),
  email: string (optional),
  tokens: number (default 100),
  role: "USER" | "ADMIN",
  isDev: boolean (bypass dev),
  emailVerified: boolean,
  isVerified: boolean (negocio)
}
```

### Crop
```javascript
{
  id: number,
  bucketName: string,
  imageUrl: string (Vercel Blob),
  status: "Verde" | "Amarillo" | "Rojo",
  userId: number,
  logs: CropLog[]
}
```

### CropLog
```javascript
{
  id: number,
  week: string,
  phase: "Germinación" | "Vegetación" | "Floración" | "Senescencia",
  ph: number,      // 5.8-6.2 ideal
  ec: number,      // Varies by phase
  grow: number,
  micro: number,
  bloom: number,
  notes: string,
  feedback: string (auto-generated),
  imageUrl: string
}
```

### Product
```javascript
{
  id: number,
  name: string,
  price: number (tokens),
  basePrice: number,
  category: "Flores" | "Parafernalia" | "Genéticas",
  stock: number,
  imageUrl: string,
  sellerId: number,
  status: "Active" | "Paused" | "SoldOut"
}
```

### Order
```javascript
{
  id: number,
  buyerId: number,
  items: OrderItem[],
  totalPrice: number (tokens),
  status: "Pendiente" | "Entregado" | "Cancelado"
}
```

### Post (Forum)
```javascript
{
  id: number,
  title: string,
  content: string,
  category: "Clases" | "Debates" | "Papers" | etc,
  authorId: number,
  likes: number,
  attachments: Attachment[],
  reactions: Reaction[],
  comments: Comment[],
  isPinned: boolean,
  isImmutable: boolean
}
```

---

## 🚀 OPERACIONES COMUNES

### Crear un Cultivo
```javascript
const formData = new FormData();
formData.append('bucketName', 'Mi Primer Cultivo');
formData.append('image', fileInput.files[0]);

const response = await fetch('/api/crops', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Registrar una Bitácora
```javascript
const formData = new FormData();
formData.append('week', 'Semana 3');
formData.append('phase', 'Vegetación');
formData.append('ph', '6.0');
formData.append('ec', '1.5');
formData.append('grow', '1');
formData.append('micro', '0.5');
formData.append('bloom', '0');
formData.append('notes', 'Aspecto saludable');
formData.append('image', logImageFile);

const response = await fetch(`/api/crops/${cropId}/logs`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Comprar un Producto
```javascript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { productId: 1, quantity: 2 },
      { productId: 5, quantity: 1 }
    ]
  })
});

// La respuesta incluye confirmación de transacción
const order = await response.json();
console.log(`Compra exitosa. ID: ${order.id}, Total: ${order.totalPrice} tokens`);
```

### Crear un Post en el Foro
```javascript
const formData = new FormData();
formData.append('title', 'Cómo mantener bajo pH');
formData.append('content', 'Aquí va el contenido del post...');
formData.append('category', 'Clases');
formData.append('youtubeLink', 'https://youtube.com/...'); // optional
formData.append('attachments', pdfFile1);
formData.append('attachments', pdfFile2);

const response = await fetch('/api/forum', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## 🔒 SEGURIDAD CLAVE

### JWT Token
```javascript
// Token structure (después del "Bearer ")
{
  id: number,
  role: "USER" | "ADMIN",
  isDev: boolean,
  iat: number,        // Issued at
  exp: number         // Expiration (24h)
}

// Verificación en servidor
const verified = jwt.verify(token, process.env.JWT_SECRET);
```

### Middleware Auth
```javascript
// Proteger rutas
router.get('/crops', auth, cropController.getCrops);

// Dentro de auth.js:
const token = req.header('Authorization')?.replace('Bearer ', '');
jwt.verify(token, process.env.JWT_SECRET);
```

### Password Hashing
```javascript
// Registrar: hash con bcrypt
const hash = await bcrypt.hash(password, 10);
await prisma.user.create({ ... password: hash });

// Login: comparar
const match = await bcrypt.compare(password, user.password);
```

---

## 📈 MONITOREO BÁSICO

### Health Checks
```bash
# Test rápido
curl http://localhost:3000/api/health

# Response esperada:
{
  "status": "ok",
  "timestamp": "2026-01-23T...",
  "env": {
    "NODE_ENV": "development",
    "DATABASE_URL": true,
    "JWT_SECRET": true
  }
}
```

### Ver Logs
```bash
# Backend logs en stdout
npm run dev

# Frontend logs en consola del browser
F12 → Console
```

### Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| 401 Unauthorized | Token faltante/inválido | Verificar header `Authorization` |
| 403 Forbidden | Permisos insuficientes | ¿Eres owner del cultivo/producto? |
| 404 Not Found | Recurso no existe | Verificar ID del recurso |
| 500 Internal Error | Error en backend | Ver logs en servidor |
| CORS Error | Origen no permitido | Editar CORS en server.js |

---

## 📦 COMANDOS ÚTILES

```bash
# Development
npm run dev              # Backend con auto-reload
npm run frontend        # Frontend Vite dev server

# Database
npm run db:push         # Push schema a DB
npm run db:studio      # Abrir Prisma Studio (GUI)
npm run db:health      # Health check
npm run db:reset       # ⚠️ Reset todo (irreversible)

# Build para producción
npm run build           # Build frontend
npm run start          # Iniciar servidor (prod mode)

# Testing (cuando exista suite)
npm test               # Ejecutar tests
```

---

## 🎨 ESTRUCTURA DE COMPONENTES REACT

```
App.jsx (Router + ProtectedRoute)
  │
  ├─ /login → Login.jsx
  │
  └─ / → Layout.jsx (Navbar + Sidebar + Outlet)
      │
      ├─ /micultivo → Dashboard.jsx
      │    ├─ CropTrends.jsx (gráficos)
      │    └─ LogHistory.jsx (tabla)
      │
      ├─ /gtl → Market.jsx
      │    ├─ Filtros + búsqueda
      │    └─ ProductCard (iterado)
      │
      ├─ /foro → Forum.jsx
      │    ├─ PostList
      │    └─ CommentSection (por post)
      │
      ├─ /eventos → Events.jsx
      │    ├─ EventCard
      │    └─ TicketModal
      │
      ├─ /pedidos → Orders.jsx
      │    ├─ Historial de compras
      │    └─ Historial de ventas
      │
      ├─ /perfil → Profile.jsx
      │
      ├─ /admin → AdminPanel.jsx
      │
      └─ /terminos → Terms.jsx

AuthContext.jsx (Proveedor global)
  ├─ user state (id, username, tokens, role, etc)
  ├─ login(username, password)
  ├─ logout()
  └─ useAuth() hook
```

---

## 🔧 DEBUGGING CHECKLIST

### ¿No funciona el login?
```javascript
// 1. Verificar credenciales en DB
SELECT id, username, email FROM "User" WHERE username = 'test';

// 2. Verificar JWT_SECRET configurado
echo $JWT_SECRET

// 3. Verificar CORS en server.js
app.use(cors({ origin: 'http://localhost:5173' }));

// 4. Revisar logs del servidor
npm run dev (y buscar errores)
```

### ¿No suben las imágenes?
```javascript
// 1. Verificar BLOB_READ_WRITE_TOKEN
echo $BLOB_READ_WRITE_TOKEN

// 2. Revisar Multer config
upload.single('image') // ¿El nombre del field es correcto?

// 3. Revisar blobService.js
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
```

### ¿Falla la transacción de compra?
```javascript
// 1. Verificar prisma.$transaction
// 2. Verificar que buyer y seller son diferentes
// 3. Verificar saldo del comprador
SELECT tokens FROM "User" WHERE id = <buyerId>;

// 4. Revisar logs de transacción en stdout
```

---

## 📚 RECURSOS IMPORTANTES

| Recurso | Ubicación | Propósito |
|---------|-----------|----------|
| Documentación Completa | `/docs/README.md` | Índice de docs |
| Architecture | `/docs/01_architecture_overview.md` | Stack y diseño |
| Database Schema | `/docs/02_database_schema.md` | Modelos detallados |
| API Reference | `/docs/03_backend_api_reference.md` | Todos los endpoints |
| Frontend Docs | `/docs/04_frontend_documentation.md` | Componentes React |
| Business Rules | `/docs/05_business_rules_logic.md` | Reglas del sistema |
| Visión Producto | `/docs/VISION_DEL_PRODUCTO.md` | Objetivos y personas |

---

## 🚨 IMPORTANTE: NOTAS OPERATIVAS

### Antes de Hacer Push a Producción
```bash
# 1. Ejecutar todos los tests
npm test

# 2. Revisar que no hay warnings en logs
npm run dev

# 3. Verificar .env.production tiene vars correctas
cat .env.production

# 4. Ejecutar build
npm run build

# 5. Probar en staging
vercel deploy --prod

# 6. Health check
curl https://citro-web-2-0.vercel.app/api/health
```

### Si Hay Problema en Producción
```bash
# 1. Revisar logs en Vercel dashboard
https://vercel.com/dashboard

# 2. Revisar database en Easypanel
https://app.easypanel.io

# 3. Rollback a versión anterior si es crítico
git revert <commit_hash>
git push
```

### Cambios a Database
```bash
# SIEMPRE hacer migrations:
1. Editar prisma/schema.prisma
2. Ejecutar: npx prisma migrate dev --name describe_change
3. Verificar migration en migrations/
4. Commit y push
5. Vercel ejecutará automáticamente en producción
```

---

## 🎓 PRÓXIMOS PASOS PARA APRENDER

1. **Familiarizarse con código:**
   - Leer `frontend/src/App.jsx` (routing)
   - Leer `frontend/src/context/AuthContext.jsx` (estado global)
   - Leer `server/controllers/cropController.js` (lógica principal)

2. **Hacer cambios pequeños:**
   - Añadir nuevo campo a un formulario
   - Cambiar color de componente
   - Modificar query de base de datos

3. **Implementar feature simple:**
   - Nuevo endpoint GET para obtener estática
   - Nuevo componente React
   - Nuevo tipo de validación

4. **Contribuir en issues:**
   - Revisar TODO comments en código
   - Implementar testing
   - Optimizar queries

---

**¿Necesitas ayuda? Revisa:**
- Documentación en `/docs`
- Relevamiento exhaustivo: `RELEVAMIENTO_SISTEMA_EXHAUSTIVO.md`
- Matriz técnica: `MATRIZ_FUNCIONALIDADES_TECNICAS.md`

---

**Documento generado el 23 de Enero, 2026**
