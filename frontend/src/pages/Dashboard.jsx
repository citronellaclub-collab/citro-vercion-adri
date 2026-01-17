import { useEffect, useState } from 'react';
import { Plus, Activity, FileText, Download, Droplets, Thermometer, Calendar, ArrowLeft, History, LineChart, Trash2 } from 'lucide-react';
import LogHistory from '../components/LogHistory';
import CropTrends from '../components/CropTrends';

export default function Dashboard() {
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCrop, setSelectedCrop] = useState(null); // Para vista detallada
    const [showLogModal, setShowLogModal] = useState(false); // Para modal de nueva bitácora
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [tab, setTab] = useState('trends'); // 'trends' or 'history'
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Form States
    const [logData, setLogData] = useState({
        ph: '', ec: '', week: '', phase: 'Vegetación',
        grow: 0, micro: 0, bloom: 0, notes: '', imageUrl: ''
    });

    const fetchCrops = () => {
        const token = localStorage.getItem('token');
        fetch('/api/crops', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(d => {
                setCrops(d);
                setLoading(false);
                // Si hay un cultivo seleccionado, actualizarlo también
                if (selectedCrop) {
                    const updated = d.find(c => c.id === selectedCrop.id);
                    if (updated) setSelectedCrop(updated);
                }
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchCrops(); }, []);

    // --- ELIMINADO: handleImageUpload (Ahora se maneja directamente en los controladores de Crop/Log) ---

    const handleCreateCrop = async (e) => {
        e.preventDefault();
        setUploading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();

        formData.append('bucketName', e.target.bucketName.value);
        const file = e.target.imageFile.files[0];
        if (file) formData.append('image', file);

        try {
            const res = await fetch('/api/crops', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                fetchCrops();
                setShowCreateModal(false);
                setPreviewUrl(null);
            } else {
                alert('Error al crear el cultivo');
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        } finally {
            setUploading(false);
        }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        if (!selectedCrop) return;
        setUploading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();

        // Mapear todos los campos del formulario a FormData
        formData.append('ph', logData.ph);
        formData.append('ec', logData.ec);
        formData.append('week', logData.week);
        formData.append('phase', logData.phase);
        formData.append('grow', logData.grow);
        formData.append('micro', logData.micro);
        formData.append('bloom', logData.bloom);
        formData.append('notes', logData.notes);

        const fileInput = document.getElementById('logImageInput');
        if (fileInput?.files[0]) {
            formData.append('image', fileInput.files[0]);
        }

        try {
            const res = await fetch(`/api/crops/${selectedCrop.id}/logs`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                fetchCrops(); // Refresh state
                setShowLogModal(false); // Close modal
                setLogData({ ph: '', ec: '', week: '', phase: 'Vegetación', grow: 0, micro: 0, bloom: 0, notes: '', imageUrl: '' });
                setPreviewUrl(null);
            } else {
                const errorData = await res.json();
                alert('Error al guardar registro: ' + (errorData.error || 'Desconocido'));
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteCrop = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este cultivo? Esta acción es irreversible y eliminará todos sus registros.')) {
            return;
        }
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/crops/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setShowLogModal(false); // Close any open log modal
                setSelectedCrop(null); // Deselect the crop
                fetchCrops(); // Refresh the list of crops
            } else {
                const data = await res.json();
                alert('Error: ' + (data.error || 'No se pudo eliminar el cultivo'));
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        }
    };

    const exportData = (crop) => {
        if (!crop.logs || crop.logs.length === 0) return alert('No hay datos para exportar');

        const headers = ['Fecha', 'Semana', 'Fase', 'pH', 'EC', 'Grow', 'Micro', 'Bloom', 'Notas'];
        const rows = crop.logs.map(log => [
            new Date(log.createdAt).toLocaleDateString(),
            log.week,
            log.phase,
            log.ph,
            log.ec,
            log.grow,
            log.micro,
            log.bloom,
            `"${log.notes || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `trazabilidad_${crop.bucketName}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Cargando cultivos...</div>;

    // --- VISTA DETALLADA ---
    if (selectedCrop) {
        return (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <button
                    onClick={() => setSelectedCrop(null)}
                    style={{ background: 'transparent', color: '#8b949e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
                >
                    <ArrowLeft size={18} /> Volver a mis cultivos
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                            <h2 style={{ fontSize: '2rem', margin: 0, color: '#e6edf3' }}>{selectedCrop.bucketName}</h2>
                            <span style={{
                                background: selectedCrop.status === 'Verde' ? 'rgba(35, 134, 54, 0.2)' : selectedCrop.status === 'Amarillo' ? 'rgba(210, 153, 34, 0.2)' : 'rgba(218, 54, 51, 0.2)',
                                color: selectedCrop.status === 'Verde' ? '#3fb950' : selectedCrop.status === 'Amarillo' ? '#d29922' : '#f85149',
                                padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold'
                            }}>
                                {selectedCrop.status}
                            </span>
                        </div>
                        <p style={{ color: '#8b949e', margin: 0 }}>Trazabilidad completa y análisis agronómico</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => window.print()} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Download size={16} /> Exportar PDF
                        </button>
                        <button onClick={() => exportData(selectedCrop)} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Download size={16} /> Exportar CSV
                        </button>
                        <button onClick={() => handleDeleteCrop(selectedCrop.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.2)', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <Trash2 size={16} /> Finalizar y Eliminar
                        </button>
                        <button onClick={() => setShowLogModal(true)} className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 20px' }}>
                            <Plus size={20} /> Nuevo Registro
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #30363d', marginBottom: '25px' }}>
                    <button
                        onClick={() => setTab('trends')}
                        style={{
                            padding: '12px 20px',
                            background: 'transparent',
                            color: tab === 'trends' ? '#f0f6fc' : '#8b949e',
                            border: 'none',
                            borderBottom: tab === 'trends' ? '2px solid #238636' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: tab === 'trends' ? 'bold' : 'normal'
                        }}
                    >
                        <LineChart size={18} /> Tendencias
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        style={{
                            padding: '12px 20px',
                            background: 'transparent',
                            color: tab === 'history' ? '#f0f6fc' : '#8b949e',
                            border: 'none',
                            borderBottom: tab === 'history' ? '2px solid #238636' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: tab === 'history' ? 'bold' : 'normal'
                        }}
                    >
                        <History size={18} /> Historial
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{ minHeight: '400px' }}>
                    {tab === 'trends' ? (
                        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                            <CropTrends logs={selectedCrop.logs} />
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                            <LogHistory logs={selectedCrop.logs} onRefresh={fetchCrops} />
                        </div>
                    )}
                </div>

                {/* Modal de Registro de Bitácora (Dentro de Detail) */}
                {showLogModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#161b22', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '500px', border: '1px solid #30363d', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h3 style={{ marginTop: 0, borderBottom: '1px solid #30363d', paddingBottom: '15px' }}>📝 Nueva Entrada: {selectedCrop.bucketName}</h3>

                            <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.9rem' }}>Semana</label>
                                        <input required placeholder="Ej. Semana 3" value={logData.week} onChange={e => setLogData({ ...logData, week: e.target.value })} className="input-field" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.9rem' }}>Fase</label>
                                        <select value={logData.phase} onChange={e => setLogData({ ...logData, phase: e.target.value })} className="input-field">
                                            <option>Germinación</option>
                                            <option>Vegetación</option>
                                            <option>Floración</option>
                                            <option>Senescencia</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.9rem' }}>pH (5.5 - 6.5)</label>
                                        <input type="number" step="0.1" required value={logData.ph} onChange={e => setLogData({ ...logData, ph: e.target.value })} className="input-field" />
                                        <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>Ideal: 5.8 - 6.2</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.9rem' }}>EC (mS/cm)</label>
                                        <input type="number" step="0.1" required value={logData.ec} onChange={e => setLogData({ ...logData, ec: e.target.value })} className="input-field" />
                                        <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>Depende de la fase (0.4 - 2.2)</div>
                                    </div>
                                </div>

                                <div style={{ background: '#0d1117', padding: '15px', borderRadius: '8px', border: '1px solid #21262d' }}>
                                    <label style={{ display: 'block', color: '#8b949e', marginBottom: '10px', fontSize: '0.9rem', borderBottom: '1px solid #30363d', paddingBottom: '5px' }}>🧪 Nutrientes (ml/L)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#3fb950' }}>Grow</label>
                                            <input type="number" step="0.5" value={logData.grow} onChange={e => setLogData({ ...logData, grow: e.target.value })} className="input-field" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#a5d6ff' }}>Micro</label>
                                            <input type="number" step="0.5" value={logData.micro} onChange={e => setLogData({ ...logData, micro: e.target.value })} className="input-field" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#f85149' }}>Bloom</label>
                                            <input type="number" step="0.5" value={logData.bloom} onChange={e => setLogData({ ...logData, bloom: e.target.value })} className="input-field" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.9rem' }}>Foto de Progreso</label>
                                    <input
                                        id="logImageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) setPreviewUrl(URL.createObjectURL(file));
                                        }}
                                        className="input-field"
                                        style={{ padding: '5px' }}
                                    />
                                    {previewUrl && (
                                        <div style={{ marginTop: '10px', position: 'relative' }}>
                                            <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                                            {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem' }}>Subiendo...</div>}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.9rem' }}>Notas / Observaciones</label>
                                    <textarea rows="2" value={logData.notes} onChange={e => setLogData({ ...logData, notes: e.target.value })} className="input-field" placeholder="Ej. Hojas bajas amarilleando..." />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setShowLogModal(false)} style={{ background: 'transparent', padding: '10px 20px', color: '#8b949e', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" className="btn-primary" style={{ padding: '10px 25px' }} disabled={uploading}>
                                        {uploading ? 'Subiendo...' : 'Guardar Registro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .input-field {
                        width: 100%;
                        padding: 10px;
                        background: #0d1117;
                        border: 1px solid #30363d;
                        color: white;
                        border-radius: 6px;
                        outline: none;
                    }
                    .input-field:focus {
                        border-color: #58a6ff;
                    }
                    .btn-primary {
                        background: #238636;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        padding: 8px 16px;
                    }
                    .btn-primary:hover {
                        background: #2ea043;
                    }

                    @media print {
                        aside, button, .modal, .tabs-header {
                            display: none !important;
                        }
                        body {
                            background: white !important;
                            color: black !important;
                        }
                        #print-report {
                            display: block !important;
                            padding: 20px;
                        }
                        .input-field, .btn-primary {
                            display: none !important;
                        }
                        h2, h3 { color: black !important; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #30363d', paddingBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e6edf3' }}>Mis Cultivos</h2>
                    <p style={{ color: '#8b949e' }}>Monitoreo en tiempo real y trazabilidad avanzada</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 20px' }}>
                    <Plus size={20} /> Nuevo Balde
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                {crops.map(crop => {
                    const lastLog = crop.logs?.[0] || {};
                    return (
                        <div key={crop.id} className="citro-card" onClick={() => setSelectedCrop(crop)} style={{ cursor: 'pointer' }}>
                            <div style={{ position: 'relative' }}>
                                {crop.imageUrl ? (
                                    <img src={crop.imageUrl} alt={crop.bucketName} className="citro-card-img" />
                                ) : (
                                    <div className="citro-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🌿</div>
                                )}
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <span style={{
                                        background: crop.status === 'Verde' ? 'rgba(35, 134, 54, 0.9)' : crop.status === 'Amarillo' ? 'rgba(210, 153, 34, 0.9)' : 'rgba(218, 54, 51, 0.9)',
                                        color: '#fff',
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(4px)'
                                    }}>
                                        <Activity size={12} /> {crop.status}
                                    </span>
                                </div>
                            </div>

                            <div className="citro-card-body">
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 15px 0', color: 'var(--text-primary)' }}>{crop.bucketName}</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Fase Actual</div>
                                        <div style={{ color: 'var(--accent-light)', fontWeight: '600', fontSize: '0.9rem' }}>{lastLog.phase || 'N/A'}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Semana</div>
                                        <div style={{ color: 'var(--accent-light)', fontWeight: '600', fontSize: '0.9rem' }}>{lastLog.week || '-'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>pH</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{lastLog.ph ?? '--'}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>EC</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{lastLog.ec ?? '--'}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(88, 166, 255, 0.05)', color: '#58a6ff', fontSize: '0.85rem', textAlign: 'center', fontWeight: '500', borderTop: '1px solid var(--border)' }}>
                                Ver trazabilidad completa →
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Crear (Simple) */}
            {
                showCreateModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <div style={{ background: '#161b22', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '400px', border: '1px solid #30363d' }}>
                            <h3>Nuevo Cultivo</h3>
                            <form onSubmit={handleCreateCrop}>
                                <input name="bucketName" placeholder="Nombre (ej. Amnesia Haze #1)" autoFocus className="input-field" style={{ marginBottom: '15px' }} required />
                                <label style={{ display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.8rem' }}>Foto de Genética</label>
                                <input
                                    name="imageFile"
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file) setPreviewUrl(URL.createObjectURL(file));
                                    }}
                                    className="input-field"
                                    style={{ marginBottom: '15px', padding: '5px' }}
                                />
                                {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }} />}

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => { setShowCreateModal(false); setPreviewUrl(null); }} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" className="btn-primary" disabled={uploading}>
                                        {uploading ? 'Subiendo...' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .input-field {
                    width: 100%;
                    padding: 10px;
                    background: #0d1117;
                    border: 1px solid #30363d;
                    color: white;
                    border-radius: 6px;
                    outline: none;
                }
                .input-field:focus {
                    border-color: #58a6ff;
                }
                .btn-primary {
                    background: #238636;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    padding: 8px 16px;
                }
                .btn-primary:hover {
                    background: #2ea043;
                }
            `}</style>
        </div >
    );
}
