const prisma = require('../../config/db');

exports.getPosts = async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { username: true } },
                _count: { select: { comments: true } }
            }
        });
        // Format for frontend
        const formatted = posts.map(p => ({
            id: p.id,
            title: p.title,
            content: p.content,
            author: p.author.username,
            likes: p.likes,
            comments: p._count.comments,
            createdAt: p.createdAt
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Error cargando foro' });
    }
};

exports.createPost = async (req, res) => {
    const { title, content } = req.body;
    try {
        const post = await prisma.post.create({
            data: {
                title,
                content,
                authorId: req.user.id
            },
            include: { author: { select: { username: true } } }
        });

        res.json({
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.author.username,
            likes: 0,
            comments: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creando post' });
    }
};
