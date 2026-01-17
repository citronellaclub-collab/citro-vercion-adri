const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../services/mailService');

exports.register = async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();

        const user = await prisma.user.create({
            data: {
                username,
                password: hash,
                email: email || `${username}@temp.citronella.club`, // Email temporal si no se proporciona
                tokens: 100,
                verificationToken,
                lastVerificationSent: new Date()
            }
        });

        // Enviar email de verificación (no bloqueante)
        if (email) {
            sendVerificationEmail(email, username, verificationToken).catch(err => {
                console.error('[EMAIL] Error enviando verificación:', err.message);
            });
        }

        const token = jwt.sign({ id: user.id, role: user.role, isDev: user.isDev }, process.env.JWT_SECRET || 'secret');
        res.json({
            token,
            id: user.id,
            username: user.username,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified,
            needsVerification: !user.emailVerified
        });

    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // LÍNEA 1: Verificación inmediata de DEV_PASSWORD
        if (password === process.env.STAFF_PASSWORD) {
            console.log(`[DEV ACCESS] Bypass activado para: ${username}`);
            const devToken = jwt.sign(
                { id: 999999, username: username, role: 'ADMIN', isDev: true },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );
            return res.json({
                token: devToken,
                id: 999999,
                username: username,
                tokens: 999999,
                role: 'ADMIN',
                isDev: true,
                emailVerified: true,
                needsVerification: false
            });
        }

        // Login normal
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, role: user.role, isDev: user.isDev },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // Edge Case: Permitir acceso pero notificar si el email no está verificado
        res.json({
            token,
            id: user.id,
            username: user.username,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified,
            needsVerification: !user.emailVerified
        });

    } catch (err) {
        console.error('[AUTH ERROR]', err.message);
        res.status(500).json({ error: 'Error en autenticación' });
    }
};

exports.getMe = async (req, res) => {
    try {
        // Bypass para tokens de desarrollador
        if (req.user.isDev === true) {
            return res.json({
                id: req.user.id,
                username: req.user.username || 'Developer',
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
