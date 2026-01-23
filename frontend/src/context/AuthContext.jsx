import { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isStaff, setIsStaff] = useState(false);
    const [loading, setLoading] = useState(true);

    const clearSession = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('isStaff');
        setUser(null);
        setIsStaff(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const staffStatus = sessionStorage.getItem('isStaff') === 'true';
            setIsStaff(staffStatus);
            fetch(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Sesión inválida');
                    return res.json();
                })
                .then(data => {
                    if (data.username) {
                        setUser({
                            id: data.id,
                            username: data.username,
                            email: data.email,
                            tokens: data.tokens,
                            role: data.role,
                            isDev: data.isDev,
                            emailVerified: data.emailVerified
                        });
                        // Sincronización mandatoria de staff si el rol es ADMIN
                        if (data.role === 'ADMIN' || data.isDev) {
                            setIsStaff(true);
                            sessionStorage.setItem('isStaff', 'true');
                        }
                    } else {
                        clearSession();
                    }
                })
                .catch(() => clearSession())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                clearSession(); // Limpieza automática del error anterior
                // Usar el mensaje de error real del servidor
                throw new Error(data.error || 'Error de autenticación');
            }

            localStorage.setItem('token', data.token);

            setUser({
                id: data.id,
                username: data.username,
                email: data.email,
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
        } catch (e) {
            console.error('[AUTH CONTEXT ERROR]', e.message);
            clearSession();
            throw e; // Re-throw para que el componente pueda mostrar el error específico
        }
    };

    const register = async (username, password, email) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });

            const data = await res.json();

            if (!res.ok) {
                // Usar el mensaje de error real del servidor
                throw new Error(data.error || 'Falló el registro');
            }

            localStorage.setItem('token', data.token);
            setUser({
                id: data.id,
                username: data.username,
                email: data.email,
                tokens: data.tokens,
                role: data.role,
                isDev: data.isDev,
                emailVerified: data.emailVerified
            });
            return true;
        } catch (e) {
            console.error('[REGISTER ERROR]', e.message);
            throw e; // Re-throw para que el componente pueda mostrar el error específico
        }
    };

    const logout = () => {
        clearSession();
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    const updateEmail = async (email) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/auth/update-email`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error('Error al actualizar email');
            const data = await res.json();
            setUser(prev => ({ ...prev, email: data.email, emailVerified: data.emailVerified }));
            return { success: true, message: data.message };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    };

    const verifyStaff = async (password) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/admin/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                const data = await res.json();
                setIsStaff(true);
                sessionStorage.setItem('isStaff', 'true');
                setUser(prev => ({ ...prev, role: data.role, isDev: true }));
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateUser,
        updateEmail,
        isStaff,
        verifyStaff,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
