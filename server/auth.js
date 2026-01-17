const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no provisto.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev');
        req.user = verified;

        // BYPASS DE MIDDLEWARE: Si el token tiene isDev: true, ignorar errores de DB
        if (verified.isDev === true) {
            console.log('[MIDDLEWARE BYPASS] Developer token detected, skipping DB validation');
        }

        next();
    } catch (err) {
        res.status(400).json({ error: 'Token inválido' });
    }
};
