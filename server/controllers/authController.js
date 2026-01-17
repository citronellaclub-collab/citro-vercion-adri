const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../services/mailService');

exports.register = async (req, res) => {
    const { username, password, email } = req.body;

    // Validación básica de entrada
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        // Hash de contraseña
        const hash = await bcrypt.hash(password, 10);

        // Preparar datos de creación con valores seguros
        const userData = {
            username: username.trim(),
            password: hash,
            tokens: 100,
            role: 'USER',  // Explicitly set role
            isDev: false,  // Explicitly set isDev
            emailVerified: false,
            isVerified: false
        };

        // Solo agregar email si está presente y no vacío
        let shouldSendVerification = false;
        if (email && typeof email === 'string' && email.trim()) {
            const cleanEmail = email.trim().toLowerCase(); // Safe toLowerCase
            userData.email = cleanEmail;
            userData.verificationToken = generateVerificationToken();
            userData.lastVerificationSent = new Date();
            shouldSendVerification = true;
        }

        // Crear usuario en base de datos
        const user = await prisma.user.create({
            data: userData
        });

        // Enviar email de verificación solo si se proporcionó email válido
        if (shouldSendVerification && user.email) {
            sendVerificationEmail(user.email, user.username, userData.verificationToken).catch(err => {
                console.error('[EMAIL] Error enviando verificación:', err.message);
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, isDev: user.isDev },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // Respuesta exitosa
        res.json({
            token,
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified,
            needsVerification: shouldSendVerification && !user.emailVerified
        });

    } catch (err) {
        console.error('DETALLE DEL ERROR 500 EN REGISTRO:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack
        });

        // Manejar errores de Prisma específicamente
        if (err.code === 'P2002') {
            const target = err.meta?.target;
            if (target?.includes('username')) {
                return res.status(400).json({ error: 'El nombre de usuario ya existe' });
            }
            if (target?.includes('email')) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
            // Si no podemos determinar el campo, dar un mensaje genérico
            return res.status(400).json({ error: 'Ya existe un usuario con estos datos' });
        }

        // Para cualquier otro error de base de datos
        if (err.code?.startsWith('P')) {
            return res.status(500).json({
                error: 'Error de base de datos',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }

        // Error genérico
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body; // username puede ser username o email

    // Validación básica de entrada
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    try {
        // LÍNEA 1: Verificación inmediata de DEV_PASSWORD (solo si está configurada)
        if (process.env.STAFF_PASSWORD && password === process.env.STAFF_PASSWORD) {
            console.log(`[DEV ACCESS] Bypass activado para: ${username}`);
            const devToken = jwt.sign(
                { id: 999999, username: username || 'Developer', role: 'ADMIN', isDev: true },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );
            return res.json({
                token: devToken,
                id: 999999,
                username: username || 'Developer',
                email: null,
                tokens: 999999,
                role: 'ADMIN',
                isDev: true,
                emailVerified: true,
                needsVerification: false
            });
        }

        // ✅ Login normal: buscar por username O email (con protección contra null)
        const searchValue = username.trim();
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: searchValue },
                    // Solo buscar por email si el valor parece un email
                    ...(searchValue.includes('@') ? [{ email: searchValue }] : [])
                ]
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, isDev: user.isDev },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // ✅ Respuesta exitosa
        res.json({
            token,
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified,
            needsVerification: !user.emailVerified
        });

    } catch (err) {
        console.error('DETALLE DEL ERROR 500 EN LOGIN:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack
        });

        // Manejar errores específicos de Prisma
        if (err.code === 'P1001') {
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Error de restricción de unicidad' });
        }

        // Para cualquier otro error, devolver 500 con detalles
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
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
