import { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, User, PenTool } from 'lucide-react';

export default function Forum() {
    const [posts, setPosts] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const loadPosts = () => {
        const token = localStorage.getItem('token');
        fetch('/api/forum', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => setPosts(Array.isArray(d) ? d : []));
    };

    useEffect(() => { loadPosts(); }, []);

    const handlePost = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const { title, content } = e.target.elements;

        const res = await fetch('/api/forum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: title.value, content: content.value })
        });

        if (res.ok) {
            loadPosts();
            setShowModal(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
                <h2>💬 Foro Comunitario</h2>
                <button onClick={() => setShowModal(true)} className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <PenTool size={16} /> Nuevo Tema
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ background: '#30363d', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={16} />
                            </div>
                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#58a6ff' }}>{post.author}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#8b949e' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{post.title}</h3>
                        <p style={{ color: '#8b949e', lineHeight: '1.5', margin: '0 0 15px 0' }}>{post.content}</p>

                        <div style={{ display: 'flex', gap: '15px', color: '#8b949e', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <ThumbsUp size={16} /> {post.likes}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <MessageCircle size={16} /> {post.comments} Comentarios
                            </div>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && <p>No hay publicaciones aún.</p>}
            </div>

            {/* Modal Crear */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#161b22', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', border: '1px solid #30363d' }}>
                        <h3>Nuevo Tema</h3>
                        <form onSubmit={handlePost}>
                            <input name="title" placeholder="Título" style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '6px', marginBottom: '15px' }} required />
                            <textarea name="content" placeholder="Contenido..." rows="4" style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '6px', marginBottom: '15px' }} required></textarea>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Publicar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
