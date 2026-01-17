const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../services/mailService');

exports.register = async (req, res) => {
    const { username, password, email } = req.body;

    // Validación: email es obligatorio
    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'El email es obligatorio' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();

        const user = await prisma.user.create({
            data: {
                username,
                password: hash,
                email: email.trim(),  // ✅ Email obligatorio y limpio
                tokens: 100,
                verificationToken,
                lastVerificationSent: new Date()
            }
        });

        // ✅ Enviar email de verificación (siempre, ya que email es obligatorio)
        sendVerificationEmail(email.trim(), username, verificationToken).catch(err => {
            console.error('[EMAIL] Error enviando verificación:', err.message);
        });

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
            // ✅ Manejar duplicados de username o email
            if (err.meta?.target?.includes('username')) {
                return res.status(400).json({ error: 'El nombre de usuario ya existe' });
            }
            if (err.meta?.target?.includes('email')) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
        }
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body; // username puede ser username o email

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

        // ✅ Login normal: buscar por username O email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }  // username puede ser email
                ]
            }
        });

        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, role: user.role, isDev: user.isDev },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // ✅ Soft Block: Siempre devolver 200, pero indicar si necesita verificación
        res.json({
            token,
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified,
            needsVerification: !user.emailVerified  // ✅ Flag para frontend
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
