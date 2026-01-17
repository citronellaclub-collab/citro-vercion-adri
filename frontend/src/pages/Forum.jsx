import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, ThumbsUp, User, PenTool, FileText, Youtube, Download, Bell, Filter, BookOpen, Search, Send, X, Paperclip, MoreHorizontal, FlaskConical, Lightbulb, Star, Trash2, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VerificationGuard from '../components/VerificationGuard';

const CATEGORIES = ['Clases', 'Investigaciones', 'FAQ', 'Debates', 'Papers', 'Noticias', 'Anuncios'];

export default function Forum() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [category, setCategory] = useState('Todos');
    const [sortBy, setSortBy] = useState('newest');
    const [search, setSearch] = useState('');
    const [readingMode, setReadingMode] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);

    // New Post State
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        category: 'Debates',
        youtubeLink: '',
        files: []
    });

    const handleResetForm = () => {
        setNewPost({ title: '', content: '', category: 'Debates', youtubeLink: '', files: [] });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ category, sortBy, search });
            const res = await fetch(`/api/forum?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPosts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading forum:', error);
        } finally {
            setLoading(false);
        }
    }, [category, sortBy, search]);

    useEffect(() => {
        const timeout = setTimeout(loadPosts, 400);
        return () => clearTimeout(timeout);
    }, [loadPosts]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setUploading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('title', newPost.title);
        formData.append('content', newPost.content);
        formData.append('category', newPost.category);
        formData.append('youtubeLink', newPost.youtubeLink);
        newPost.files.forEach(file => formData.append('attachments', file));

        try {
            const res = await fetch('/api/forum', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // Si hay un warning (ej: modo local/sin blob token), avisamos pero seguimos
                if (data.warning) {
                    alert(`[MODO LOCAL] ${data.warning}`);
                }
                setShowModal(false);
                handleResetForm();
                await loadPosts();
            } else {
                // Reporte de errores detallado de Prisma solicitado por el usuario
                const errorDetail = data.details || data.error || 'Desconocido';
                alert(`[PRISMA ERROR] ${data.error}\n\nDetalles: ${errorDetail}\nCódigo: ${data.prismaCode || 'N/A'}`);
                console.error('Prisma Conflict:', data);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error crítico de conexión: El servidor no responde o hay un conflicto de red.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este post permanentemente?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/forum/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                // Actualización optimista: removemos del estado local inmediatamente
                setPosts(posts.filter(p => p.id !== id));
            } else {
                const data = await res.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Error al conectar con el servidor para eliminar.');
        }
    };

    const handleSubscription = async (id) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/forum/${id}/subscribe`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        loadPosts();
    };

    const handleReaction = async (id, type) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/forum/${id}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ type })
        });
        loadPosts();
    };

    const getYoutubeID = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div style={{ display: 'flex', gap: '30px', minHeight: 'calc(100vh - 100px)' }}>
            {/* Sidebar Categorías */}
            <aside style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Disciplinas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button onClick={() => setCategory('Todos')} style={{ textAlign: 'left', padding: '10px 15px', borderRadius: '8px', border: 'none', background: category === 'Todos' ? 'var(--accent)' : 'transparent', color: category === 'Todos' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s', fontWeight: 'bold' }}>Todos</button>
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                style={{
                                    textAlign: 'left', padding: '10px 15px', borderRadius: '8px', border: 'none',
                                    background: category === c ? 'var(--accent)' : 'transparent',
                                    color: category === c ? '#fff' : 'var(--text-secondary)',
                                    cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem'
                                }}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Filtros de Red</h3>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none' }}>
                        <option value="newest">Más Recientes</option>
                        <option value="oldest">Más Antiguos</option>
                    </select>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header / Search */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar investigaciones, debates o papers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 45px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
                        />
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ width: 'auto', padding: '14px 25px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PenTool size={18} /> Publicar
                    </button>
                </div>

                {/* Posts Feed */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Cargando conocimientos...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {posts.map(post => {
                            const ytId = getYoutubeID(post.youtubeLink);
                            return (
                                <div key={post.id} className="citro-card" style={{ padding: '0', overflow: 'hidden' }}>
                                    {/* Post Header */}
                                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                            <User size={20} color="var(--accent-light)" />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#fff' }}>{post.author}</span>
                                                <span style={{ fontSize: '0.7rem', background: 'var(--border)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{post.category}</span>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(post.createdAt).toLocaleString()}</span>
                                        </div>
                                        <button onClick={() => handleSubscription(post.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <Bell size={18} fill={post.isSubscribed ? 'var(--accent)' : 'none'} color={post.isSubscribed ? 'var(--accent)' : 'currentColor'} />
                                        </button>
                                        {user && (post.authorId == user.id || user.username === 'admin') && (
                                            <button onClick={() => handleDeletePost(post.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', marginLeft: '10px' }} title="Eliminar Publicación">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Post Content */}
                                    <div style={{ padding: '25px' }}>
                                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-light)' }}>{post.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
                                            {post.content}
                                        </p>

                                        {/* Multimodal Preview */}
                                        {ytId && (
                                            <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', aspectVideo: '16/9', background: '#000' }}>
                                                <iframe
                                                    width="100%"
                                                    height="350"
                                                    src={`https://www.youtube.com/embed/${ytId}`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}

                                        {post.attachments && post.attachments.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                                {post.attachments.map(file => (
                                                    <a key={file.id} href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-primary)', transition: '0.2s' }} className="attachment-link">
                                                        <FileText size={20} color="var(--accent)" />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{file.name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{file.type}</div>
                                                        </div>
                                                        <Download size={18} color="var(--text-secondary)" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Post Footer / Reactions */}
                                    <div style={{ padding: '15px 25px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', gap: '20px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleReaction(post.id, 'Interesante')} title="Interesante" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                <Lightbulb size={18} /> {post.reactions?.filter(r => r.type === 'Interesante').length || 0}
                                            </button>
                                            <button onClick={() => handleReaction(post.id, 'Científico')} title="Científico" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                <FlaskConical size={18} /> {post.reactions?.filter(r => r.type === 'Científico').length || 0}
                                            </button>
                                            <button onClick={() => handleReaction(post.id, 'Útil')} title="Útil" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                <Star size={18} /> {post.reactions?.filter(r => r.type === 'Útil').length || 0}
                                            </button>
                                        </div>

                                        {(post.category === 'Papers' || post.category === 'Investigaciones') && (
                                            <button onClick={() => setReadingMode(post)} style={{ background: 'rgba(46, 160, 67, 0.1)', border: '1px solid var(--accent)', color: 'var(--accent-light)', padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <BookOpen size={14} /> Modo Lectura
                                            </button>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 'auto' }}>
                                            <MessageCircle size={18} /> {post.comments} Comentarios
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modal Modo Lectura */}
            {readingMode && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-dark)', zIndex: 2000, overflowY: 'auto', padding: '40px 20px' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-panel)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative' }}>
                        <button onClick={() => setReadingMode(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={30} /></button>

                        <div style={{ marginBottom: '30px' }}>
                            <span style={{ background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>{readingMode.category}</span>
                            <h2 style={{ fontSize: '2.5rem', margin: '15px 0', fontWeight: '900', color: '#fff', lineHeight: '1.2' }}>{readingMode.title}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                                <User size={16} /> <span style={{ fontWeight: 'bold' }}>{readingMode.author}</span> • <span>{new Date(readingMode.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'serif', background: 'var(--bg-dark)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            {readingMode.content}
                        </div>

                        {readingMode.attachments && readingMode.attachments.length > 0 && (
                            <div style={{ marginTop: '30px' }}>
                                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Documentación Técnica Adjunta</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {readingMode.attachments.map(file => (
                                        <a key={file.id} href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-primary)' }}>
                                            <FileText size={20} color="var(--accent)" />
                                            <span>{file.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Publicación Multimodal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '700px', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><PenTool size={20} color="var(--accent)" /> Compartir Conocimiento</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X /></button>
                        </div>
                        <form onSubmit={handleCreatePost} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Disciplina</label>
                                    <select value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Recurso Externo (YouTube)</label>
                                    <input type="text" placeholder="https://youtube.com/watch?v=..." value={newPost.youtubeLink} onChange={e => setNewPost({ ...newPost, youtubeLink: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Título de la Investigación o Debate</label>
                                <input type="text" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} required placeholder="Ej: Análisis de Terpenos en Senescencia Avanzada" style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }} />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Cuerpo del Artículo</label>
                                <textarea rows="6" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} required placeholder="Redacta los hallazgos o el disparador del debate..." style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', resize: 'none', lineHeight: '1.6' }}></textarea>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Documentación Adjunta (PDF/DOCX/Etc)</label>
                                <div style={{ position: 'relative', background: 'var(--bg-dark)', border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={e => setNewPost({ ...newPost, files: Array.from(e.target.files) })}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    />
                                    <Paperclip size={24} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {newPost.files.length > 0 ? `${newPost.files.length} archivos seleccionados` : 'Arrastra archivos o haz clic para subir'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button type="button" onClick={handleResetForm} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                    <RotateCcw size={18} /> Limpiar
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={uploading} className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: '12px', fontWeight: 'bold' }}>
                                    {uploading ? 'Codificando conocimientos...' : 'Publicar en Citro Red'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .attachment-link:hover {
                    background: var(--bg-panel) !important;
                    border-color: var(--accent) !important;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
