# Citro Web 2.0 - Frontend Documentation

## Estructura de Carpetas

```
frontend/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── Layout.jsx        # Layout principal con sidebar
│   │   ├── HealthCheck.jsx   # Indicador de conexión
│   │   ├── VerificationBanner.jsx  # Banner de verificación de email
│   │   └── VerificationGuard.jsx   # Soft block para usuarios no verificados
│   ├── context/              # Estado global
│   │   └── AuthContext.jsx   # Autenticación y usuario
│   ├── pages/                # Páginas/Rutas
│   │   ├── Login.jsx         # Login y registro
│   │   ├── MiCultivo.jsx     # Gestión de cultivos
│   │   ├── Market.jsx        # Marketplace
│   │   ├── Forum.jsx         # Foro multimodal
│   │   ├── Events.jsx        # Eventos
│   │   ├── Orders.jsx        # Historial de canjes
│   │   ├── Profile.jsx       # Perfil de usuario
│   │   ├── AdminPanel.jsx    # Panel de administración
│   │   └── Terms.jsx         # Términos legales
│   ├── styles/               # Estilos globales
│   │   └── index.css         # Variables CSS y estilos base
│   ├── App.jsx               # Router principal
│   └── main.jsx              # Entry point
├── index.html                # HTML base
├── vite.config.js            # Configuración de Vite
└── package.json              # Dependencias
```

---

## AuthContext (Estado Global)

### Archivo: `src/context/AuthContext.jsx`

**Descripción**: Maneja autenticación, sesión y estado del usuario.

### Estado

```javascript
const [user, setUser] = useState(null);
const [isStaff, setIsStaff] = useState(false);
const [loading, setLoading] = useState(true);
```

### Estructura del Usuario

```javascript
{
  id: 1,
  username: "usuario123",
  tokens: 150,
  role: "USER",          // USER | ADMIN
  isDev: false,
  emailVerified: true
}
```

### Métodos Expuestos

#### `login(username, password)`

**Descripción**: Autentica usuario y almacena token.

**Retorno**: `boolean` (éxito/fallo)

**Lógica**:

```javascript
const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setUser({
            id: data.id,
            username: data.username,
            tokens: data.tokens,
            role: data.role,
            isDev: data.isDev,
            emailVerified: data.emailVerified
        });
        
        if (data.role === 'ADMIN' || data.isDev) {
            setIsStaff(true);
            sessionStorage.setItem('isStaff', 'true');
        }
        
        return true;
    }
    
    return false;
};
```

---

#### `register(username, password)`

**Descripción**: Registra nuevo usuario.

**Retorno**: `boolean` (éxito/fallo)

---

#### `logout()`

**Descripción**: Cierra sesión y limpia storage.

**Lógica**:

```javascript
const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('isStaff');
    setUser(null);
    setIsStaff(false);
    navigate('/login');
};
```

---

#### `updateUser(updates)`

**Descripción**: Actualiza estado del usuario (ej: tokens).

**Parámetros**:

```javascript
updateUser({ tokens: 200 });
```

---

#### `verifyStaff(password)`

**Descripción**: Verifica contraseña de staff.

**Retorno**: `boolean`

---

### Persistencia de Sesión

**Token**: `localStorage.getItem('token')`
**Staff Status**: `sessionStorage.getItem('isStaff')`

**Restauración automática**:

```javascript
useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setUser(data);
            if (data.role === 'ADMIN' || data.isDev) {
                setIsStaff(true);
            }
        })
        .catch(() => clearSession());
    }
}, []);
```

---

## Rutas Protegidas

### Componente: `ProtectedRoute`

**Archivo**: `src/App.jsx`

**Lógica**:

```javascript
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div>Cargando...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}
```

### Rutas Definidas

```javascript
<Routes>
    <Route path="/login" element={<Login />} />
    
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/micultivo" />} />
        <Route path="/micultivo" element={<MiCultivo />} />
        <Route path="/gtl" element={<Market />} />
        <Route path="/foro" element={<Forum />} />
        <Route path="/eventos" element={<Events />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/terminos" element={<Terms />} />
    </Route>
</Routes>
```

---

## Componentes Principales

### Layout.jsx

**Descripción**: Layout principal con sidebar y navegación.

**Estructura**:

