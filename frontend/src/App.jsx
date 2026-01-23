import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { useEffect } from 'react';

// Pages
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Forum from './pages/Forum';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Events from './pages/Events';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Terms from './pages/Terms';

// Componente para proteger rutas
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ padding: '20px', color: '#8b949e' }}>Verificando sesión...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return children;
}

function AppRoutes() {
    const { checkAuth, user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const verified = urlParams.get('verified');
        const token = urlParams.get('token');

        if (verified === 'success') {
            // Limpiar localStorage para forzar re-autenticación
            localStorage.clear();
            sessionStorage.clear();

            // Si hay un nuevo token de verificación, guardarlo
            if (token) {
                localStorage.setItem('token', token);
            }

            // Forzar refresco del perfil después de verificación
            checkAuth().then(() => {
                // Limpiar URL params y redirigir sin reload
                window.history.replaceState({}, '', '/menu');
            });
        }
    }, [location.search, checkAuth]);

    return (
        <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas privadas bajo Layout */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/micultivo" replace />} />
                <Route path="micultivo" element={<Dashboard />} />
                <Route path="gtl" element={<Market />} />
                <Route path="foro" element={<Forum />} />
                <Route path="eventos" element={<Events />} />
                <Route path="pedidos" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="perfil" element={<Profile />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="terminos" element={<Terms />} />

                {/* Fallback para rutas no encontradas dentro de layout */}
                <Route path="*" element={<Navigate to="/micultivo" replace />} />
            </Route>

            {/* Fallback global */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
