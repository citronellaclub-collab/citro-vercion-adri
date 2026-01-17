import { useState, useEffect } from 'react';
import { Users, Coins, MessageSquare, ShieldCheck, FileText, AlertTriangle, ShieldAlert, Trash2, Pin, Lock, Edit3, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
    const { isStaff } = useAuth();
    const [activeTab, setActiveTab] = useState('tokens');
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Token Management State
    const [selectedUser, setSelectedUser] = useState(null);
    const [tokenAmount, setTokenAmount] = useState(0);

    // Legal Content State
    const [legalText, setLegalText] = useState('');

    const token = localStorage.getItem('token');

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isStaff) loadUsers();
    }, [isStaff]);

    const handleUpdateTokens = async (userId, action) => {
        try {
            const res = await fetch('/api/admin/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId, amount: tokenAmount, action })
            });
            if (res.ok) {
                alert('Tokens actualizados correctamente');
                loadUsers();
                setSelectedUser(null);
            }
        } catch (error) {
            alert('Error al actualizar tokens');
        }
    };

    const handleUpdateLegal = async () => {
        try {
            const res = await fetch('/api/admin/legal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ terms: legalText, type: 'terms' })
            });
            if (res.ok) alert('Términos y condiciones actualizados');
        } catch (error) {
            alert('Error al actualizar legal');
        }
    };

    if (!isStaff) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', color: 'var(--danger)' }}>
                <ShieldAlert size={64} />
                <h2>Acceso Denegado</h2>
                <p>Solo personal del Staff puede acceder a este panel de control.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161B22', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Panel de Desarrollador</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>SISTEMA DE CONTROL CENTRALIZADO</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setActiveTab('tokens')} style={{ background: activeTab === 'tokens' ? 'rgba(46, 160, 67, 0.1)' : 'transparent', border: 'none', color: activeTab === 'tokens' ? 'var(--accent)' : 'var(--text-secondary)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Coins size={18} /> Gestión de Tokens
                    </button>
                    <button onClick={() => setActiveTab('legal')} style={{ background: activeTab === 'legal' ? 'rgba(46, 160, 67, 0.1)' : 'transparent', border: 'none', color: activeTab === 'legal' ? 'var(--accent)' : 'var(--text-secondary)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} /> Editor Legal
                    </button>
                    <button onClick={() => setActiveTab('moderacion')} style={{ background: activeTab === 'moderacion' ? 'rgba(46, 160, 67, 0.1)' : 'transparent', border: 'none', color: activeTab === 'moderacion' ? 'var(--accent)' : 'var(--text-secondary)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={18} /> Moderación
                    </button>
                </div>
            </div>

            {activeTab === 'tokens' && (
                <div className="citro-card" style={{ background: '#161B22' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} size={18} />
                            <input
                                type="text"
                                placeholder="Buscar socio por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="citro-input"
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                        {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={20} color="white" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{u.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{u.tokens} 🟢 en cuenta</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        placeholder="Monto"
                                        onChange={(e) => setTokenAmount(e.target.value)}
                                        className="citro-input"
                                        style={{ width: '80px', padding: '8px' }}
                                    />
                                    <button onClick={() => handleUpdateTokens(u.id, 'add')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Sumar</button>
                                    <button onClick={() => handleUpdateTokens(u.id, 'subtract')} style={{ background: 'var(--danger)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Restar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'legal' && (
                <div className="citro-card" style={{ background: '#161B22' }}>
                    <h3 style={{ color: 'var(--accent-light)', marginBottom: '15px' }}>Editor de Términos y Condiciones</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Este texto se actualizará en tiempo real para todos los socios del club.</p>
                    <textarea
                        value={legalText}
                        onChange={(e) => setLegalText(e.target.value)}
                        className="citro-input"
                        style={{ width: '100%', minHeight: '400px', lineHeight: '1.6', fontSize: '0.95rem' }}
                        placeholder="Escribe el contrato legal aquí..."
                    />
                    <button onClick={handleUpdateLegal} className="btn-primary" style={{ marginTop: '20px', width: 'auto', padding: '12px 30px' }}>Guardar Cambios Legales</button>
                </div>
            )}

            {activeTab === 'moderacion' && (
                <div className="citro-card" style={{ background: '#161B22', textAlign: 'center', padding: '100px' }}>
                    <AlertTriangle size={48} color="var(--accent)" style={{ marginBottom: '15px' }} />
                    <h3 style={{ color: '#fff' }}>Próximamente Herramientas de Moderación Avanzada</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Estamos construyendo el buscador global de publicaciones e hilos fijados.</p>
                </div>
            )}

            <style>{`
                .citro-input {
                    background: var(--bg-dark);
                    border: 1px solid var(--border);
                    color: #fff;
                    border-radius: 8px;
                    padding: 12px;
                    outline: none;
                }
                .citro-input:focus {
                    border-color: var(--accent);
                }
            `}</style>
        </div>
    );
}
