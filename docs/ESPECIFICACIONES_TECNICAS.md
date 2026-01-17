# Especificaciones Técnicas - Cultivo Virtual (MVP Fullstack)

## 1. Arquitectura del Sistema
El sistema ha migrado de una SPA simulada a una arquitectura **Cliente-Servidor (Fullstack)** real.

### Diagrama General
[Cliente (Browser)] <--> [Servidor (Node.js/Express)] <--> [Base de Datos (PostgreSQL)]

### Tecnologías
*   **Frontend:** HTML5, CSS3 (Dark Mode, Vanilla), JavaScript (ES6+).
    *   **Arquitectura:** SPA (Single Page Application) con enrutamiento propio (`app.js`).
    *   **Estilos:** Sistema de diseño propio centralizado en `styles.css`.
*   **Backend:** Node.js, Express.js.
    *   **Autenticación:** JWT (JSON Web Tokens) y Bcrypt para hashing.
*   **Base de Datos:** PostgreSQL.
    *   **ORM:** Prisma.
*   **Infraestructura:** Compatible con despliegue en contenedores (Docker/Easypanel).

## 2. Estructura del Código
```
/project-root
 ├── client/             # Frontend Estático
 │    ├── css/           # Estilos globales (styles.css)
 │    ├── js/            # Lógica cliente
 │    │    ├── app.js    # Router y lógica global
 │    │    ├── state.js  # Gestión de estado y API calls
 │    │    └── ui-utils.js # Utilidades UI
 │    ├── pages/         # Vistas HTML (micultivo, gtl, foro, etc.)
 │    ├── index.html     # Layout Maestro
 │    └── login.html     # Página de Acceso/Registro
 ├── server/             # Backend API
 │    ├── controllers/   # Lógica de negocio (authController.js)
 │    ├── routes/        # Definición de endpoints
 │    ├── server.js      # Entry point
 │    └── auth.js        # Middleware seguridad
 ├── prisma/             # Configuración DB
 │    └── schema.prisma  # Modelos de datos
 └── .env                # Variables de entorno
```

## 3. Estado de la Implementación (Actual)

### Implementado (Funcional) ✅
*   **Base de Datos:** Connection pooling con PostgreSQL y migraciones vía Prisma.
*   **Autenticación:** Registro y Login completos con validación de credenciales y seguridad (Hashing).
*   **Navegación:** Sidebar responsivo y enrutamiento dinámico sin recarga.
*   **Gestión de Estado:** `state.js` centralizado consumiendo API REST.

### En Desarrollo / Pendiente 🚧
*   **Perfil de Usuario:** Actualmente visible resumido en el Sidebar. Falta página dedicada de edición.
*   **Lógica de Cultivo:** La visualización básica existe, pero la interactividad (reglaje de pH/EC, cosecha) del código original requiere reconexión con la nueva API.
*   **Marketplace & Foro:** Las vistas existen pero cargan datos estáticos o placeholders; falta integración total con endpoints backend.

## 4. Esquema de Base de Datos (Prisma)
Modelos principales definidos:
*   `User`: Gestión de identidad y saldo de tokens.
*   `Crop`: Plantas activas del usuario.
*   `CropLog`: Historial semanal de parámetros (pH, EC, Nutrientes).

## 5. API Endpoints
*   `POST /api/auth/register`: Registro de nuevos usuarios.
*   `POST /api/auth/login`: Autenticación y obtención de Token.
*   `GET /api/crops`: Obtención de cultivos del usuario (Protegido).
*   `POST /api/crops/:id/logs`: Guardado de bitácora semanal (Protegido).

## 6. Siguientes Pasos Técnicos para Completitud
1.  **Refactorizar Vistas Específicas:** Adaptar `micultivo.html` y `market.html` para usar plenamente `window.State`.
2.  **Endpoint Perfil:** Crear `PUT /api/users/me` para actualizar datos de usuario.
3.  **Tests de Integración:** Verificar flujo completo de cultivo.
