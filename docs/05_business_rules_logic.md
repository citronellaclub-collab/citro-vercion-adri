# Citro Web 2.0 - Business Rules & Logic

## Sistema de Economía (Tokens)

### Tokens Iniciales

**Registro de Usuario**:

- Tokens otorgados: **100 🟢**
- Asignación automática al crear cuenta

### Transacciones de Tokens

#### Compra de Productos (Marketplace)

**Flujo**:

1. Usuario selecciona productos y cantidad
2. Sistema calcula `totalPrice`
3. Valida `user.tokens >= totalPrice`
4. Si válido:
   - Deduce tokens del comprador
   - Suma tokens al vendedor
   - Crea orden con status "Pendiente"
5. Si inválido: Error "Saldo insuficiente"

**Transacción Atómica**:

```javascript
await prisma.$transaction([
    prisma.user.update({
        where: { id: buyerId },
        data: { tokens: { decrement: totalPrice } }
    }),
    prisma.user.update({
        where: { id: sellerId },
        data: { tokens: { increment: totalPrice } }
    }),
    prisma.order.create({ data: orderData })
]);
```

---

#### Reserva de Eventos

**Flujo**:

1. Usuario selecciona categoría de entrada
2. Sistema valida:
   - Aforo disponible
   - Saldo de tokens
3. Si válido:
   - Deduce `categoryPrice` de tokens
   - Crea reserva
   - Genera QR code
4. Si inválido: Error específico

**Validaciones**:

```javascript
// Validar aforo
const reservationCount = await prisma.reservation.count({
    where: { category: { eventId } }
});

if (reservationCount >= event.capacity) {
    throw new Error('Evento agotado');
}

// Validar saldo
if (user.tokens < category.price) {
    throw new Error('Saldo de tokens insuficiente');
}
```

---

#### Carga Manual de Tokens (Admin)

**Flujo**:

1. Admin accede a Panel Staff
2. Selecciona usuario
3. Ingresa cantidad de tokens
4. Sistema actualiza saldo

**Restricción**: Solo usuarios con `role === 'ADMIN'` o `isDev === true`

---

### Reglas de Tokens

| Regla | Descripción |
|-------|-------------|
| **Saldo Mínimo** | 0 tokens (no se permiten negativos) |
| **Saldo Máximo** | Sin límite |
| **Transferencias Directas** | No implementadas (solo via marketplace/eventos) |
| **Reembolsos** | No automáticos (requiere intervención admin) |

---

## Niveles de Acceso

### 1. Usuario No Verificado

**Características**:

- `emailVerified: false`
- `role: "USER"`

**Permisos**:

- ✅ Navegar por todas las páginas
- ✅ Ver productos en Marketplace
- ✅ Leer posts en Foro
- ✅ Ver eventos
- ✅ Ver su perfil
- ❌ Publicar productos
- ❌ Crear posts en Foro
- ❌ Reservar eventos (opcional, configurable)

**Restricciones (Soft Block)**:

- Banner de verificación visible
- Mensaje de bloqueo en formularios de creación

---

### 2. Usuario Verificado

**Características**:

- `emailVerified: true`
- `role: "USER"`

**Permisos**:

- ✅ Todos los permisos de Usuario No Verificado
- ✅ Publicar productos en Marketplace
- ✅ Crear posts en Foro
- ✅ Comentar en posts
- ✅ Reservar eventos
- ✅ Comprar productos
- ❌ Acceder a Panel Staff
- ❌ Moderar contenido

---

### 3. Administrador

**Características**:

- `role: "ADMIN"`
- `emailVerified: true` (generalmente)

**Permisos**:

- ✅ Todos los permisos de Usuario Verificado
- ✅ Acceder a Panel Staff (`/admin`)
- ✅ Gestionar tokens de usuarios
- ✅ Crear eventos
- ✅ Moderar posts del foro (pin, protect, delete)
- ✅ Editar contenido legal
- ✅ Ver estadísticas del sistema

**Identificación**:

```javascript
if (user.role === 'ADMIN' || user.isDev) {
    // Acceso admin
}
```

---

### 4. Super Admin (Desarrollador)

**Características**:

- `isDev: true`
- `role: "ADMIN"` (generalmente)
- Bypass de base de datos

**Permisos**:

- ✅ Todos los permisos de Administrador
- ✅ Bypass de middleware de autenticación
- ✅ Tokens ilimitados (999999)
- ✅ Acceso sin consultar base de datos

**Activación**:

```javascript
// Login con STAFF_PASSWORD
username: "cualquiera"
password: "cradilly"  // process.env.STAFF_PASSWORD
```

**Lógica de Bypass**:

```javascript
// authController.js - Login
if (password === process.env.STAFF_PASSWORD) {
    return {
        token: jwt.sign({ id: 999999, username, role: 'ADMIN', isDev: true }),
        id: 999999,
        username: username,
        tokens: 999999,
        role: 'ADMIN',
        isDev: true,
        emailVerified: true
    };
}

// auth.js - Middleware
if (verified.isDev === true) {
    console.log('[MIDDLEWARE BYPASS] Developer token detected');
    // No consulta DB
}
```

---

## Políticas de Contenido

### Marketplace

#### Publicación de Productos

**Requisitos**:

- Usuario verificado (`emailVerified: true`)
- Campos obligatorios:
  - `name`: String (mínimo 3 caracteres)
  - `category`: Enum válido
  - `price`: Int (mínimo 0)
  - `stock`: Int (mínimo 1)

**Categorías Permitidas**:

- Semillas
- Sustratos
- Nutrientes
- Equipamiento
- Otros

**Restricciones**:

- Máximo 1 imagen por producto
- Tamaño máximo de imagen: 5MB
- Formatos permitidos: JPG, PNG, WEBP

