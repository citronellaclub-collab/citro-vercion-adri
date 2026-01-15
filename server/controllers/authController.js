const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');

exports.register = async (req, res) => {
    const { username, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username,
                password: hash,
                tokens: 100 // Default tokens
            }
        });

        // Auto-login after register
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret');
        res.json({ token, username: user.username, tokens: user.tokens });

    } catch (err) {
        if (err.code === 'P2002') { // Prisma unique constraint error
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret');
        res.json({ token, username: user.username, tokens: user.tokens });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
