# Citro Web 2.0 - Backend API Reference

## Índice de Módulos

1. [Authentication](#módulo-authentication)
2. [Crops (Mi Cultivo)](#módulo-crops)
3. [Marketplace](#módulo-marketplace)
4. [Forum](#módulo-forum)
5. [Events](#módulo-events)
6. [Admin](#módulo-admin)

---

## Módulo: Authentication

### POST `/api/auth/register`

**Descripción**: Registra un nuevo usuario en el sistema.

**Headers**: Ninguno (público)

**Body** (JSON):

```json
{
  "username": "string (required)",
  "password": "string (required)",
  "email": "string (optional)"
}
```

**Respuesta Exitosa** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 1,
  "username": "usuario123",
  "tokens": 100,
  "role": "USER",
  "isDev": false,
  "emailVerified": false,
  "needsVerification": true
}
```

**Respuesta Error** (400):

```json
{
  "error": "El nombre de usuario ya existe"
}
```

**Lógica Especial**:

- Hashea password con bcrypt (10 rounds)
- Genera `verificationToken` único
- Envía email de verificación (no bloqueante)
- Asigna 100 tokens iniciales

---

### POST `/api/auth/login`

**Descripción**: Autentica usuario y genera JWT.

**Headers**: Ninguno (público)

**Body** (JSON):

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Respuesta Exitosa** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 1,
  "username": "usuario123",
  "tokens": 150,
  "role": "USER",
  "isDev": false,
  "emailVerified": true,
  "needsVerification": false
}
```

**Respuesta Error** (400):

```json
{
  "error": "Usuario no encontrado"
}
```

```json
{
  "error": "Contraseña incorrecta"
}
```

**Lógica Especial - Bypass de Super Admin**:

```javascript
// PRIORIDAD 1: Si password === STAFF_PASSWORD
if (password === process.env.STAFF_PASSWORD) {
    // Genera token ADMIN sin consultar DB
    return {
        token: jwt.sign({ id: 999999, username, role: 'ADMIN', isDev: true }),
        id: 999999,
        username: username,
        tokens: 999999,
        role: 'ADMIN',
        isDev: true,
        emailVerified: true,
        needsVerification: false
    };
}
```

**Características**:

- Permite acceso sin verificación de email (`needsVerification: true`)
- Bypass de desarrollador con `STAFF_PASSWORD`
- Token expira en 24 horas

---

### GET `/api/auth/me`

**Descripción**: Obtiene información del usuario autenticado.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "username": "usuario123",
  "tokens": 150,
  "role": "USER",
  "isDev": false,
  "emailVerified": true
}
```

**Respuesta Error** (404):

```json
{
  "error": "Usuario no encontrado"
}
```

**Lógica Especial**:

- Si `isDev === true`, devuelve datos sin consultar DB

---

### POST `/api/auth/resend-verification`

**Descripción**: Reenvía email de verificación.

**Headers**:

```
Authorization: Bearer <token>
```

**Body**: Ninguno

**Respuesta Exitosa** (200):

```json
{
  "message": "Email de verificación enviado"
}
```

**Respuesta Error** (400):

```json
{
  "error": "El email ya está verificado"
}
```

**Respuesta Error** (429):

```json
{
  "error": "Por favor espera 3 minuto(s) antes de solicitar otro email"
}
```

**Lógica Especial**:

- Rate limiting: 1 email cada 5 minutos
- Genera nuevo `verificationToken`
- Actualiza `lastVerificationSent`

---

### GET `/api/auth/verify/:token`

**Descripción**: Verifica email con token único.

**Headers**: Ninguno (público)

**Parámetros URL**:

- `token`: String (verificationToken)

**Respuesta Exitosa** (200):

```json
{
  "message": "Email verificado exitosamente"
}
```

**Respuesta Error** (400):

```json
{
  "error": "Token de verificación inválido o expirado"
}
```

**Lógica Especial**:

- Marca `emailVerified = true`
- Limpia `verificationToken`
- Envía email de bienvenida (no bloqueante)

---

## Módulo: Crops

### GET `/api/crops`

**Descripción**: Obtiene todos los cultivos del usuario autenticado.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "bucketName": "Mi Cultivo #1",
    "imageUrl": "https://blob.vercel-storage.com/...",
    "status": "Verde",
    "userId": 1,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "logs": []
  }
]
```

---

### POST `/api/crops`

**Descripción**: Crea un nuevo cultivo.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body** (FormData):

```
bucketName: string (required)
image: File (optional)
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "bucketName": "Mi Cultivo #1",
  "imageUrl": "https://...",
  "status": "Verde",
  "userId": 1,
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

### DELETE `/api/crops/:id`

**Descripción**: Elimina un cultivo.

**Headers**:

```
Authorization: Bearer <token>
```

**Parámetros URL**:

- `id`: Int (cropId)

**Respuesta Exitosa** (200):

```json
{
  "message": "Cultivo eliminado"
}
```

---

### POST `/api/crops/:id/logs`

**Descripción**: Agrega un log semanal al cultivo.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body** (FormData):

```
week: string (required)
phase: string (required)
ph: float (required)
ec: float (required)
grow: float (optional)
micro: float (optional)
bloom: float (optional)
notes: string (optional)
image: File (optional)
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "week": "Semana 3",
  "phase": "Vegetación",
  "ph": 6.2,
  "ec": 1.4,
  "grow": 5.0,
  "micro": 2.0,
  "bloom": 0.0,
  "notes": "Todo bien",
  "imageUrl": "https://...",
  "feedback": "pH óptimo. EC ligeramente alta.",
  "cropId": 1,
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

### GET `/api/crops/:id/logs`

**Descripción**: Obtiene todos los logs de un cultivo.

**Headers**:

```
Authorization: Bearer <token>
```

**Parámetros URL**:

- `id`: Int (cropId)

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "week": "Semana 3",
    "phase": "Vegetación",
    "ph": 6.2,
    "ec": 1.4,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### DELETE `/api/logs/:id`

**Descripción**: Elimina un log específico.

**Headers**:

```
Authorization: Bearer <token>
```

**Parámetros URL**:

- `id`: Int (logId)

**Respuesta Exitosa** (200):

```json
{
  "message": "Log eliminado"
}
```

---

## Módulo: Marketplace

### GET `/api/market`

**Descripción**: Obtiene productos con filtros y paginación.

**Headers**:

```
Authorization: Bearer <token>
```

**Query Parameters**:

```
page: int (default: 1)
limit: int (default: 12)
search: string (optional)
category: string (optional) - Todos, Semillas, Sustratos, Nutrientes, Equipamiento, Otros
minPrice: int (optional)
maxPrice: int (optional)
sortBy: string (optional) - newest, price_asc, price_desc, stock
isVerified: boolean (optional)
wishlistedOnly: boolean (optional)
```

**Respuesta Exitosa** (200):

```json
{
  "products": [
    {
      "id": 1,
      "name": "Semillas Auto",
      "description": "Pack de 5 semillas",
      "category": "Semillas",
      "price": 50,
      "stock": 10,
      "imageUrl": "https://...",
      "sellerId": 2,
      "seller": {
        "username": "vendedor123",
        "isVerified": true
      },
      "status": "Active",
      "isWishlisted": false,
      "avgRating": 4.5,
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "totalPages": 3,
  "currentPage": 1
}
```

---

### POST `/api/market`

**Descripción**: Crea un nuevo producto.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body** (FormData):

```
name: string (required)
description: string (optional)
category: string (required)
price: int (required)
stock: int (required)
image: File (optional)
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "name": "Semillas Auto",
  "price": 50,
  "stock": 10,
  "sellerId": 1,
  "status": "Active",
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

### PUT `/api/market/:id`

**Descripción**: Actualiza un producto existente.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "price": "int (optional)",
  "stock": "int (optional)",
  "status": "string (optional)"
}
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "name": "Semillas Auto (Actualizado)",
  "price": 45,
  "stock": 15
}
```

---

### DELETE `/api/market/:id`

**Descripción**: Elimina un producto.

**Headers**:

```
Authorization: Bearer <token>
```

**Parámetros URL**:

- `id`: Int (productId)

**Respuesta Exitosa** (200):

```json
{
  "message": "Producto eliminado"
}
```

---

### POST `/api/market/wishlist`

**Descripción**: Agrega/remueve producto de wishlist.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "productId": 1
}
```

**Respuesta Exitosa** (200):

```json
{
  "message": "Producto agregado a favoritos"
}
```

```json
{
  "message": "Producto removido de favoritos"
}
```

---

### GET `/api/notifications`

**Descripción**: Obtiene notificaciones del usuario.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "message": "Nuevo producto en tu categoría favorita",
    "isRead": false,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### POST `/api/notifications/read`

**Descripción**: Marca notificaciones como leídas.

**Headers**:

```
Authorization: Bearer <token>
```

**Body**: Ninguno

**Respuesta Exitosa** (200):

```json
{
  "message": "Notificaciones marcadas como leídas"
}
```

---

### POST `/api/orders`

**Descripción**: Crea una nueva orden de compra.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

**Respuesta Exitosa** (200):

```json
{
  "order": {
    "id": 1,
    "buyerId": 1,
    "totalPrice": 100,
    "status": "Pendiente",
    "items": [...]
  },
  "newBalance": 50
}
```

**Respuesta Error** (400):

```json
{
  "error": "Saldo insuficiente"
}
```

---

### GET `/api/orders`

**Descripción**: Obtiene órdenes de compra del usuario.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "totalPrice": 100,
    "status": "Pendiente",
    "items": [...],
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### GET `/api/orders/sales`

**Descripción**: Obtiene historial de ventas del usuario.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "buyer": {
      "username": "comprador123"
    },
    "totalPrice": 100,
    "status": "Entregado",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### POST `/api/orders/:id/review`

**Descripción**: Crea una reseña para una orden.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "rating": 5,
  "comment": "Excelente producto"
}
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "rating": 5,
  "comment": "Excelente producto",
  "orderId": 1,
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

## Módulo: Forum

### GET `/api/forum`

**Descripción**: Obtiene posts del foro con filtros.

**Headers**:

```
Authorization: Bearer <token>
```

**Query Parameters**:

```
category: string (optional) - Todos, Clases, Investigaciones, FAQ, Debates, Papers, Noticias, Anuncios
sortBy: string (optional) - newest, oldest
search: string (optional)
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "title": "Guía de pH en Hidroponía",
    "content": "Contenido del post...",
    "category": "Clases",
    "youtubeLink": "https://youtube.com/...",
    "author": "usuario123",
    "authorId": 1,
    "likes": 15,
    "comments": 5,
    "attachments": [...],
    "reactions": [...],
    "isPinned": false,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### POST `/api/forum`

**Descripción**: Crea un nuevo post en el foro.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body** (FormData):

```
title: string (required)
content: string (required)
category: string (required)
youtubeLink: string (optional)
attachments: File[] (optional, max 5)
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "title": "Guía de pH",
  "content": "...",
  "category": "Clases",
  "authorId": 1,
  "attachments": [
    {
      "name": "guia.pdf",
      "url": "https://...",
      "type": "pdf"
    }
  ],
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

### POST `/api/forum/:id/comment`

**Descripción**: Agrega un comentario a un post.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "content": "Excelente post!"
}
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "content": "Excelente post!",
  "postId": 1,
  "authorId": 1,
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

### POST `/api/forum/:id/subscribe`

**Descripción**: Suscribe/desuscribe a un post.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
{
  "message": "Suscrito al post"
}
```

---

### POST `/api/forum/:id/react`

**Descripción**: Agrega/remueve reacción a un post.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "type": "Interesante"
}
```

**Respuesta Exitosa** (200):

```json
{
  "message": "Reacción agregada"
}
```

---

### GET `/api/forum/subscriptions`

**Descripción**: Obtiene posts suscritos del usuario.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "title": "Post suscrito",
    "author": "usuario123",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### DELETE `/api/forum/:id`

**Descripción**: Elimina un post (autor o admin).

**Headers**:

```
Authorization: Bearer <token>
```

**Parámetros URL**:

- `id`: Int (postId)

**Respuesta Exitosa** (200):

```json
{
  "message": "Post eliminado"
}
```

**Respuesta Error** (403):

```json
{
  "error": "No tienes permiso para eliminar este post"
}
```

---

## Módulo: Events

### GET `/api/events`

**Descripción**: Obtiene todos los eventos.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "title": "Taller de Hidroponía",
    "description": "Aprende los fundamentos",
    "date": "2026-02-15T00:00:00.000Z",
    "time": "18:00",
    "location": "Citronella Club",
    "requirements": "Ninguno",
    "flyerUrl": "https://...",
    "capacity": 50,
    "categories": [
      {
        "id": 1,
        "name": "General",
        "price": 0,
        "benefits": "Acceso al taller"
      }
    ],
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### POST `/api/events`

**Descripción**: Crea un nuevo evento (solo ADMIN).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body** (FormData):

```
title: string (required)
description: string (required)
date: string (required) - ISO 8601
time: string (required)
location: string (required)
requirements: string (optional)
capacity: int (required)
categories: string (required) - JSON array
flyer: File (optional)
```

**Ejemplo categories**:

```json
[
  {
    "name": "General",
    "price": 0,
    "benefits": "Acceso al taller"
  },
  {
    "name": "VIP",
    "price": 50,
    "benefits": "Acceso + Material"
  }
]
```

**Respuesta Exitosa** (200):

```json
{
  "id": 1,
  "title": "Taller de Hidroponía",
  "categories": [...],
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

**Respuesta Error** (403):

```json
{
  "error": "Acceso denegado: Se requiere rol de administrador"
}
```

---

### POST `/api/events/reserve`

**Descripción**: Reserva una entrada a un evento.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "categoryId": 1
}
```

**Respuesta Exitosa** (200):

```json
{
  "message": "Reserva confirmada con éxito",
  "tokens": 50,
  "reservation": {
    "id": 1,
    "userId": 1,
    "categoryId": 1,
    "qrCode": "CITRO-1-1-1234567890",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

**Respuesta Error** (400):

```json
{
  "error": "Evento agotado"
}
```

```json
{
  "error": "Saldo de tokens insuficiente"
}
```

**Lógica Especial**:

- Valida aforo del evento
- Deduce tokens del usuario
- Genera QR code simulado
- Transacción atómica (Prisma.$transaction)

---

### GET `/api/events/my-reservations`

**Descripción**: Obtiene reservas del usuario.

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "qrCode": "CITRO-1-1-1234567890",
    "category": {
      "name": "General",
      "price": 0,
      "event": {
        "title": "Taller de Hidroponía",
        "date": "2026-02-15T00:00:00.000Z"
      }
    },
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

## Módulo: Admin

### POST `/api/admin/verify`

**Descripción**: Verifica contraseña de staff.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "password": "cradilly"
}
```

**Respuesta Exitosa** (200):

```json
{
  "valid": true
}
```

**Respuesta Error** (401):

```json
{
  "valid": false
}
```

---

### GET `/api/admin/users`

**Descripción**: Obtiene lista de usuarios (solo ADMIN).

**Headers**:

```
Authorization: Bearer <token>
```

**Respuesta Exitosa** (200):

```json
[
  {
    "id": 1,
    "username": "usuario123",
    "tokens": 150,
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### POST `/api/admin/tokens`

**Descripción**: Actualiza tokens de un usuario (solo ADMIN).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "userId": 1,
  "amount": 50
}
```

**Respuesta Exitosa** (200):

```json
{
  "message": "Tokens actualizados",
  "newBalance": 200
}
```

---

### POST `/api/admin/legal`

**Descripción**: Actualiza contenido legal (solo ADMIN).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "type": "terms",
  "content": "Términos y condiciones..."
}
```

**Respuesta Exitosa** (200):

```json
{
  "message": "Contenido legal actualizado"
}
```

---

### POST `/api/admin/forum/:postId`

**Descripción**: Modera un post del foro (solo ADMIN).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "action": "pin"
}
```

**Acciones disponibles**:

- `pin`: Fijar post
- `unpin`: Desfijar post
- `protect`: Hacer inmutable
- `delete`: Eliminar post

**Respuesta Exitosa** (200):

```json
{
  "message": "Post fijado exitosamente"
}
```

---

## Sistema de Tokens (Economía Interna)

### Flujo de Tokens

```
Registro → +100 tokens
Compra de producto → -precio tokens
Venta de producto → +precio tokens
Reserva de evento → -precio tokens
Admin: Carga manual → +N tokens
```

### Validaciones

- Saldo mínimo: 0 tokens
- No se permiten saldos negativos
- Transacciones atómicas con Prisma.$transaction

---

## Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sin permisos |
| 404 | Not Found | Recurso no encontrado |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

---

## Autenticación JWT

### Estructura del Token

```json
{
  "id": 1,
  "role": "USER",
  "isDev": false,
  "iat": 1705329600,
  "exp": 1705416000
}
```

### Middleware de Autenticación

```javascript
// server/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        
        // Bypass para tokens de desarrollador
        if (verified.isDev === true) {
            console.log('[MIDDLEWARE BYPASS] Developer token detected');
        }
        
        next();
    } catch (err) {
        res.status(400).json({ error: 'Token inválido' });
    }
};
```

---

## Rate Limiting

### Email Verification

- **Límite**: 1 email cada 5 minutos
- **Implementación**: Timestamp en `lastVerificationSent`
- **Respuesta**: 429 con tiempo restante

---

## Versión de la API

**Versión**: 1.0.0
**Última actualización**: Enero 2026