```
┌─────────────────────────────────────┐
│  Sidebar         │  Main Content    │
│  ┌────────────┐  │  ┌────────────┐  │
│  │ Logo       │  │  │ Verif.     │  │
│  │ Nav Items  │  │  │ Banner     │  │
│  │ - Cultivo  │  │  │            │  │
│  │ - GTL      │  │  │ <Outlet /> │  │
│  │ - Foro     │  │  │            │  │
│  │ - Eventos  │  │  │            │  │
│  │ - Pedidos  │  │  │            │  │
│  │ - Perfil   │  │  │            │  │
│  │ - Staff*   │  │  │            │  │
│  │ - Términos │  │  │            │  │
│  │            │  │  │            │  │
│  │ User Info  │  │  │            │  │
│  │ Logout     │  │  │            │  │
│  └────────────┘  │  └────────────┘  │
└─────────────────────────────────────┘
```

**Navegación Dinámica**:

```javascript
const navItems = [
    { label: 'Mi Cultivo', path: '/micultivo', icon: <Home /> },
    { label: 'Intercambio GTL', path: '/gtl', icon: <ShoppingCart /> },
    { label: 'Foro', path: '/foro', icon: <MessageSquare /> },
    { label: 'Eventos', path: '/eventos', icon: <Calendar /> },
    { label: 'Mis Canjes', path: '/pedidos', icon: <Package /> },
    { label: 'Mi Perfil', path: '/perfil', icon: <User /> },
    ...(isStaff ? [{ label: 'Panel Staff', path: '/admin', icon: <Shield /> }] : []),
    { label: 'Términos', path: '/terminos', icon: <FileText /> },
];
```

---

### VerificationBanner.jsx

**Descripción**: Banner persistente para usuarios no verificados.

**Visibilidad**: `!user.emailVerified`

**Funcionalidades**:

- Botón "Reenviar Email"
- Feedback visual de éxito/error
- Botón para cerrar temporalmente

**Lógica de Reenvío**:

```javascript
const handleResend = async () => {
    const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (res.ok) {
        setMessage('✅ Email enviado');
    } else {
        const data = await res.json();
        setMessage(`❌ ${data.error}`);
    }
};
```

---

### VerificationGuard.jsx

**Descripción**: Componente de soft block para usuarios no verificados.

**Uso**:

```javascript
<VerificationGuard action="publicar productos">
    <FormularioPublicacion />
</VerificationGuard>
```

**Comportamiento**:

- Si `emailVerified === false`: Muestra mensaje de bloqueo
- Si `emailVerified === true`: Renderiza `children`

**Implementación**:

```javascript
export default function VerificationGuard({ children, action }) {
    const { user } = useAuth();
    
    if (!user?.emailVerified) {
        return (
            <div className="verification-block">
                <Lock size={48} />
                <h3>Verificación Requerida</h3>
                <p>Debes verificar tu email para {action}</p>
            </div>
        );
    }
    
    return children;
}
```

---

### HealthCheck.jsx

**Descripción**: Indicador de conexión con el backend.

**Estados**:

- 🟢 Verde: Conectado
- 🔴 Rojo: Desconectado

**Lógica**:

```javascript
useEffect(() => {
    const checkHealth = async () => {
        try {
            const res = await fetch('/api/health');
            setStatus(res.ok ? 'online' : 'offline');
        } catch {
            setStatus('offline');
        }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
}, []);
```

---

## Páginas Principales

### Login.jsx

**Funcionalidades**:

- Formulario de login
- Formulario de registro
- Alternar entre modos

**Validaciones**:

- Username: Mínimo 3 caracteres
- Password: Mínimo 6 caracteres

---

### MiCultivo.jsx

**Funcionalidades**:

- Crear cultivos
- Ver lista de cultivos
- Agregar logs semanales
- Ver historial de logs
- Gráficos de tendencias (pH, EC)

**Componentes**:

- Modal de creación de cultivo
- Modal de log semanal
- Tarjetas de cultivo
- Tabla de logs

---

### Market.jsx

**Funcionalidades**:

- Explorar productos
- Filtros (categoría, precio, verificados)
- Búsqueda
- Wishlist
- Crear publicaciones
- Carrito de compra
- Historial de pedidos

**Tabs**:

1. Explorar Ofertas
2. Crear Publicación
3. Mis Publicaciones
4. Favoritos

**Soft Block**:

