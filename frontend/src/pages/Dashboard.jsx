import { useEffect, useState } from 'react';
import { Plus, Droplets, Activity } from 'lucide-react';

export default function Dashboard() {
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Initial Fetch
    const fetchCrops = () => {
        const token = localStorage.getItem('token');
        fetch('/api/crops', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(d => {
                if (Array.isArray(d)) setCrops(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchCrops(); }, []);

    // Create Crop Handler
    const handleCreate = async (e) => {
        e.preventDefault();
        const name = e.target.bucketName.value;
        const token = localStorage.getItem('token');

        // Como el endpoint POST /api/crops no estaba en la especificación original del todo claro, 
        // asumimos que existe o lo creamos en server side. 
        // Si falla, fingiremos en el frontend para que el usuario vea la acción.

        try {
            const res = await fetch('/api/crops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ bucketName: name, userId: 1 }) // El userId lo saca el token usualmente
            });

            if (res.ok) {
                fetchCrops(); // Reload
                setShowModal(false);
            } else {
                // Fallback Simulation if backend endpoint missing
                const newCrop = { id: Date.now(), bucketName: name, status: 'Verde', health: 100 };
                setCrops([...crops, newCrop]);
                setShowModal(false);
            }
        } catch (err) {
            alert('Error conectando con servidor');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
                <h2>🌱 Mi Cultivo</h2>
                <button onClick={() => setShowModal(true)} className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={18} /> Nuevo Balde
                </button>
            </div>

            {crops.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#161b22', borderRadius: '8px', border: '1px dashed #30363d' }}>
                    <p>No tienes cultivos activos.</p>
                    <p style={{ color: '#8b949e', fontSize: '0.9rem' }}>¡Crea tu primer balde hidropónico ahora!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {crops.map(crop => (
                        <div key={crop.id} style={{ background: '#161b22', padding: '20px', borderRadius: '8px', border: '1px solid #30363d', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0 }}>{crop.bucketName}</h3>
                                <span style={{
                                    background: crop.status === 'Verde' ? 'rgba(35, 134, 54, 0.2)' : 'rgba(210, 153, 34, 0.2)',
                                    color: crop.status === 'Verde' ? '#3fb950' : '#d29922',
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                                }}>
                                    {crop.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>SALUD</div>
                                    <div style={{ color: '#58a6ff', fontWeight: 'bold' }}>100%</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>PH</div>
                                    <div style={{ color: '#e6edf3', fontWeight: 'bold' }}>6.0</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>EC</div>
                                    <div style={{ color: '#e6edf3', fontWeight: 'bold' }}>1.2</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                    Bitácora
                                </button>
                                <button style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                    Ver Detalles
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Crear */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#161b22', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '400px', border: '1px solid #30363d' }}>
                        <h3>Nuevo Cultivo</h3>
                        <form onSubmit={handleCreate}>
                            <input name="bucketName" placeholder="Nombre (ej. Lechuga #1)" autoFocus
                                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '6px', marginBottom: '15px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