---

#### Moderación de Productos

**Acciones Admin**:

- Pausar producto (`status: "Paused"`)
- Marcar como agotado (`status: "SoldOut"`)
- Eliminar producto (permanente)

**Criterios de Moderación**:

- Contenido inapropiado
- Precios excesivos
- Productos prohibidos

---

### Foro

#### Creación de Posts

**Requisitos**:

- Usuario verificado (`emailVerified: true`)
- Campos obligatorios:
  - `title`: String (mínimo 5 caracteres)
  - `content`: String (mínimo 10 caracteres)
  - `category`: Enum válido

**Categorías Permitidas**:

- Clases
- Investigaciones
- FAQ
- Debates
- Papers
- Noticias
- Anuncios

**Contenido Multimedia**:

- Videos: YouTube/Vimeo (embed automático)
- Archivos: Máximo 5 adjuntos
- Tamaño máximo por archivo: 10MB
- Formatos permitidos: PDF, DOCX, XLSX, TXT

---

#### Moderación de Posts

**Acciones de Usuario**:

- Eliminar propio post (si no tiene comentarios)
- Editar propio post (dentro de 24h)

**Acciones de Admin**:

- **Pin**: Fijar post al inicio
- **Protect**: Hacer inmutable (no se puede eliminar)
- **Delete**: Eliminar cualquier post

**Criterios de Moderación**:

- Spam
- Contenido ofensivo
- Información falsa
- Violación de términos

---

#### Comentarios

**Requisitos**:

- Usuario autenticado
- Post existente

**Restricciones**:

- Máximo 500 caracteres por comentario
- No se pueden editar comentarios
- Solo el autor o admin pueden eliminar

---

#### Reacciones

**Tipos Permitidos**:

- Interesante 💡
- Útil ⭐
- Científico 🔬

**Reglas**:

- 1 reacción por usuario por post
- Cambiar reacción elimina la anterior

---

### Eventos

#### Creación de Eventos

**Requisitos**:

- Usuario con `role: "ADMIN"` o `isDev: true`
- Campos obligatorios:
  - `title`: String
  - `description`: String
  - `date`: DateTime (futuro)
  - `time`: String
  - `location`: String
  - `capacity`: Int (mínimo 1)
  - `categories`: Array (mínimo 1 categoría)

**Categorías de Entrada**:

- General (precio configurable)
- VIP (precio configurable)
- Socio (precio configurable)

---

#### Reserva de Entradas

**Requisitos**:

- Usuario autenticado
- Saldo suficiente de tokens
- Aforo disponible

**Restricciones**:

- 1 reserva por usuario por evento
- No se pueden cancelar reservas (requiere admin)

**QR Code**:

- Formato: `CITRO-{eventId}-{userId}-{timestamp}`
- Generado automáticamente
- Único por reserva

---

## Reglas de Validación

### Cultivos (Mi Cultivo)

#### Logs Semanales

**Validaciones**:

- `ph`: 0.0 - 14.0
- `ec`: 0.0 - 5.0
- `grow`, `micro`, `bloom`: 0.0 - 100.0 ml

**Feedback Automático**:

```javascript
let feedback = [];

if (ph < 5.5 || ph > 6.5) {
    feedback.push('⚠️ pH fuera del rango óptimo (5.5-6.5)');
}

if (ec > 2.5) {
    feedback.push('⚠️ EC alta, riesgo de quemado de raíces');
}

return feedback.join(' | ');
```

---

### Usuarios

#### Registro

**Validaciones**:

- `username`:
  - Mínimo 3 caracteres
  - Máximo 20 caracteres
  - Solo alfanuméricos y guiones bajos
  - Único en el sistema
- `password`:
  - Mínimo 6 caracteres
  - Sin restricciones de complejidad (por ahora)

---

#### Email (Opcional)

**Validaciones**:

- Formato válido (regex)
- Único en el sistema (si se implementa)

---

## Reglas de Seguridad

### Autenticación

**JWT Expiration**: 24 horas

**Token Refresh**: No implementado (requiere re-login)

**Password Storage**: bcrypt (10 rounds)

---

### Autorización

**Verificación de Propiedad**:

```javascript
// Ejemplo: Eliminar producto
if (product.sellerId !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'No autorizado' });
}
```

**Verificación de Rol**:

```javascript
// Ejemplo: Crear evento
if (user.role !== 'ADMIN' && !user.isDev) {
    return res.status(403).json({ error: 'Acceso denegado' });
}
```

---

### Rate Limiting

**Email Verification**:

- 1 email cada 5 minutos por usuario
- Implementado con timestamp en DB

**Futuras Implementaciones**:

- Login attempts: 5 intentos por 15 minutos
- API calls: 100 requests por minuto

---

## Reglas de Datos

### Soft Deletes

**No Implementado**: Todas las eliminaciones son permanentes

**Excepciones con CASCADE**:

- Eliminar producto → Elimina wishlist entries
- Eliminar post → Elimina attachments, subscriptions, reactions
- Eliminar evento → Elimina categorías de entrada

---

### Integridad Referencial

**Restricciones**:

- No se puede eliminar usuario con órdenes activas
- No se puede eliminar producto con órdenes pendientes
- No se puede eliminar evento con reservas

---

## Reglas de Notificaciones

### Triggers (Futuro)

**Marketplace**:

- Nuevo producto en categoría favorita
- Producto en wishlist con descuento
- Orden entregada

**Foro**:

- Nuevo comentario en post suscrito
- Respuesta a tu comentario

**Eventos**:

- Nuevo evento creado
- Recordatorio 24h antes del evento

---

## Versión de Reglas

**Última actualización**: Enero 2026
**Versión**: 1.0.0
