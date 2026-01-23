const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

module.exports = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no provisto.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev');

        // BYPASS DE MIDDLEWARE: Si el token tiene isDev: true, ignorar errores de DB
        if (verified.isDev === true) {
            console.log('[MIDDLEWARE BYPASS] Developer token detected, skipping DB validation');
            req.user = verified;
            return next();
        }

        // Fetch fresh user data from DB to ensure permissions are up-to-date
        console.log('[AUTH MIDDLEWARE] Fetching fresh user data for ID:', verified.id);
        let dbUser;
        try {
            dbUser = await prisma.user.findUnique({
                where: { id: verified.id }
            });
        } catch (dbError) {
            console.error('[AUTH MIDDLEWARE] DB error:', dbError);
            return res.status(500).json({ error: 'Error de base de datos' });
        }

        if (!dbUser) {
            console.log('[AUTH MIDDLEWARE] User not found in DB for ID:', verified.id);
            return res.status(401).json({ error: 'Usuario no encontrado en base de datos' });
        }

        console.log('[AUTH MIDDLEWARE] DB user data:', { id: dbUser.id, isVerified: dbUser.isVerified, emailVerified: dbUser.emailVerified, role: dbUser.role });

        // Merge JWT data with DB data, prioritizing DB for critical fields
        req.user = {
            ...verified,
            ...dbUser,
            // Ensure DB fields override JWT for security
            isVerified: dbUser.isVerified,
            role: dbUser.role,
            emailVerified: dbUser.emailVerified
        };

        console.log('[AUTH MIDDLEWARE] Final req.user:', { id: req.user.id, isVerified: req.user.isVerified, emailVerified: req.user.emailVerified, role: req.user.role });

        next();
    } catch (err) {
        console.error('[AUTH MIDDLEWARE ERROR]', err.message);
        res.status(400).json({ error: 'Token inválido' });
    }
};
