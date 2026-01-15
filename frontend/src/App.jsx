import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Forum from './pages/Forum'; // NEW
import Login from './pages/Login';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/micultivo" />} />
                <Route path="micultivo" element={<Dashboard />} />
                <Route path="gtl" element={<Market />} />
                <Route path="foro" element={<Forum />} />
                <Route path="pedidos" element={<div style={{ padding: '20px' }}><h2>📦 Historial de Pedidos</h2><p>No tienes pedidos recientes.</p></div>} />
            </Route>
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
