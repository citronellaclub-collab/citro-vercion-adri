import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on load
        const token = localStorage.getItem('token');
        // In a real app, we would validate the token with backend here
        if (token) {
            // Mock user restore or fetch me
            setUser({ username: 'Cultivador' }); // Placeholder until /me implemented
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) throw new Error('Falló el login');

            const data = await res.json();
            localStorage.setItem('token', data.token);
            setUser({ username: data.username, tokens: data.tokens });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const register = async (username, password) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) throw new Error('Falló el registro');

            const data = await res.json();
            localStorage.setItem('token', data.token);
            setUser({ username: data.username, tokens: data.tokens });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateUser,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
