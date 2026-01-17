# Citro Web 2.0 - Database Schema Documentation

## Diccionario de Datos Completo

### Tabla: `User`

**Descripción**: Almacena información de usuarios del sistema (socios, administradores).

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único del usuario |
| `username` | String | ✅ | - | Nombre de usuario único |
| `password` | String | ✅ | - | Contraseña hasheada (bcrypt) |
| `role` | String | ✅ | "USER" | Rol del usuario: USER, ADMIN |
| `isDev` | Boolean | ✅ | false | Flag de desarrollador (bypass de seguridad) |
| `tokens` | Int | ✅ | 100 | Saldo de tokens para economía interna |
| `isVerified` | Boolean | ✅ | false | Verificación manual por staff |
| `emailVerified` | Boolean | ✅ | false | Verificación automática por email |
| `verificationToken` | String | ❌ | null | Token único para verificación de email |
| `lastVerificationSent` | DateTime | ❌ | null | Timestamp del último email de verificación |

**Índices**:

- `username` (UNIQUE)
- `verificationToken` (UNIQUE)

**Relaciones**:

- `crops` → Crop[] (1:N)
- `buyerOrders` → Order[] (1:N)
- `sellerProducts` → Product[] (1:N)
- `sellerReviews` → Review[] (1:N)
- `wishlist` → Wishlist[] (1:N)
- `notifications` → Notification[] (1:N)
- `posts` → Post[] (1:N)
- `comments` → Comment[] (1:N)
- `subscriptions` → Subscription[] (1:N)
- `reactions` → Reaction[] (1:N)
- `reservations` → Reservation[] (1:N)

---

### Tabla: `Crop`

**Descripción**: Representa un cultivo hidropónico del usuario.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único del cultivo |
| `bucketName` | String | ✅ | - | Nombre del bucket/cultivo |
| `imageUrl` | String | ❌ | null | URL de imagen del cultivo |
| `status` | String | ✅ | "Verde" | Estado: Verde, Amarillo, Rojo |
| `userId` | Int | ✅ | - | FK: Usuario propietario |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `user` → User (N:1)
- `logs` → CropLog[] (1:N)

---

### Tabla: `CropLog`

**Descripción**: Registro semanal de parámetros del cultivo.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único del log |
| `week` | String | ✅ | - | Semana del cultivo (ej: "Semana 3") |
| `phase` | String | ✅ | "Vegetación" | Fase: Germinación, Vegetación, Floración, Senescencia |
| `ph` | Float | ✅ | - | Nivel de pH |
| `ec` | Float | ✅ | - | Conductividad eléctrica (EC) |
| `grow` | Float | ✅ | 0 | ml de nutriente Grow |
| `micro` | Float | ✅ | 0 | ml de nutriente Micro |
| `bloom` | Float | ✅ | 0 | ml de nutriente Bloom |
| `notes` | String | ❌ | null | Notas del usuario |
| `imageUrl` | String | ❌ | null | URL de imagen del log |
| `feedback` | String | ❌ | null | Feedback automático del sistema |
| `cropId` | Int | ✅ | - | FK: Cultivo asociado |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `crop` → Crop (N:1)

---

### Tabla: `Product`

**Descripción**: Productos publicados en el Marketplace.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único del producto |
| `name` | String | ✅ | - | Nombre del producto |
| `description` | String | ❌ | null | Descripción detallada |
| `category` | String | ✅ | "Flores" | Categoría: Flores, Parafernalia, Genéticas |
| `price` | Int | ✅ | 0 | Precio en tokens |
| `basePrice` | Int | ✅ | 0 | Precio base (para descuentos) |
| `stock` | Int | ✅ | 1 | Cantidad disponible |
| `imageUrl` | String | ❌ | null | URL de imagen del producto |
| `sellerId` | Int | ✅ | - | FK: Usuario vendedor |
| `status` | String | ✅ | "Active" | Estado: Active, Paused, SoldOut |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `seller` → User (N:1)
- `orderItems` → OrderItem[] (1:N)
- `wishlistedBy` → Wishlist[] (1:N)
- `reviews` → Review[] (1:N)

---

### Tabla: `Wishlist`

**Descripción**: Lista de deseos de productos por usuario.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `userId` | Int | ✅ | - | FK: Usuario |
| `productId` | Int | ✅ | - | FK: Producto |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Índices**:

- `[userId, productId]` (UNIQUE)

**Relaciones**:

- `user` → User (N:1)
- `product` → Product (N:1, CASCADE)

---

### Tabla: `Notification`

