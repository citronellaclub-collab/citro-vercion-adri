import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Tag, ShoppingBag, ShoppingBasket, PlusCircle, Star, ShieldCheck, Heart, Bell, Trash2, Edit3, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VerificationGuard from '../components/VerificationGuard';

const CATEGORIES = ['Todos', 'Semillas', 'Sustratos', 'Nutrientes', 'Equipamiento', 'Otros'];

export default function Market() {
    const { user, updateUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('explora');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todos');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [onlyVerified, setOnlyVerified] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Create Product Form
    const [newProduct, setNewProduct] = useState({ name: '', description: '', category: 'Otros', price: '', stock: '' });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Cart
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            let endpoint = '/api/market';
            const params = new URLSearchParams({
                page,
                search,
                category: category === 'Todos' ? '' : category,
                minPrice,
                maxPrice,
                sortBy,
                onlyVerified: onlyVerified ? 'true' : 'false'
            });

            if (tab === 'favoritos') {
                params.append('wishlistedOnly', 'true');
            } else if (tab === 'mis-publicaciones') {
                endpoint = '/api/market/my-sales';
            }

            const res = await fetch(`${endpoint}?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            // Handle different response formats (my-sales returns array, market returns object)
            if (Array.isArray(data)) {
                setProducts(data);
                setTotalPages(1);
            } else {
                setProducts(data.products || []);
                setTotalPages(data.totalPages || 1);
            }

            // También obtener notificaciones si estamos en alguna pestaña que las use o globalmente
            const notifRes = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const notifData = await notifRes.json();
            setNotifications(notifData || []);
        } catch (error) {
            console.error('Error fetching market data:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, category, minPrice, maxPrice, sortBy, onlyVerified, tab]);

    useEffect(() => {
        // Clear products for immediate visual feedback when filters change
        setProducts([]);
        const timeout = setTimeout(fetchData, 400);
        return () => clearTimeout(timeout);
    }, [fetchData, sortBy, tab]);

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setUploading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();

        formData.append('name', newProduct.name);
        formData.append('description', newProduct.description);
        formData.append('category', newProduct.category);
        formData.append('price', newProduct.price);
        formData.append('stock', newProduct.stock);

        const fileInput = document.getElementById('marketImageInput');
        if (fileInput?.files[0]) {
            formData.append('image', fileInput.files[0]);
        }

        try {
            const res = await fetch('/api/market', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                setTab('mis-publicaciones');
                setNewProduct({ name: '', description: '', category: 'Otros', price: '', stock: '' });
                setPreviewUrl(null);
                fetchData();
            }
        } catch (err) {
            alert('Error al publicar');
        } finally {
            setUploading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) return prev;
            return [...prev, { productId: product.id, product, quantity: 1 }];
        });
        setShowCart(true);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.productId !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cartTotal > (user?.tokens || 0)) {
            alert('Saldo insuficiente en el club.');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    items: cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
                })
            });
            if (res.ok) {
                const data = await res.json();
                alert('¡Intercambio solicitado exitosamente!');
                setCart([]);
                setShowCart(false);
                // Actualización global del balance de tokens
                updateUser({ tokens: user.tokens - cartTotal });
                fetchData();
            } else {
                const err = await res.json();
                alert('Error: ' + err.error);
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const toggleWishlist = async (productId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/market/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ productId })
            });
            if (res.ok) fetchData();
        } catch (error) { console.error(error); }
    };

    const markNotificationsRead = async () => {
        const token = localStorage.getItem('token');
        try {
            await fetch('/api/notifications/read', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>Marketplace GTL</h2>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Zona de intercambio exclusivo entre socios</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markNotificationsRead(); }}
                            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: notifications.some(n => !n.isRead) ? 'var(--accent-light)' : 'var(--text-secondary)', padding: '10px', borderRadius: '10px', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Bell size={20} />
                            {notifications.some(n => !n.isRead) && (
                                <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--bg-dark)' }} />
                            )}
                        </button>
                        {showNotifications && (
                            <div style={{ position: 'absolute', top: '50px', right: 0, width: '320px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.6)', padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Avisos del Club</h4>
                                    <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {notifications.length === 0 ? (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No hay novedades por ahora.</p>
                                    ) : notifications.map(n => (
                                        <div key={n.id} style={{ padding: '12px', background: n.isRead ? 'transparent' : 'rgba(88, 166, 255, 0.05)', borderRadius: '8px', border: '1px solid', borderColor: n.isRead ? 'transparent' : 'rgba(88, 166, 255, 0.1)', fontSize: '0.85rem', color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                            {n.message}
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ background: 'var(--bg-panel)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'right', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Mi Saldo</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-light)' }}>{user?.tokens || 0} 🟢</div>
                    </div>
                </div>
            </header>

            {/* TABS NAVIGATION */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'var(--bg-panel)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                {[
                    { id: 'explora', label: 'Explorar Ofertas', icon: Search },
                    { id: 'publicar', label: 'Crear Publicación', icon: PlusCircle },
                    { id: 'mis-publicaciones', label: 'Mis Publicaciones', icon: Tag },
                    { id: 'favoritos', label: 'Favoritos', icon: Heart }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => {
                            setTab(t.id);
                            setPage(1); // Reset page when switching tabs
                        }}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: tab === t.id ? 'var(--accent)' : 'transparent',
                            color: tab === t.id ? '#fff' : 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', transition: '0.2s'
                        }}
                    >
                        <t.icon size={18} /> {t.label}
                    </button>
                ))}
            </div>

            <main>
                {tab === 'explora' && (
                    <div style={{ display: 'flex', gap: '30px' }}>
                        {/* Sidebar Filters */}
                        <aside style={{ width: '260px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="citro-card" style={{ padding: '20px' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Filtros</h4>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Búsqueda</label>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Buscar..."
                                            style={{ width: '100%', padding: '10px 10px 10px 35px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Categoría</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Aportación (🟢)</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                                        <span style={{ color: 'var(--border)' }}>-</span>
                                        <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input type="checkbox" checked={onlyVerified} onChange={e => setOnlyVerified(e.target.checked)} />
                                        Socios Verificados
                                    </label>
                                </div>

                                <button onClick={() => { setSearch(''); setCategory('Todos'); setMinPrice(''); setMaxPrice(''); setOnlyVerified(false); }} className="btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }}>Limpiar Filtros</button>
                            </div>

                            <div className="citro-card" style={{ padding: '20px' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Ordenar</h4>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                >
                                    <option value="newest">Más recientes</option>
                                    <option value="price_asc">Precio: Menor a Mayor</option>
                                    <option value="price_desc">Precio: Mayor a Menor</option>
                                    <option value="stock">Mayor Stock</option>
                                </select>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div style={{ flex: 1 }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
                                    <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 15px' }} />
                                    <p>Sincronizando Marketplace...</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                    {products.length === 0 ? (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                            <ShoppingBasket size={48} color="var(--border)" style={{ marginBottom: '15px' }} />
                                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay ofertas disponibles bajo estos filtros.</p>
                                        </div>
                                    ) : products.map(p => (
                                        <div key={p.id} className="citro-card" style={{ border: p.sellerId === user?.id ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                                            <div style={{ position: 'relative' }}>
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} className="citro-card-img" />
                                                ) : (
                                                    <div className="citro-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🌿</div>
                                                )}
                                                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px' }}>
                                                    {p.isOffer && <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>OFERTA</span>}
                                                    {p.sellerId === user?.id && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>TU PUBLICACIÓN</span>}
                                                </div>
                                                <button
                                                    onClick={() => toggleWishlist(p.id)}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(13,17,23,0.7)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: p.isWishlisted ? 'var(--danger)' : '#fff', backdropFilter: 'blur(4px)' }}
                                                >
                                                    <Heart size={18} fill={p.isWishlisted ? 'currentColor' : 'none'} />
                                                </button>
                                            </div>
                                            <div className="citro-card-body">
                                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Socio: {p.seller.username}</span>
                                                    {p.seller.isVerified && <ShieldCheck size={14} color="var(--accent-light)" />}
                                                    {p.avgRating && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto', background: 'rgba(210,153,34,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                            <span style={{ color: '#d29922', fontWeight: 'bold', fontSize: '0.75rem' }}>{p.avgRating} ★</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        {p.isOffer && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{p.basePrice}</span>}
                                                        <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-light)' }}>{p.price} 🟢</span>
                                                    </div>
                                                    <button
                                                        onClick={() => addToCart(p)}
                                                        disabled={p.stock < 1 || p.sellerId === user?.id}
                                                        style={{
                                                            padding: '8px 14px', borderRadius: '8px', border: 'none',
                                                            background: p.sellerId === user?.id ? 'var(--border)' : 'var(--accent)',
                                                            color: '#fff', cursor: p.sellerId === user?.id ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {p.stock < 1 ? 'Agotado' : (p.sellerId === user?.id ? 'Tu Publicación' : 'Añadir')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary" style={{ width: 'auto', padding: '8px 20px' }}>Anterior</button>
                                    <span style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>{page} / {totalPages}</span>
                                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary" style={{ width: 'auto', padding: '8px 20px' }}>Siguiente</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {(tab === 'mis-publicaciones' || tab === 'favoritos') && (
                    <div style={{ flex: 1 }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
                                <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 15px' }} />
                                <p>Cargando información...</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                {products.length === 0 ? (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        {tab === 'favoritos' ? <Heart size={48} color="var(--border)" style={{ marginBottom: '15px' }} /> : <Tag size={48} color="var(--border)" style={{ marginBottom: '15px' }} />}
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                            {tab === 'favoritos' ? 'Aún no tienes productos en favoritos.' : 'Aún no has realizado ninguna publicación.'}
                                        </p>
                                    </div>
                                ) : products.map(p => (
                                    <div key={p.id} className="citro-card" style={{ border: p.sellerId === user?.id ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                                        <div style={{ position: 'relative' }}>
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.name} className="citro-card-img" />
                                            ) : (
                                                <div className="citro-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🌿</div>
                                            )}
                                            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px' }}>
                                                {p.isOffer && <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>OFERTA</span>}
                                                {p.sellerId === user?.id && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>TU PUBLICACIÓN</span>}
                                            </div>
                                            <button
                                                onClick={() => toggleWishlist(p.id)}
                                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(13,17,23,0.7)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: (p.isWishlisted || tab === 'favoritos') ? 'var(--danger)' : '#fff', backdropFilter: 'blur(4px)' }}
                                            >
                                                <Heart size={18} fill={(p.isWishlisted || tab === 'favoritos') ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>
                                        <div className="citro-card-body">
                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.category}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-light)' }}>{p.price} 🟢</span>
                                                </div>
                                                {p.sellerId === user?.id ? (
                                                    <button onClick={() => setTab('publicar')} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>Gestionar</button>
                                                ) : (
                                                    <button onClick={() => addToCart(p)} className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>Añadir</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'publicar' && (
                    <VerificationGuard action="publicar productos">
                        <div className="citro-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
                            <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>📤 Nueva Publicación</h3>
                        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Imagen del Producto</label>
                                <div style={{ width: '100%', height: '220px', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', overflow: 'hidden', position: 'relative' }}>
                                    {previewUrl ? (
                                        <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <>
                                            <ImageIcon size={40} color="var(--border)" />
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '10px' }}>Seleccionar foto</span>
                                        </>
                                    )}
                                    <input
                                        id="marketImageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) setPreviewUrl(URL.createObjectURL(file));
                                        }}
                                        style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
                                    />
                                    {uploading && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13, 17, 23, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Loader2 className="animate-spin" color="var(--accent)" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-field-group">
                                    <label>Nombre del Producto</label>
                                    <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required className="citro-input" placeholder="Ej: Humus de Lombriz" />
                                </div>
                                <div className="input-field-group">
                                    <label>Categoría</label>
                                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="citro-input">
                                        {CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="input-field-group">
                                <label>Descripción del Socio</label>
                                <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="citro-input" placeholder="Detalles de procedencia y calidad..." style={{ height: '100px', resize: 'none' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-field-group">
                                    <label>Aportación (en 🟢)</label>
                                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required className="citro-input" placeholder="Ej: 50" />
                                </div>
                                <div className="input-field-group">
                                    <label>Stock Disponible</label>
                                    <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} required className="citro-input" placeholder="Ej: 5" />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={uploading} style={{ height: '48px', fontSize: '1rem', marginTop: '10px' }}>
                                {uploading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Publicar en el GTL'}
                            </button>
                        </form>
                        </div>
                    </VerificationGuard>
                )}
            </main>

            {/* Floating Cart Modal */}
            {showCart && (
                <div style={{ position: 'fixed', bottom: '30px', right: '30px', width: '350px', zIndex: 1000, animation: 'slideUp 0.3s ease-out' }}>
                    <div className="citro-card" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.7)' }}>
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent)' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Carrito de Intercambio</h3>
                            <button onClick={() => setShowCart(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {cart.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No has seleccionado productos.</p>
                            ) : cart.map(item => (
                                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'var(--bg-dark)', borderRadius: '6px', overflow: 'hidden' }}>
                                            {item.product.imageUrl ? <img src={item.product.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.product.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.product.price} 🟢</div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.productId)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '5px' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {cart.length > 0 && (
                            <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-dark)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Total del Intercambio</span>
                                    <span style={{ color: 'var(--accent-light)', fontSize: '1.3rem', fontWeight: '900' }}>{cartTotal} 🟢</span>
                                </div>
                                <button onClick={handleCheckout} className="btn-primary" style={{ padding: '12px' }}>Confirmar Intercambio</button>
                                {cartTotal > (user?.tokens || 0) && (
                                    <p style={{ color: 'var(--danger)', fontSize: '0.7rem', textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>⚠️ Saldo insuficiente en tu cuenta de socio</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .citro-input {
                    width: 100%;
                    padding: 12px;
                    background: #161b22; /* Darker background for contrast */
                    border: 1px solid var(--border);
                    color: #e6edf3; /* Light text */
                    border-radius: 8px;
                    outline: none;
                    font-size: 0.9rem;
                    transition: 0.2s;
                }
                .citro-input:focus { border-color: var(--accent); background: #1c2128; }
                .citro-input option {
                    background: #161b22;
                    color: #e6edf3;
                }
                .input-field-group label { display: block; color: var(--text-secondary); fontSize: 0.8rem; marginBottom: 8px; textTransform: uppercase; letterSpacing: 0.5px; }
            `}</style>
        </div>
    );
}
