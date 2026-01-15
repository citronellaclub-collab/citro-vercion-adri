# 🛠️ Especificaciones Técnicas: Cultivo Virtual

## 1. Visión General de Arquitectura
El sistema opera actualmente como una **Aplicación de Página Única (SPA) simulada**, construida con tecnologías web estándar (Vanilla JS), sin dependencias de frameworks externos (React, Vue, etc.) para maximizar la compatibilidad y simplicidad.

### Diagrama de Arquitectura
```mermaid
graph TD
    Client[Navegador del Usuario]
    LS[(LocalStorage)]
    
    subgraph "Core System"
        Index[index.html] -- Carga --> CSS[styles.css]
        Index -- Carga --> AppJS[app.js]
        Index -- Carga --> StateJS[state.js]
    end
    
    subgraph "Módulos Dinámicos"
        AppJS -- fetch() --> Pages[Fragmentos HTML (pages/)]
        Pages -- Ejecuta --> Controllers[Controladores IIFE (GTL, Cultivo, Foro)]
    end
    
    StateJS <-- Lee/Escribe --> LS
    Controllers -- Usa --> StateJS
```

---

## 2. Stack Tecnológico
*   **Frontend Core**: HTML5, CSS3 (Sistema de diseño propio), JavaScript (ES6+).
*   **Gestión de Estado**: `state.js` (Store centralizado observable).
*   **Router**: Personalizado en `app.js`, carga dinámica de fragmentos HTML vía `fetch`.
*   **Persistencia**: `window.localStorage` (Base de datos NoSQL del lado del cliente).
*   **Integración**: Módulos independientes encapsulados (IIFE) para evitar colisiones en el scope global.

---

## 3. Modelo de Datos (Esquema LocalStorage)
La aplicación persiste sus datos en el navegador del usuario bajo la clave `cultivo_state` y claves auxiliares modulares.

### Objeto de Estado Global
```json
{
  "user": { "username": "string", "role": "string" },
  "tokens": "number (integer)",
  "cart": [
    { "id": "string", "qty": "number", "price": "number" }
  ],
  "plants": "array"
}
```

### Módulos Específicos
*   **Mi Cultivo**: Claves dinámicas `cultivo_{baldeID}_{semana}`.
*   **Foro**: Array de objetos post en `foro_posts`.
*   **GTL**: Inventario en `gtl_items`.

---

## 4. Estructura de Código
*   `/js/app.js`: Motor de enrutamiento. Carga vistas y ejecuta sus scripts de inicialización (`pageInit`).
*   `/js/state.js`: Facade para el acceso a datos. Expone métodos `addTokens`, `addToCart`, etc.
*   `/js/sidebar.js`: Maneja la navegación visual y eventos del menú.
*   `/pages/*.html`: Vistas. Contienen su propio CSS scoped y lógica JS encapsulada.

## 5. Limitaciones y Consideraciones de Seguridad
> [!WARNING]
> La versión actual es **Client-Side Only**.
*   **Seguridad**: Toda la lógica de validación de tokens reside en el cliente. Un usuario avanzado podría modificar su saldo de tokens editando el LocalStorage.
*   **Persistencia**: Los datos viven en el dispositivo del usuario. Si borra la caché, pierde sus datos (excepto backups manuales).

## 6. Escalabilidad Futura (Roadmap Técnico)
Para pasar a fase de producción masiva, se recomienda:
1.  **Backend API**: Migrar `state.js` para que consuma una API REST (Node.js/Python).
2.  **Base de Datos**: Reemplazar LocalStorage por MongoDB o PostgreSQL.
3.  **Autenticación**: Implementar JWT real en lugar de simulación local.