**Descripción**: Notificaciones del sistema para usuarios.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `userId` | Int | ✅ | - | FK: Usuario destinatario |
| `message` | String | ✅ | - | Mensaje de la notificación |
| `isRead` | Boolean | ✅ | false | Estado de lectura |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `user` → User (N:1)

---

### Tabla: `Order`

**Descripción**: Órdenes de compra en el Marketplace.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `buyerId` | Int | ✅ | - | FK: Usuario comprador |
| `totalPrice` | Int | ✅ | - | Precio total de la orden |
| `status` | String | ✅ | "Pendiente" | Estado: Pendiente, Entregado, Cancelado |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `buyer` → User (N:1)
- `items` → OrderItem[] (1:N)
- `review` → Review (1:1)

---

### Tabla: `OrderItem`

**Descripción**: Ítems individuales de una orden.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `orderId` | Int | ✅ | - | FK: Orden |
| `productId` | Int | ✅ | - | FK: Producto |
| `quantity` | Int | ✅ | 1 | Cantidad comprada |
| `price` | Int | ✅ | - | Precio capturado al momento de compra |

**Relaciones**:

- `order` → Order (N:1)
- `product` → Product (N:1)

---

### Tabla: `Post`

**Descripción**: Publicaciones en el Foro multimodal.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `title` | String | ✅ | - | Título del post |
| `content` | String | ✅ | - | Contenido principal |
| `category` | String | ✅ | "Debates" | Categoría: Clases, Investigaciones, FAQ, Debates, Papers, Noticias, Anuncios |
| `youtubeLink` | String | ❌ | null | URL de video YouTube/Vimeo |
| `fileUrl` | String | ❌ | null | URL de documento principal |
| `authorId` | Int | ✅ | - | FK: Usuario autor |
| `likes` | Int | ✅ | 0 | Contador de likes |
| `isPinned` | Boolean | ✅ | false | Post fijado por admin |
| `isImmutable` | Boolean | ✅ | false | Post protegido contra eliminación |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `author` → User (N:1)
- `attachments` → Attachment[] (1:N)
- `subscriptions` → Subscription[] (1:N)
- `reactions` → Reaction[] (1:N)
- `comments` → Comment[] (1:N)

---

### Tabla: `Comment`

**Descripción**: Comentarios en posts del foro.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `content` | String | ✅ | - | Contenido del comentario |
| `postId` | Int | ✅ | - | FK: Post |
| `authorId` | Int | ✅ | - | FK: Usuario autor |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `post` → Post (N:1)
- `author` → User (N:1)

---

### Tabla: `Attachment`

**Descripción**: Archivos adjuntos a posts del foro.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `name` | String | ✅ | - | Nombre del archivo |
| `url` | String | ✅ | - | URL del archivo en Blob storage |
| `type` | String | ✅ | - | Tipo de archivo: pdf, docx, etc. |
| `postId` | Int | ✅ | - | FK: Post |

**Relaciones**:

- `post` → Post (N:1, CASCADE)

---

### Tabla: `Subscription`

**Descripción**: Suscripciones de usuarios a posts del foro.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `userId` | Int | ✅ | - | FK: Usuario |
| `postId` | Int | ✅ | - | FK: Post |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Índices**:

- `[userId, postId]` (UNIQUE)

**Relaciones**:

- `user` → User (N:1)
- `post` → Post (N:1, CASCADE)

---

### Tabla: `Reaction`

**Descripción**: Reacciones de usuarios a posts del foro.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `type` | String | ✅ | - | Tipo: Interesante, Útil, Científico |
| `userId` | Int | ✅ | - | FK: Usuario |
| `postId` | Int | ✅ | - | FK: Post |

**Índices**:

- `[userId, postId]` (UNIQUE)

**Relaciones**:

- `user` → User (N:1)
- `post` → Post (N:1, CASCADE)

---

### Tabla: `Review`

**Descripción**: Reseñas de productos tras completar orden.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `rating` | Int | ✅ | 5 | Calificación 1-5 estrellas |
| `comment` | String | ❌ | null | Comentario opcional |
| `orderId` | Int | ✅ | - | FK: Orden (UNIQUE) |
| `productId` | Int | ✅ | - | FK: Producto |
| `sellerId` | Int | ✅ | - | FK: Usuario vendedor |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Índices**:

- `orderId` (UNIQUE)

**Relaciones**:

- `order` → Order (1:1)
- `product` → Product (N:1)
- `seller` → User (N:1)

---

### Tabla: `Event`

