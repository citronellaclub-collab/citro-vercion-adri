const prisma = require('../../config/db');
const { uploadToBlob } = require('../utils/blobService');

exports.getPosts = async (req, res) => {
    const { category, sortBy, search } = req.query;
    try {
        let where = {};
        if (category && category !== 'Todos') where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        const posts = await prisma.post.findMany({
            where,
            orderBy: { createdAt: sortBy === 'oldest' ? 'asc' : 'desc' },
            include: {
                author: { select: { username: true } },
                attachments: true,
                reactions: true,
                _count: { select: { comments: true } }
            }
        });

        const formatted = posts.map(p => ({
            ...p,
            author: p.author.username,
            comments: p._count.comments,
            isSubscribed: false // We'll handle this per-user if needed
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cargando foro' });
    }
};

exports.createPost = async (req, res) => {
    const { title, content, category, youtubeLink } = req.body;

    // LOG VIOLENTO PARA DEBUG DE PRISMA
    console.log('[DEBUG FORO] Datos entrantes:', { title, category, youtubeLink, files: req.files?.length });

    if (!title || !content) {
        return res.status(400).json({ error: 'Título y contenido son obligatorios' });
    }

    try {
        // 1. Crear el Post con los campos exactos sincronizados
        const post = await prisma.post.create({
            data: {
                title,
                content,
                category: category || 'Debates',
                youtubeLink: youtubeLink || null,
                authorId: req.user.id
            },
            include: { author: { select: { username: true } } }
        });

        console.log('[DEBUG FORO] Post guardado en Prisma:', post.id);

        // 2. Manejar adjuntos multimodal
        if (req.files && req.files.length > 0) {
            console.log(`[DEBUG FORO] Intentando subir ${req.files.length} archivos...`);

            try {
                const attachmentData = await Promise.all(req.files.map(async file => {
                    const url = await uploadToBlob('forum/attachments', file);
                    return {
                        name: file.originalname,
                        url,
                        type: file.mimetype.split('/')[1] || 'bin',
                        postId: post.id
                    };
                }));

                // Guardar en la tabla de adjuntos para soporte multifile
                await prisma.attachment.createMany({ data: attachmentData });

                // Actualizar el fileUrl del post con el primer archivo para compatibilidad simple requested
                await prisma.post.update({
                    where: { id: post.id },
                    data: { fileUrl: attachmentData[0].url }
                });

                console.log('[DEBUG FORO] Adjuntos vinculados con éxito');
            } catch (blobError) {
                console.warn('[WARNING] Error en Vercel Blob (Probablemente modo local):', blobError.message);
                // No bloqueamos la publicación, pero retornamos una advertencia
                return res.json({
                    message: 'Conocimiento compartido parcialmente',
                    warning: 'La subida de archivos no está disponible en este entorno (Falta BLOB_TOKEN). El texto y links se guardaron correctamente.',
                    id: post.id
                });
            }
        }

        res.json({ message: 'Conocimiento compartido con éxito', id: post.id });

    } catch (error) {
        console.error('[CRITICAL] Error en persistencia de Foro:', error);

        // Reporte de errores detallado solicitado por el usuario
        let msg = 'Error interno al guardar publicación';
        if (error.code === 'P2002') msg = 'Error de unicidad en Prisma';
        if (error.message.includes('category')) msg = 'Error: El campo category sigue sin ser reconocido por Prisma. Revisa la sincronización.';

        res.status(500).json({
            error: msg,
            details: error.message,
            prismaCode: error.code
        });
    }
};

exports.addComment = async (req, res) => {
    const { content } = req.body;
    const { id } = req.params;
    try {
        const comment = await prisma.comment.create({
            data: {
                content,
                postId: parseInt(id),
                authorId: req.user.id
            }
        });

        // Notify subscribers (Logic placeholder - would use a notification service)
        const subscribers = await prisma.subscription.findMany({
            where: { postId: parseInt(id) }
        });

        for (const sub of subscribers) {
            if (sub.userId !== req.user.id) {
                await prisma.notification.create({
                    data: {
                        userId: sub.userId,
                        message: `Nuevo comentario en el hilo que sigues: "${content.substring(0, 30)}..."`
                    }
                });
            }
        }

        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Error al comentar' });
    }
};

exports.toggleSubscription = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const postId = parseInt(id);

    try {
        const existing = await prisma.subscription.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existing) {
            await prisma.subscription.delete({
                where: { id: existing.id }
            });
            res.json({ subscribed: false });
        } else {
            await prisma.subscription.create({
                data: { userId, postId }
            });
            res.json({ subscribed: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error en la suscripción' });
    }
};

exports.reactToPost = async (req, res) => {
    const { id } = req.params;
    const { type } = req.body; // Interesante, Útil, Científico
    const userId = req.user.id;
    const postId = parseInt(id);

    try {
        await prisma.reaction.upsert({
            where: { userId_postId: { userId, postId } },
            update: { type },
            create: { userId, postId, type }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al reaccionar' });
    }
};

exports.getSubscriptions = async (req, res) => {
    try {
        const subs = await prisma.subscription.findMany({
            where: { userId: req.user.id },
            include: { post: { include: { author: { select: { username: true } } } } }
        });
        res.json(subs.map(s => s.post));
    } catch (error) {
        res.status(500).json({ error: 'Error cargando suscripciones' });
    }
};

exports.deletePost = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
        if (!post) return res.status(404).json({ error: 'Post no encontrado' });

        // Solo el autor puede eliminar (moderación simple por ahora)
        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
        }

        await prisma.post.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Post eliminado con éxito' });
    } catch (error) {
        console.error('Error eliminando post:', error);
        res.status(500).json({ error: 'Error al eliminar la publicación' });
    }
};
