# Historias de Usuario - Cultivo Virtual

## Estado del Proyecto: MVP Fase 1 Completada
> **Nota:** Se ha completado la infraestructura base, el registro y login. Las funcionalidades específicas de cultivo y mercado están en proceso de integración completa con el nuevo backend.

---

## Módulo 1: Acceso y Perfil (✅ Parcialmente Completado)

### HU-01: Registro de Nuevo Jardinero ✅
**Como** nuevo usuario  
**Quiero** poder crear una cuenta con usuario y contraseña  
**Para** tener mi propio espacio de cultivo y guardar mi progreso.  
*Criterios de Aceptación:*
*   Validación de usuario único.
*   Contraseña encriptada.
*   Asignación automática de 100 Tokens iniciales.

### HU-02: Inicio de Sesión Seguro ✅
**Como** usuario registrado  
**Quiero** ingresar con mis credenciales  
**Para** acceder a mis plantas y datos guardados.

### HU-03: Visualización de Perfil (🚧 En Progreso)
**Como** usuario  
**Quiero** ver mi avatar y saldo de tokens en todo momento  
**Para** saber con qué recursos cuento.  
*Estado:* Visible en Sidebar. Falta página de detalles y edición.

---

## Módulo 2: Mi Cultivo (🚧 En Refactorización)

### HU-04: Gestión de Plantas
**Como** cultivador  
**Quiero** ver el estado (pH, EC) de mis plantas  
**Para** tomar decisiones de cuidado.  
*Estado:* API lista (`GET /crops`). Falta conectar interactividad frontend completa.

### HU-05: Bitácora Semanal
**Como** cultivador  
**Quiero** registrar los nutrientes y mediciones de la semana  
**Para** ver la evolución de mi planta.  
*Estado:* Endpoint listo (`POST /logs`). Falta formulario frontend conectado.

---

## Módulo 3: GTL Marketplace (📅 Pendiente)

### HU-06: Compra de Insumos
**Como** usuario con tokens  
**Quiero** comprar semillas y fertilizantes  
**Para** mejorar mi cultivo.

---

## Módulo 4: Comunidad (📅 Pendiente)

### HU-07: Foro de Discusión
**Como** miembro de la comunidad  
**Quiero** leer y escribir posts  
**Para** compartir conocimientos.
