import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ShoppingCart, MessageSquare, Package, LogOut, User } from 'lucide-react';
import HealthCheck from './HealthCheck';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Mi Cultivo', path: '/micultivo', icon: <Home size={20} /> },
        { label: 'Marketplace', path: '/gtl', icon: <ShoppingCart size={20} /> },
        { label: 'Foro', path: '/foro', icon: <MessageSquare size={20} /> },
        { label: 'Pedidos', path: '/pedidos', icon: <Package size={20} /> },
    ];

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'row' }}>

            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: '#161b22',
                borderRight: '1px solid #30363d',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px'
            }}>
                {/* Top */}
                <div>
                    <h2 style={{ margin: '0 0 30px 0', fontSize: '1.2rem' }}>Cultivo Virtual</h2>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {navItems.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: isActive ? 'rgba(46, 160, 67, 0.15)' : 'transparent',
                                        color: isActive ? '#f0f6fc' : '#8b949e',
                                        border: 'none',
                                        borderLeft: isActive ? '3px solid #238636' : '3px solid transparent',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem'
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
                    paddingTop: '15px',
                    borderTop: '1px solid #30363d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#238636', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user?.username}</div>
                            <div style={{ fontSize: '12px', color: '#2ea043' }}>100 🟢</div>
                        </div>
                    </div>

                    <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#da3633', cursor: 'pointer' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <HealthCheck />
                <Outlet />
            </main>

        </div>
    );
}
