import React from 'react';
import { Calendar, Droplets, Thermometer, Trash2 } from 'lucide-react';

export default function LogHistory({ logs, onRefresh }) {
    if (!logs || logs.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e', background: '#0d1117', borderRadius: '12px', border: '1px solid #30363d' }}>
                <p>No hay registros disponibles para este cultivo.</p>
            </div>
        );
    }

    const handleDeleteLog = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro? Esta acción es irreversible y se borrarán las imágenes asociadas.')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/logs/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                if (onRefresh) onRefresh();
            } else {
                const data = await res.json();
                alert('Error: ' + (data.error || 'No se pudo eliminar el registro'));
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión al eliminar');
        }
    };

    return (
        <div style={{ overflowX: 'auto', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #30363d', background: '#0d1117' }}>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600' }}>Fecha</th>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600' }}>Semana / Fase</th>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600' }}>pH</th>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600' }}>EC</th>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600' }}>Nutrientes</th>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600' }}>Foto / Bitácora</th>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600' }}>Asesor Citro</th>
                        <th style={{ padding: '15px', color: '#8b949e', fontWeight: '600', textAlign: 'center' }}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #21262d', transition: 'background 0.2s' }}>
                            <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={14} color="#8b949e" />
                                    {new Date(log.createdAt).toLocaleDateString()}
                                </div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <div style={{ fontWeight: '600', color: '#e6edf3' }}>{log.week}</div>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{log.phase}</div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <span style={{
                                    color: (log.ph < 5.5 || log.ph > 6.5) ? '#f85149' : '#3fb950',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <Droplets size={14} /> {log.ph ? Number(log.ph).toFixed(1) : '--'}
                                </span>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <span style={{ fontWeight: 'bold', color: '#a5d6ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Thermometer size={14} /> {log.ec ? Number(log.ec).toFixed(1) : '--'}
                                </span>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <span style={{ color: '#3fb950', fontSize: '0.8rem' }}>{log.grow}</span>/
                                    <span style={{ color: '#a5d6ff', fontSize: '0.8rem' }}>{log.micro}</span>/
                                    <span style={{ color: '#f85149', fontSize: '0.8rem' }}>{log.bloom}</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {log.imageUrl && (
                                        <img src={log.imageUrl} alt="Progreso" style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #30363d' }} />
                                    )}
                                    <div style={{ fontSize: '0.85rem', color: '#8b949e', maxWidth: '150px' }}>{log.notes || '-'}</div>
                                </div>
                            </td>
                            <td style={{ padding: '15px', maxWidth: '250px' }}>
                                {log.feedback && (
                                    <div style={{
                                        fontSize: '0.85rem',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        background: log.feedback.includes('óptimo') ? 'rgba(35, 134, 54, 0.1)' : 'rgba(210, 153, 34, 0.1)',
                                        color: log.feedback.includes('óptimo') ? '#3fb950' : '#d29922',
                                        border: log.feedback.includes('óptimo') ? '1px solid rgba(35, 134, 54, 0.2)' : '1px solid rgba(210, 153, 34, 0.2)'
                                    }}>
                                        {log.feedback}
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', opacity: 0.7 }}
                                    title="Eliminar Registro"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
