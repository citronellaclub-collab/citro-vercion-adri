import { createContext, useContext, useState, useEffect } from 'react';

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
            fetch('/api/auth/me', {
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
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                clearSession(); // Limpieza automática del error anterior
                throw new Error('Credenciales inválidas');
            }

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
        } catch (e) {
            console.error('[AUTH CONTEXT ERROR]', e.message);
            clearSession();
            return false;
        }
    };

    const register = async (username, password, email) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });
            if (!res.ok) throw new Error('Falló el registro');

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
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const logout = () => {
        clearSession();
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    const verifyStaff = async (password) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/verify', {
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
