const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');

exports.register = async (req, res) => {
    const { username, password, email } = req.body;

    // Validación mínima
    if (!username?.trim() || !password || password.length < 6) {
        return res.status(400).json({ error: 'Username y password (6+ chars) requeridos' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        // Datos mínimos requeridos por schema
        const userData = {
            username: username.trim(),
            password: hash,
            tokens: 100,
            role: 'USER',
            isDev: false,
            emailVerified: false,
            isVerified: false
        };

        // Email opcional
        if (email?.trim()) {
            userData.email = email.trim();
        }

        const user = await prisma.user.create({ data: userData });

        const token = jwt.sign(
            { id: user.id, role: user.role, isDev: user.isDev },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified
        });

    } catch (err) {
        // Devolver error real para debugging
        res.status(500).json({
            error: 'Registration failed',
            prismaError: err.message,
            code: err.code,
            meta: err.meta
        });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
        return res.status(400).json({ error: 'Username y password requeridos' });
    }

    try {
        const searchValue = username.trim();
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: searchValue },
                    ...(searchValue.includes('@') ? [{ email: searchValue }] : [])
                ]
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, isDev: user.isDev },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified
        });

    } catch (err) {
        // Devolver error real para debugging
        res.status(500).json({
            error: 'Login failed',
            prismaError: err.message,
            code: err.code,
            meta: err.meta
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        // Bypass para tokens de desarrollador
        if (req.user.isDev === true) {
            return res.json({
                id: req.user.id,
                username: req.user.username || 'Developer',
                email: null,
                tokens: 999999,
                role: 'ADMIN',
                isDev: true,
                emailVerified: true
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Nuevo endpoint: Reenviar email de verificación
exports.resendVerification = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // ✅ Verificar que el usuario tenga un email registrado
        if (!user.email || user.email.trim() === '') {
            return res.status(400).json({
                error: 'No tienes un correo registrado. Por favor, proporciónalo en tu perfil',
                code: 'MISSING_EMAIL'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({ error: 'El email ya está verificado' });
        }

        // Verificar rate limit (máximo 1 email cada 5 minutos)
        if (user.lastVerificationSent) {
            const timeSinceLastEmail = Date.now() - new Date(user.lastVerificationSent).getTime();
            const fiveMinutes = 5 * 60 * 1000;

            if (timeSinceLastEmail < fiveMinutes) {
                const remainingTime = Math.ceil((fiveMinutes - timeSinceLastEmail) / 1000 / 60);
                return res.status(429).json({
                    error: `Por favor espera ${remainingTime} minuto(s) antes de solicitar otro email`
                });
            }
        }

        // Generar nuevo token
        const newToken = generateVerificationToken();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: newToken,
                lastVerificationSent: new Date()
            }
        });

        // Enviar email
        await sendVerificationEmail(user.email, user.username, newToken);

        res.json({ message: 'Email de verificación enviado' });

    } catch (err) {
        console.error('[RESEND ERROR]', err.message);
        res.status(500).json({ error: 'Error al reenviar email de verificación' });
    }
};

// Nuevo endpoint: Actualizar email del usuario
exports.updateEmail = async (req, res) => {
    const { email } = req.body;

    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'El email es obligatorio' });
    }

    // Validación básica de formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    try {
        // Verificar si el email ya está en uso por otro usuario
        const existingUser = await prisma.user.findUnique({
            where: { email: email.trim() }
        });

        if (existingUser && existingUser.id !== req.user.id) {
            return res.status(400).json({ error: 'Este email ya está registrado por otro usuario' });
        }

        // Actualizar email y resetear verificación
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                email: email.trim(),
                emailVerified: false,  // Reset verification status
                verificationToken: null,  // Clear any existing token
                lastVerificationSent: null
            }
        });

        // Enviar email de verificación para el nuevo email (no bloqueante)
        const verificationToken = generateVerificationToken();
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                verificationToken,
                lastVerificationSent: new Date()
            }
        });

        sendVerificationEmail(email.trim(), updatedUser.username, verificationToken).catch(err => {
            console.error('[EMAIL] Error enviando verificación para email actualizado:', err.message);
        });

        res.json({
            message: 'Email actualizado exitosamente. Se ha enviado un email de verificación.',
            email: updatedUser.email,
            emailVerified: false
        });

    } catch (err) {
        console.error('[UPDATE EMAIL ERROR]', err.message);
        res.status(500).json({ error: 'Error al actualizar email' });
    }
};

// Nuevo endpoint: Verificar email con token
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token de verificación inválido o expirado' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ error: 'El email ya está verificado' });
        }

        // Actualizar usuario
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null
            }
        });

        // Enviar email de bienvenida (no bloqueante)
        sendWelcomeEmail(user.email, user.username).catch(err => {
            console.error('[EMAIL] Error enviando bienvenida:', err.message);
        });

        res.json({ message: 'Email verificado exitosamente' });

    } catch (err) {
        console.error('[VERIFY ERROR]', err.message);
        res.status(500).json({ error: 'Error al verificar email' });
    }
};
