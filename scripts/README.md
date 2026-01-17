# Database Maintenance Scripts

Esta carpeta contiene scripts de mantenimiento para la base de datos y diagnóstico del sistema.

## Scripts Disponibles

### 🔍 Diagnóstico y Salud del Sistema

#### `comprehensive-healthcheck.js`
**Comando:** `npm run db:health`

Realiza un diagnóstico completo del sistema:
- ✅ Verifica conexión a base de datos
- ✅ Valida variables de entorno críticas
- ✅ Comprueba esquema de base de datos
- ✅ Verifica tablas y columnas requeridas
- ✅ Prueba creación de usuarios
- 🔧 **Aplica correcciones automáticas** cuando encuentra problemas

**Uso recomendado:** Ejecutar antes de cualquier despliegue o cuando hay errores 500.

### 🛠️ Reparación de Base de Datos

#### `add-missing-fields.js`
**Comando:** `npm run db:add-fields`

Agrega campos y tablas faltantes a la base de datos para sincronizarla con el schema de Prisma actual.

**Corrige:**
- Campos de email y verificación en tabla User
- Tablas faltantes (Event, TicketCategory, Reservation, etc.)
- Índices únicos faltantes
- Relaciones de clave foránea

### 🔄 Reset Completo

#### `reset-db.js`
**Comando:** `npm run db:reset`

**⚠️ DESTRUCTIVO:** Elimina TODOS los datos de la base de datos.

**Proceso:**
1. Elimina datos en orden de dependencias (Reservations → Events → etc.)
2. Elimina todos los usuarios
3. Resetea secuencias de auto-incremento

**Uso:** Solo en desarrollo cuando necesitas un estado completamente limpio.

### 👤 Usuario de Prueba

#### `create-test-user.js`
**Comando:** `npm run db:test-user`

Crea un usuario de prueba para desarrollo:
- **Username:** `testuser`
- **Password:** `testpass123`
- **Email:** `test@example.com`
- **Email verificado:** Sí (para facilitar pruebas)

### 📧 Corrección de Emails

#### `fix-missing-emails.js`
**Comando:** `npm run db:fix-emails`

Corrige problemas específicos con emails nulos en cuentas existentes.

## 🚀 Flujo de Solución de Problemas

### Si hay errores 500 en autenticación:

1. **Diagnóstico:** `npm run db:health`
   - Identifica problemas automáticamente
   - Aplica correcciones cuando posible

2. **Si faltan campos:** `npm run db:add-fields`
   - Sincroniza esquema de base de datos

3. **Si necesitas datos limpios:** `npm run db:reset`
   - ⚠️ Elimina todo, luego `npm run db:test-user`

4. **Para desarrollo:** `npm run db:test-user`
   - Crea usuario de prueba para testing

## 📋 Variables de Entorno Requeridas

Asegúrate de tener estas variables configuradas:

### Obligatorias:
- `DATABASE_URL` - Conexión a PostgreSQL
- `JWT_SECRET` - Clave para tokens JWT

### Opcionales:
- `BREVO_API_KEY` - Para envío de emails
- `STAFF_PASSWORD` - Acceso de desarrollador

## 🔧 Comandos Útiles

```bash
# Diagnóstico completo
npm run db:health

# Reparar esquema
npm run db:add-fields

# Reset completo (⚠️ Destructivo)
npm run db:reset

# Crear usuario de prueba
npm run db:test-user

# Corregir emails
npm run db:fix-emails
```

## 📊 Estados de Salida

- `0`: Éxito
- `1`: Error encontrado
- `2`: Error de ejecución

Los scripts registran mensajes detallados en consola para facilitar la depuración.