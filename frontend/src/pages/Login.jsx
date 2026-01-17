import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin) {
            // Validaciones para registro
            if (!username.trim()) {
                alert('El nombre de usuario es obligatorio');
                return;
            }
            if (!email.trim()) {
                alert('El email es obligatorio');
                return;
            }
            if (!validateEmail(email)) {
                alert('Por favor ingresa un email válido');
                return;
            }
            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                return;
            }
        }

        const success = isLogin
            ? await login(username, password)
            : await register(username, password, email);

        if (success) navigate('/');
        else alert(isLogin ? 'Error de credenciales' : 'Error en el registro');
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ background: '#161b22', padding: '2rem', borderRadius: '8px', width: '320px', border: '1px solid #30363d' }}>
                <h2 style={{ textAlign: 'center', marginTop: 0 }}>
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>
                            {isLogin ? 'Email o Usuario' : 'Usuario'}
                        </label>
                        <input
                            type={isLogin ? 'text' : 'text'}
                            placeholder={isLogin ? 'tu@email.com o tu_usuario' : 'tu_usuario'}
                            style={{ width: '100%', padding: '8px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '4px' }}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Email</label>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                style={{ width: '100%', padding: '8px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '4px' }}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Contraseña</label>
                        <input
                            type="password"
                            placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
                            style={{ width: '100%', padding: '8px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '4px' }}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={isLogin ? undefined : 6}
                        />
                    </div>

                    <button className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '1rem' }}>
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
