import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Forum from './pages/Forum';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Events from './pages/Events';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

// Componente para proteger rutas
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ padding: '20px', color: '#8b949e' }}>Verificando sesión...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return children;
}

function AppRoutes() {
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
                <Route path="terminos" element={<div style={{ padding: '20px' }}><h2>📜 Términos y Condiciones</h2><p>Contrato de uso.</p></div>} />

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