**Descripción**: Eventos de Citronella Club.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `title` | String | ✅ | - | Título del evento |
| `description` | String | ✅ | - | Descripción del evento |
| `date` | DateTime | ✅ | - | Fecha del evento |
| `time` | String | ✅ | - | Hora del evento |
| `location` | String | ✅ | - | Ubicación del evento |
| `requirements` | String | ❌ | null | Requisitos de entrada |
| `flyerUrl` | String | ❌ | null | URL del flyer del evento |
| `capacity` | Int | ✅ | 50 | Aforo máximo |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `categories` → TicketCategory[] (1:N)

---

### Tabla: `TicketCategory`

**Descripción**: Categorías de entradas para eventos.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `eventId` | Int | ✅ | - | FK: Evento |
| `name` | String | ✅ | - | Nombre: General, VIP, Socio |
| `price` | Int | ✅ | 0 | Precio en tokens |
| `benefits` | String | ❌ | null | Beneficios de la categoría |

**Relaciones**:

- `event` → Event (N:1, CASCADE)
- `reservations` → Reservation[] (1:N)

---

### Tabla: `Reservation`

**Descripción**: Reservas de entradas a eventos.

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `userId` | Int | ✅ | - | FK: Usuario |
| `categoryId` | Int | ✅ | - | FK: Categoría de entrada |
| `qrCode` | String | ❌ | null | Código QR simulado |
| `createdAt` | DateTime | ✅ | now() | Fecha de creación |

**Relaciones**:

- `user` → User (N:1)
- `category` → TicketCategory (N:1)

---

### Tabla: `LegalContent`

**Descripción**: Contenido legal (términos, privacidad).

| Columna | Tipo | Obligatorio | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | Int | ✅ | autoincrement | Identificador único |
| `terms` | String | ✅ | - | Contenido legal |
| `type` | String | ✅ | - | Tipo: terms, privacy, etc. (UNIQUE) |
| `updatedAt` | DateTime | ✅ | auto | Fecha de última actualización |

**Índices**:

- `type` (UNIQUE)

---

## Diagrama de Relaciones (ERD)

```
User (1) ──────< (N) Crop
User (1) ──────< (N) Product (seller)
User (1) ──────< (N) Order (buyer)
User (1) ──────< (N) Post (author)
User (1) ──────< (N) Comment (author)
User (1) ──────< (N) Wishlist
User (1) ──────< (N) Notification
User (1) ──────< (N) Subscription
User (1) ──────< (N) Reaction
User (1) ──────< (N) Reservation
User (1) ──────< (N) Review (seller)

Crop (1) ──────< (N) CropLog

Product (1) ──────< (N) OrderItem
Product (1) ──────< (N) Wishlist
Product (1) ──────< (N) Review

Order (1) ──────< (N) OrderItem
Order (1) ────── (1) Review

Post (1) ──────< (N) Comment
Post (1) ──────< (N) Attachment
Post (1) ──────< (N) Subscription
Post (1) ──────< (N) Reaction

Event (1) ──────< (N) TicketCategory

TicketCategory (1) ──────< (N) Reservation
```

---

## Claves Foráneas y Cascadas

### Cascadas ON DELETE

| Tabla | Columna FK | Acción |
|-------|-----------|--------|
| `Wishlist` | `productId` | CASCADE |
| `Attachment` | `postId` | CASCADE |
| `Subscription` | `postId` | CASCADE |
| `Reaction` | `postId` | CASCADE |
| `TicketCategory` | `eventId` | CASCADE |

**Nota**: Las demás relaciones usan el comportamiento por defecto (RESTRICT).

---

## Índices y Optimizaciones

### Índices Únicos

- `User.username`
- `User.verificationToken`
- `Wishlist.[userId, productId]`
- `Subscription.[userId, postId]`
- `Reaction.[userId, postId]`
- `Review.orderId`
- `LegalContent.type`

### Índices Implícitos (FK)

- Todas las columnas FK tienen índices automáticos por Prisma

---

## Migraciones

### Comandos Prisma

```bash
# Generar cliente
npx prisma generate

# Sincronizar schema con DB (desarrollo)
npx prisma db push

# Crear migración (producción)
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio (GUI)
npx prisma studio
```

---

## Consideraciones de Diseño

1. **Soft Deletes**: No implementado actualmente. Se usa CASCADE en relaciones específicas.
2. **Timestamps**: Todas las tablas principales tienen `createdAt`. Solo `LegalContent` tiene `updatedAt`.
3. **Defaults**: Valores por defecto definidos para facilitar creación de registros.
4. **Constraints**: Índices únicos compuestos para prevenir duplicados (ej: wishlist, subscriptions).
5. **Tipos de Datos**: Int para IDs y precios (tokens), String para texto, DateTime para fechas.

---

## Versión del Schema

**Última actualización**: Enero 2026
**Versión Prisma**: 5.x
**Database Provider**: PostgreSQL