```javascript
// Tab "Crear Publicación"
<VerificationGuard action="publicar productos">
    <FormularioProducto />
</VerificationGuard>
```

---

### Forum.jsx

**Funcionalidades**:

- Ver posts
- Filtros por categoría
- Búsqueda
- Crear posts
- Comentar
- Reacciones (Interesante, Útil, Científico)
- Suscripciones
- Modo lectura (fullscreen)

**Tipos de Contenido**:

- Texto
- Videos (YouTube/Vimeo embeds)
- Archivos adjuntos (PDF, DOCX, etc.)

**Soft Block**:

```javascript
// Modal de creación
<VerificationGuard action="crear posts">
    <FormularioPost />
</VerificationGuard>
```

---

### Events.jsx

**Funcionalidades**:

- Ver cartelera de eventos
- Modal de detalles
- Reservar entradas
- Ver mis reservas
- Crear eventos (admin)

**Categorías de Entrada**:

- General
- VIP
- Socio

---

### AdminPanel.jsx

**Funcionalidades** (Solo ADMIN):

- Gestión de tokens de usuarios
- Editor de contenido legal
- Moderación de foro
- Estadísticas

**Protección**:

```javascript
const { isStaff } = useAuth();

if (!isStaff) {
    return <Navigate to="/" />;
}
```

---

## Estilos Globales

### Archivo: `src/styles/index.css`

**Variables CSS**:

```css
:root {
    /* Colores */
    --bg-dark: #0d1117;
    --bg-panel: #161b22;
    --border: #30363d;
    --text-primary: #e6edf3;
    --text-secondary: #8b949e;
    --accent: #2ea043;
    --accent-light: #58a6ff;
    --danger: #f85149;
    
    /* Dimensiones */
    --sidebar-width: 260px;
    
    /* Transiciones */
    --transition: 0.2s ease;
}
```

**Clases Reutilizables**:

```css
.citro-card {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
}

.btn-primary {
    background: var(--accent);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
}

.btn-secondary {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-primary);
}
```

---

## Manejo de Errores

### Error Boundary

**Archivo**: `src/main.jsx`

```javascript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
    return (
        <div>
            <h1>Algo salió mal</h1>
            <pre>{error.message}</pre>
        </div>
    );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
</ErrorBoundary>
```

### Manejo de Errores de API

```javascript
try {
    const res = await fetch('/api/endpoint');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
    }
    const data = await res.json();
    // Procesar data
} catch (error) {
    console.error('Error:', error.message);
    // Mostrar feedback al usuario
}
```

---

## Multimedia Players

### YouTube Embed

```javascript
function YouTubePlayer({ url }) {
    const videoId = url.split('v=')[1];
    return (
        <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope"
            allowFullScreen
        />
    );
}
```

### PDF Viewer

```javascript
function PDFViewer({ url }) {
    return (
        <iframe
            src={url}
            width="100%"
            height="600px"
        />
    );
}
```

---

## Optimizaciones

### Lazy Loading

```javascript
import { lazy, Suspense } from 'react';

const AdminPanel = lazy(() => import('./pages/AdminPanel'));

<Suspense fallback={<div>Cargando...</div>}>
    <AdminPanel />
</Suspense>
```

### Debouncing (Búsqueda)

```javascript
useEffect(() => {
    const timeout = setTimeout(() => {
        fetchProducts(search);
    }, 400);
    
    return () => clearTimeout(timeout);
}, [search]);
```

---

## Responsive Design

**Breakpoints**:

```css
/* Mobile */
@media (max-width: 768px) {
    --sidebar-width: 0;
    /* Sidebar colapsable */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
    /* Ajustes intermedios */
}

/* Desktop */
@media (min-width: 1025px) {
    /* Layout completo */
}
```

---

## Iconografía

**Librería**: Lucide React

**Iconos Comunes**:

- `Home`: Mi Cultivo
- `ShoppingCart`: Marketplace
- `MessageSquare`: Foro
- `Calendar`: Eventos
- `Package`: Pedidos
- `User`: Perfil
- `Shield`: Admin
- `FileText`: Términos
- `Lock`: Verificación requerida
- `Mail`: Email
- `AlertTriangle`: Advertencia

---

## Versión del Frontend

**Versión**: 1.0.0
**Última actualización**: Enero 2026
**Framework**: React 18.2.0
**Build Tool**: Vite 5.4.21
