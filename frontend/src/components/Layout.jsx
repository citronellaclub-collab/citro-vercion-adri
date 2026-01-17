import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ShoppingCart, MessageSquare, Package, LogOut, User, FileText, Calendar, Shield } from 'lucide-react';
import HealthCheck from './HealthCheck';
import VerificationBanner from './VerificationBanner';

export default function Layout() {
    const { user, logout, isStaff } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Mi Cultivo', path: '/micultivo', icon: <Home size={20} /> },
        { label: 'Intercambio GTL', path: '/gtl', icon: <ShoppingCart size={20} /> },
        { label: 'Foro', path: '/foro', icon: <MessageSquare size={20} /> },
        { label: 'Eventos', path: '/eventos', icon: <Calendar size={20} /> },
        { label: 'Mis Canjes', path: '/pedidos', icon: <Package size={20} /> },
        { label: 'Mi Perfil', path: '/perfil', icon: <User size={20} /> },
        ...(isStaff ? [{ label: 'Panel Staff', path: '/admin', icon: <Shield size={20} color="var(--accent)" /> }] : []),
        { label: 'Términos', path: '/terminos', icon: <FileText size={20} /> },
    ];

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'row' }}>

            {/* Sidebar */}
            <aside style={{
                width: 'var(--sidebar-width)',
                background: 'var(--bg-panel)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px'
            }}>
                {/* Top */}
                <div>
                    <h2 style={{ margin: '0 0 35px 0', fontSize: '1.4rem', color: 'var(--accent-light)', fontWeight: '800', letterSpacing: '-0.5px' }}>CITRONELLA</h2>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {navItems.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="nav-item-btn"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        background: isActive ? 'rgba(46, 160, 67, 0.1)' : 'transparent',
                                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        border: 'none',
                                        borderLeft: isActive ? '4px solid var(--accent)' : '4px solid transparent',
                                        padding: '12px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: isActive ? '600' : '500',
                                        transition: '0.2s',
                                        width: '100%',
                                        textAlign: 'left'
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Bottom */}
                <div style={{
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                            <User size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Socio</div>
                            <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{user?.username}</div>
                            <div style={{ fontSize: '13px', color: 'var(--accent-light)', fontWeight: '600' }}>{user?.tokens || 0} 🟢</div>
                        </div>
                    </div>

                    <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <VerificationBanner />
                <div style={{ padding: '30px', flex: 1 }}>
                    <HealthCheck />
                    <Outlet />
                </div>
            </main>

            <style>{`
                .nav-item-btn:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                    color: var(--text-primary) !important;
                    transform: translateX(4px);
                }
            `}</style>
        </div>
    );
}
