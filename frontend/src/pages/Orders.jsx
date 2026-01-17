import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, CheckCircle, Clock } from 'lucide-react';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('purchases'); // 'purchases' or 'sales'

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setOrders(data);
        } catch (err) { console.error(err); }
    };

    const fetchSales = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/orders/sales', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setSales(data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
        fetchSales();
    }, []);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/orders/${selectedOrder.id}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ rating, comment })
            });
            if (res.ok) {
                alert('¡Gracias por tu calificación!');
                setShowReviewModal(false);
                fetchOrders();
            }
        } catch (err) { console.error(err); }
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            'Pendiente': { bg: 'rgba(210, 153, 34, 0.1)', text: '#d29922' },
            'Entregado': { bg: 'rgba(56, 139, 253, 0.1)', text: '#58a6ff' },
            'Completado': { bg: 'rgba(35, 134, 54, 0.1)', text: '#3fb950' }
        };
        const color = colors[status] || { bg: '#21262d', text: '#8b949e' };
        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                background: color.bg,
                color: color.text,
                border: `1px solid ${color.text}33`
            }}>
                {status}
            </span>
        );
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '30px', borderBottom: '1px solid #30363d', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Package /> {view === 'purchases' ? 'Mis Canjes (Adquisiciones)' : 'Solicitudes de Intercambio'}
                </h2>
                <div style={{ display: 'flex', gap: '10px', background: '#161b22', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setView('purchases')}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: view === 'purchases' ? '#238636' : 'transparent', color: '#fff' }}
                    >
                        Canjes
                    </button>
                    <button
                        onClick={() => setView('sales')}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: view === 'sales' ? '#238636' : 'transparent', color: '#fff' }}
                    >
                        Intercambios
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#8b949e' }}>Cargando historial...</div>
            ) : view === 'purchases' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' }}>
                            <ShoppingBag size={48} color="#30363d" style={{ marginBottom: '10px' }} />
                            <p style={{ color: '#8b949e' }}>Aún no has solicitado ningún intercambio.</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid #30363d', background: '#0d1117', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Pedido #{order.id}</span>
                                        <div style={{ fontSize: '0.8rem', color: '#58a6ff' }}>{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {order.review ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(210,153,34,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                                <span style={{ color: '#d29922', fontWeight: 'bold', fontSize: '0.75rem' }}>{order.review.rating} ★</span>
                                            </div>
                                        ) : order.status === 'Entregado' && (
                                            <button
                                                onClick={() => { setSelectedOrder(order); setShowReviewModal(true); }}
                                                style={{ padding: '4px 10px', background: '#d29922', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Calificar
                                            </button>
                                        )}
                                        <StatusBadge status={order.status} />
                                    </div>
                                </div>
                                <div style={{ padding: '15px' }}>
                                    {order.items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.product.imageUrl ? <img src={item.product.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{item.product.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Vendedor: {item.product.seller?.username}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: '#e6edf3' }}>{item.quantity} x {item.price} 🟢</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#8b949e' }}>Total Aportado</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#238636' }}>{order.totalPrice} 🟢</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {sales.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' }}>
                            <Clock size={48} color="#30363d" style={{ marginBottom: '10px' }} />
                            <p style={{ color: '#8b949e' }}>No has recibido solicitudes de intercambio todavía.</p>
                        </div>
                    ) : (
                        sales.map(sale => (
                            <div key={sale.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', background: '#0d1117', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {sale.product.imageUrl ? <img src={sale.product.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{sale.product.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#8b949e' }}>Comprador: {sale.order.buyer?.username}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#30363d' }}>{new Date(sale.order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#238636', fontWeight: 'bold' }}>+{sale.price * sale.quantity} 🟢</div>
                                    <StatusBadge status={sale.order.status} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* REVIEW MODAL */}
            {showReviewModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '25px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>Calificar Intercambio</h3>
                        <form onSubmit={handleReviewSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: '#8b949e', marginBottom: '10px' }}>Puntuación</label>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', fontSize: '1.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span
                                            key={star}
                                            onClick={() => setRating(star)}
                                            style={{ cursor: 'pointer', color: star <= rating ? '#d29922' : '#30363d', transition: '0.2s' }}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <label>Comentario (opcional)</label>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="¿Cómo fue tu experiencia?"
                                    style={{ height: '80px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowReviewModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Enviar Reseña</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
