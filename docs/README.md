# Citro Web 2.0 - Documentación Técnica

## Índice de Documentos

Esta carpeta contiene la documentación técnica completa de Citro Web 2.0, organizada en 6 documentos principales:

### 01. [Architecture Overview](./01_architecture_overview.md)

**Descripción**: Infraestructura y stack tecnológico completo.

**Contenido**:

- Stack tecnológico (Frontend, Backend, Servicios Externos)
- Diagrama de arquitectura del sistema
- Flujo de datos cliente-servidor
- Gestión de variables de entorno
- Configuración de proxy de desarrollo
- Estructura de directorios
- Seguridad y escalabilidad

---

### 02. [Database Schema](./02_database_schema.md)

**Descripción**: Modelado de datos y diccionario completo.

**Contenido**:

- Diccionario de datos de todas las tablas
- Descripción de columnas, tipos y propósitos
- Diagrama de relaciones (ERD)
- Claves foráneas y cascadas
- Índices y optimizaciones
- Comandos de migración con Prisma

---

### 03. [Backend API Reference](./03_backend_api_reference.md)

**Descripción**: Referencia completa de endpoints y lógica.

**Contenido**:

- Todos los endpoints organizados por módulos:
  - Authentication
  - Crops (Mi Cultivo)
  - Marketplace
  - Forum
  - Events
  - Admin
- Formato de requests y responses
- Códigos de estado HTTP
- Sistema de tokens (economía)
- Autenticación JWT
- Lógica del Bypass de Super Admin

---

### 04. [Frontend Documentation](./04_frontend_documentation.md)

**Descripción**: Componentes, rutas y estado global.

**Contenido**:

- Estructura de carpetas del frontend
- AuthContext (manejo de sesión y roles)
- Rutas protegidas
- Componentes principales:
  - Layout
  - VerificationBanner
  - VerificationGuard
  - HealthCheck
- Páginas principales
- Estilos globales y variables CSS
- Manejo de errores
- Multimedia players

---

### 05. [Business Rules & Logic](./05_business_rules_logic.md)

**Descripción**: Reglas de negocio y políticas del sistema.

**Contenido**:

- Sistema de economía (tokens)
- Niveles de acceso:
  - Usuario No Verificado
  - Usuario Verificado
  - Administrador
  - Super Admin (Desarrollador)
- Políticas de contenido:
  - Marketplace
  - Foro
  - Eventos
- Reglas de validación
- Reglas de seguridad
- Integridad referencial

---

### 06. [Email Verification Flow (Brevo)](./06_verification_flow_brevo.md)

**Descripción**: Sistema de verificación de email con Brevo API.

**Contenido**:

- Arquitectura del sistema de verificación
- Componentes del sistema:
  - mailService.js
  - authController.js
  - AuthContext.jsx
  - VerificationBanner.jsx
  - VerificationGuard.jsx
- Diagrama de flujo completo
- Diagrama de estados
- Rate limiting
- Seguridad
- Variables de entorno requeridas

---

## Cómo Usar Esta Documentación

### Para Desarrolladores Nuevos

1. Comienza con [01_architecture_overview.md](./01_architecture_overview.md) para entender la arquitectura general
2. Revisa [02_database_schema.md](./02_database_schema.md) para familiarizarte con el modelo de datos
3. Consulta [03_backend_api_reference.md](./03_backend_api_reference.md) para conocer los endpoints disponibles
4. Lee [04_frontend_documentation.md](./04_frontend_documentation.md) para entender la estructura del frontend

### Para Resolución de Errores

1. Identifica el módulo afectado (Auth, Marketplace, Foro, etc.)
2. Consulta la sección correspondiente en [03_backend_api_reference.md](./03_backend_api_reference.md)
3. Revisa las reglas de negocio en [05_business_rules_logic.md](./05_business_rules_logic.md)
4. Verifica el esquema de datos en [02_database_schema.md](./02_database_schema.md)

### Para Nuevas Funcionalidades

1. Define las reglas de negocio según [05_business_rules_logic.md](./05_business_rules_logic.md)
2. Diseña el modelo de datos según [02_database_schema.md](./02_database_schema.md)
3. Implementa endpoints siguiendo el patrón de [03_backend_api_reference.md](./03_backend_api_reference.md)
4. Crea componentes frontend según [04_frontend_documentation.md](./04_frontend_documentation.md)

---

## Mantenimiento de la Documentación

**Responsabilidad**: Todo desarrollador que modifique el código debe actualizar la documentación correspondiente.

**Frecuencia**: Actualizar inmediatamente después de cambios significativos.

**Versionado**: Incluir fecha de última actualización en cada documento.

---

## Contacto y Soporte

**Proyecto**: Citro Web 2.0
**Versión**: 1.0.0
**Última Actualización**: Enero 2026

---

## Licencia

Documentación interna de Citronella Club.
Todos los derechos reservados.
