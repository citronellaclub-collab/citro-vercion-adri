import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Info, Ticket, ChevronRight, QrCode, User, Plus, X, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Events() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    // Control de socios: Redirigir si no tiene email
    useEffect(() => {
        if (user && (!user.email || user.email.trim() === '')) {
            navigate('/perfil');
        }
    }, [user, navigate]);
    const [events, setEvents] = useState([]);
    const [myReservations, setMyReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [activeTab, setActiveTab] = useState('cartelera'); // 'cartelera' | 'mis-reservas'

    // Admin Form State
    const [newEvent, setNewEvent] = useState({
        title: '', description: '', date: '', time: '', location: '', requirements: '', capacity: 50,
        categories: [{ name: 'General', price: 10, benefits: 'Acceso estándar' }]
    });
    const [flyer, setFlyer] = useState(null);

    const loadData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [eventsRes, reservationsRes] = await Promise.all([
                fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/events/my-reservations', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setEvents(await eventsRes.json());
            setMyReservations(await reservationsRes.json());
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleReserve = async (categoryId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/events/reserve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ categoryId })
            });
            const data = await res.json();
            if (res.ok) {
                alert('¡Reserva confirmada! Se han descontado los tokens.');
                updateUser({ tokens: data.tokens });
                setSelectedEvent(null);
                loadData();
                setActiveTab('mis-reservas');
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Error al procesar reserva');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const formData = new FormData();
        Object.keys(newEvent).forEach(key => {
            if (key === 'categories') {
                formData.append(key, JSON.stringify(newEvent[key]));
            } else {
                formData.append(key, newEvent[key]);
            }
        });
        if (flyer) formData.append('flyer', flyer);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                setShowAdminModal(false);
                loadData();
                alert('Evento creado exitosamente');
            } else {
                const data = await res.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Error al crear evento');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Header / Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <button onClick={() => setActiveTab('cartelera')} style={{ background: activeTab === 'cartelera' ? 'var(--accent)' : 'transparent', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cartelera de Eventos</button>
                    <button onClick={() => setActiveTab('mis-reservas')} style={{ background: activeTab === 'mis-reservas' ? 'var(--accent)' : 'transparent', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Mis Reservas</button>
                </div>
                {(user?.role === 'admin' || user?.username === 'admin') && (
                    <button onClick={() => setShowAdminModal(true)} className="btn-primary" style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Crear Evento
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Sincronizando cartelera presencial...</div>
            ) : activeTab === 'cartelera' ? (
                events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', background: '#161B22', borderRadius: '16px', border: '1px dashed var(--border)', gridColumn: '1/-1' }}>
                        <Calendar size={48} color="var(--text-secondary)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--text-secondary)', margin: 0 }}>Próximamente nuevos eventos</h3>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '10px' }}>Estamos preparando ferias y cursos presenciales para el club.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                        {events.map(event => (
                            <div key={event.id} className="citro-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#161B22' }}>
                                <div style={{ height: '200px', background: `url(${event.flyerUrl || 'https://images.unsplash.com/photo-1514525253361-bee1-43e30e2c?auto=format&fit=crop&q=80&w=800'})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#fff', backdropFilter: 'blur(5px)' }}>
                                        {new Date(event.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent-light)' }}>{event.title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                                        <MapPin size={16} /> {event.location}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1 }}>{event.description}</p>
                                    <button onClick={() => setSelectedEvent(event)} className="btn-primary" style={{ marginTop: 'auto' }}>Ver Detalles / Reservar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {myReservations.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'var(--bg-panel)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                            <Ticket size={48} color="var(--text-secondary)" style={{ marginBottom: '15px' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>Aún no tienes reservas para próximos encuentros.</p>
                        </div>
                    ) : myReservations.map(res => (
                        <div key={res.id} className="citro-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--bg-dark)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                <QrCode size={40} color="var(--accent)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, color: '#fff' }}>{res.category.event.title}</h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>{res.category.name.toUpperCase()}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                    {new Date(res.category.event.date).toLocaleDateString()} • {res.category.event.time}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.5 }}>{res.qrCode}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Detalles Evento */}
            {selectedEvent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '800px', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ height: '300px', background: `url(${selectedEvent.flyerUrl || 'https://images.unsplash.com/photo-1514525253361-bee1-43e30e2c?auto=format&fit=crop&q=80&w=800'})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                            <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}><X /></button>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 30px 20px', background: 'linear-gradient(transparent, var(--bg-panel))' }}>
                                <h2 style={{ fontSize: '2rem', color: '#fff', margin: 0 }}>{selectedEvent.title}</h2>
                            </div>
                        </div>
                        <div style={{ padding: '30px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                            <div>
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Calendar size={18} /> {new Date(selectedEvent.date).toLocaleDateString()}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Clock size={18} /> {selectedEvent.time}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><MapPin size={18} /> {selectedEvent.location}</div>
                                </div>
                                <h4 style={{ color: 'var(--accent-light)', marginBottom: '10px' }}>Sobre el evento</h4>
                                <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '25px' }}>{selectedEvent.description}</p>
                                <h4 style={{ color: 'var(--accent-light)', marginBottom: '10px' }}>Requisitos</h4>
                                <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.9rem' }}>{selectedEvent.requirements || 'Sin requisitos especiales enumerados.'}</div>
                            </div>
                            <div>
                                <h4 style={{ color: '#fff', marginBottom: '15px' }}>Selecciona tu Entrada</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {selectedEvent.categories.map(cat => (
                                        <div key={cat.id} style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-dark)', transition: '0.2s' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#fff' }}>{cat.name}</span>
                                                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{cat.price} 🟢</span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>{cat.benefits || 'Acceso general al evento.'}</p>
                                            <button
                                                onClick={() => handleReserve(cat.id)}
                                                disabled={user?.tokens < cat.price}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: user?.tokens >= cat.price ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: user?.tokens >= cat.price ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                            >
                                                {user?.tokens >= cat.price ? 'Comprar Ticket' : 'Tokens Insuficientes'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Tu Saldo Actual: <strong style={{ color: 'var(--accent)' }}>{user?.tokens} 🟢</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Admin Crear Evento */}
            {showAdminModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '600px', borderRadius: '24px', border: '1px solid var(--border)', padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                            <h3>Crear Nuevo Evento Club</h3>
                            <button onClick={() => setShowAdminModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><X /></button>
                        </div>
                        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Título del Evento" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required className="citro-input" />
                            <textarea placeholder="Descripción detallada" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} required className="citro-input" style={{ minHeight: '100px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required className="citro-input" />
                                <input type="text" placeholder="Hora (ej: 18:00)" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} required className="citro-input" />
                            </div>
                            <input type="text" placeholder="Ubicación / Localidad" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} required className="citro-input" />
                            <input type="file" onChange={e => setFlyer(e.target.files[0])} style={{ color: 'var(--text-secondary)' }} />
                            <button type="submit" className="btn-primary" style={{ padding: '15px', marginTop: '10px' }}>Publicar Evento</button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .citro-input {
                    padding: 12px;
                    background: var(--bg-dark);
                    border: 1px solid var(--border);
                    color: #fff;
                    border-radius: 8px;
                    outline: none;
                }
                .citro-input:focus {
                    border-color: var(--accent);
                }
            `}</style>
        </div>
    );
}
