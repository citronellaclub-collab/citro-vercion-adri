import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, AlertCircle } from 'lucide-react';

export default function Market() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);

    // Mock initial data if API is empty
    const MOCK_ITEMS = [
        { id: 1, name: 'Semillas de Lechuga', price: 10, image: '🌱', type: 'Semilla' },
        { id: 2, name: 'Nutrientes Grow', price: 25, image: '🧪', type: 'Nutriente' },
        { id: 3, name: 'Kit Medidor pH', price: 40, image: '💧', type: 'Herramienta' },
        { id: 4, name: 'Balde 20L', price: 15, image: '🪣', type: 'Equipo' },
        { id: 5, name: 'Luz LED Full Spectrum', price: 150, image: '💡', type: 'Iluminación' },
        { id: 6, name: 'Semillas de Tomate', price: 12, image: '🍅', type: 'Semilla' },
    ];

    useEffect(() => {
        // Aquí iría el fetch('/api/market')
        setItems(MOCK_ITEMS);
    }, []);

    const buyItem = (item) => {
        if (confirm(`¿Comprar ${item.name} por ${item.price} Tokens?`)) {
            alert('¡Compra realizada! (Simulación)');
            // Aquí iría logic de descontar tokens
        }
    };

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
                <h2>🛒 GTL Marketplace</h2>
                <div style={{ background: '#161b22', padding: '5px 10px', borderRadius: '4px', border: '1px solid #30363d' }}>
                    Saldo: <span style={{ color: '#2ea043', fontWeight: 'bold' }}>{user?.tokens || 0} 🟢</span>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {items.map(item => (
                    <div key={item.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '120px', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                            {item.image}
                        </div>
                        <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{item.name}</h3>
                            <span style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '10px' }}>{item.type}</span>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: '#e6edf3' }}>{item.price} 🟢</span>
                                <button
                                    onClick={() => buyItem(item)}
                                    className="btn-primary"
                                    style={{ width: 'auto', padding: '5px 12px', fontSize: '0.9rem' }}
                                >
                                    Comprar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
