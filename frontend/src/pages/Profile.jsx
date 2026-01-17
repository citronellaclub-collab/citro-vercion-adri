import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, ShieldCheck, Lock, LogOut, FileText, ChevronRight } from 'lucide-react';

export default function Profile() {
    const { user, isStaff, verifyStaff } = useAuth();
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleStaffAccess = async (e) => {
        e.preventDefault();
        const success = await verifyStaff(password);
        if (success) {
            setShowStaffModal(false);
            setPassword('');
        } else {
            setError('Clave incorrecta');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Header Perfil */}
            <div className="citro-card" style={{ display: 'flex', gap: '30px', alignItems: 'center', padding: '40px' }}>
                <div style={{ width: '120px', height: '120px', background: 'var(--accent)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(46, 160, 67, 0.3)' }}>
                    <UserIcon size={64} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', color: '#fff' }}>{user?.username}</h1>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Socio Citronella</span>
                        <span style={{ padding: '6px 12px', background: 'rgba(46, 160, 67, 0.1)', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 'bold' }}>{user?.tokens} 🟢 Tokens</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div className="citro-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ color: 'var(--accent-light)' }}>Configuración de Cuenta</h3>
                    <button className="nav-item-btn" style={{ textAlign: 'left', padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Cambiar Contraseña <ChevronRight size={18} />
                    </button>
                    <button className="nav-item-btn" style={{ textAlign: 'left', padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Privacidad de Cultivo <ChevronRight size={18} />
                    </button>
                </div>

                <div className="citro-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                    <h3 style={{ color: 'var(--accent-light)' }}>Herramientas de Desarrollador</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Funciones exclusivas para el mantenimiento y administración de la plataforma Citronella.</p>

                    {!isStaff ? (
                        <button
                            onClick={() => setShowStaffModal(true)}
                            style={{ marginTop: 'auto', padding: '15px', border: '1px dashed var(--accent)', borderRadius: '12px', background: 'rgba(46, 160, 67, 0.05)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold' }}
                        >
                            <Lock size={18} /> Acceso Staff
                        </button>
                    ) : (
                        <div style={{ marginTop: 'auto', padding: '15px', border: '1px solid var(--accent)', borderRadius: '12px', background: 'rgba(46, 160, 67, 0.1)', color: 'var(--accent)', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <ShieldCheck size={18} /> Staff Activo
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Acceso Staff */}
            {showStaffModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#161B22', width: '100%', maxWidth: '400px', borderRadius: '24px', border: '1px solid var(--border)', padding: '30px', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--accent)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <ShieldCheck size={32} color="white" />
                        </div>
                        <h3>Validación de Seguridad</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '25px' }}>Ingresa la Clave Maestra de Desarrollador del archivo de entorno (.env)</p>

                        <form onSubmit={handleStaffAccess} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                type="password"
                                placeholder="Contraseña de Desarrollador"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ padding: '15px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
                                required
                            />
                            {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</div>}
                            <button type="submit" className="btn-primary" style={{ padding: '15px' }}>Confirmar Identidad</button>
                            <button type="button" onClick={() => setShowStaffModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
