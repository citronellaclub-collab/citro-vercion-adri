const prisma = require('../../config/db');

exports.verifyStaff = async (req, res) => {
    const { password } = req.body;
    if (password === process.env.STAFF_PASSWORD) {
        try {
            const user = await prisma.user.update({
                where: { id: req.user.id },
                data: { role: 'ADMIN', isDev: true }
            });
            return res.json({ success: true, message: 'Acceso Staff concedido', role: user.role });
        } catch (error) {
            console.error('Error al actualizar rol de admin:', error);
            return res.status(500).json({ error: 'Error técnico al conceder acceso' });
        }
    }
    res.status(401).json({ error: 'Clave de Desarrollador incorrecta' });
};

exports.updateUserTokens = async (req, res) => {
    const { userId, amount, action } = req.body; // action: 'add' | 'subtract' | 'set'
    try {
        let updateData = {};
        if (action === 'add') updateData = { tokens: { increment: parseInt(amount) } };
        else if (action === 'subtract') updateData = { tokens: { decrement: parseInt(amount) } };
        else updateData = { tokens: parseInt(amount) };

        const user = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: updateData
        });
        res.json({ success: true, tokens: user.tokens });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar tokens' });
    }
};

exports.updateLegal = async (req, res) => {
    const { terms, type } = req.body;
    try {
        const legal = await prisma.legalContent.upsert({
            where: { type },
            update: { terms },
            create: { terms, type }
        });
        res.json(legal);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar contenido legal' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, tokens: true, role: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar usuarios' });
    }
};

exports.moderatePost = async (req, res) => {
    const { postId } = req.params;
    const { isPinned, isImmutable, action } = req.body; // action: 'update' | 'delete'
    try {
        if (action === 'delete') {
            await prisma.post.delete({ where: { id: parseInt(postId) } });
            return res.json({ success: true, message: 'Post eliminado' });
        }
        const post = await prisma.post.update({
            where: { id: parseInt(postId) },
            data: {
                isPinned: isPinned !== undefined ? isPinned : undefined,
                isImmutable: isImmutable !== undefined ? isImmutable : undefined
            }
        });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Error en moderación' });
    }
};
