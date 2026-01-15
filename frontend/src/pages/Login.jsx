import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = isLogin
            ? await login(username, password)
            : await register(username, password);

        if (success) navigate('/');
        else alert('Error de credenciales');
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ background: '#161b22', padding: '2rem', borderRadius: '8px', width: '320px', border: '1px solid #30363d' }}>
                <h2 style={{ textAlign: 'center', marginTop: 0 }}>
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Usuario</label>
                        <input
                            style={{ width: '100%', padding: '8px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '4px' }}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Contraseña</label>
                        <input
                            type="password"
                            style={{ width: '100%', padding: '8px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '4px' }}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary">
                        {isLogin ? 'Ingresar' : 'Crear Cuenta'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: '#8b949e', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? '¿No tienes cuenta? Registrate' : '¿Ya tienes cuenta? Ingresa'}
                </p>
            </div>
        </div>
    );
}
