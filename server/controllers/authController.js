console.log('🔄 AUTH CONTROLLER LOADING...');

// Simplified imports to avoid loading issues
const jwt = require('jsonwebtoken');
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../services/mailService');

console.log('📚 JWT IMPORT LOADED');

// Lazy load bcrypt and prisma to avoid startup issues
let bcrypt, prisma;

const loadDependencies = () => {
    if (!bcrypt) {
        try {
            bcrypt = require('bcryptjs');
            console.log('🔐 BCRYPT LOADED');
        } catch (e) {
            console.error('❌ BCRYPT LOAD FAILED:', e.message);
        }
    }
    if (!prisma) {
        try {
            prisma = require('../../config/db');
            console.log('🗄️ PRISMA LOADED');
        } catch (e) {
            console.error('❌ PRISMA LOAD FAILED:', e.message);
        }
    }
};

exports.register = async (req, res) => {
    console.log('📝 REGISTER FUNCTION STARTED');

    try {
        // Load dependencies on demand
        loadDependencies();

        if (!bcrypt || !prisma) {
            return res.status(500).json({
                error: 'Dependencies not loaded',
                bcrypt: !!bcrypt,
                prisma: !!prisma
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'JWT_SECRET not configured' });
        }

        if (!process.env.DATABASE_URL) {
            return res.status(500).json({ error: 'DATABASE_URL not configured' });
        }

        // Silent connection test
        try {
            await prisma.$connect();
            console.log('✅ Database connection successful');
        } catch (connectError) {
            console.error('❌ Database connection failed:', connectError.message);
            return res.status(500).json({ error: 'DATABASE_URL configuration error' });
        }

        const { username, password, email } = req.body;
        console.log('📝 REQUEST BODY:', { username, hasPassword: !!password, email });

        // Basic validation
        if (!username?.trim() || !password || password.length < 6) {
            return res.status(400).json({ error: 'Username and password (6+ chars) required' });
        }

        // Check if email already exists
        if (email && typeof email === 'string' && email.trim()) {
            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await prisma.user.findFirst({
                where: { email: normalizedEmail }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }
        }

        console.log('🔐 HASHING PASSWORD...');
        const hash = await bcrypt.hash(password, 10);

        // Explicit user data - no undefined values
        const userData = {
            username: username.trim(),
            password: hash,
            tokens: 100,
            role: 'USER',
            isDev: false,
            emailVerified: false,
            isVerified: false
        };

        // Optional email
        const tokenForVerification = generateVerificationToken();
        if (email && typeof email === 'string' && email.trim()) {
            userData.email = email.trim().toLowerCase();
            userData.verificationToken = tokenForVerification;
            userData.lastVerificationSent = new Date();
        }

        console.log('💾 CREATING USER WITH DATA:', userData);

        let user;
        try {
            user = await prisma.user.create({
                data: userData
            });
            console.log('✅ USER CREATED IN DB:', { id: user.id, username: user.username });
        } catch (dbError) {
            console.error('❌ DB CREATE FAILED:', dbError.message);
            throw dbError; // Re-throw to be caught by outer handler
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, isDev: user.isDev, isVerified: user.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('🎫 TOKEN GENERATED');

        // Send email
        let emailSent = false;
        let emailError = null;
        if (userData.email) {
            console.log('📧 ENVIANDO A: ' + userData.email);
            const result = await sendVerificationEmail(userData.email, userData.username, tokenForVerification);
            emailSent = result.success;
            if (!result.success) {
                emailError = result.error;
                console.error('[AUTH] Email send failed:', emailError);
            }
        }

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email || null,
                tokens: user.tokens,
                role: user.role,
                isDev: user.isDev,
                emailVerified: user.emailVerified,
                isVerified: user.isVerified
            },
            emailStatus: {
                sent: emailSent,
                error: emailError
            },
            redirect: '/menu'
        });

    } catch (err) {
        if (err.code === 'P2002') {
            console.log('🔍 P2002 detected: uniqueness violation');
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        console.error('❌ REGISTER ERROR:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack?.substring(0, 200)
        });
        console.dir(err);

        res.status(500).json({
            error: 'Registration failed',
            details: err.message,
            code: err.code
        });
    }
};

exports.login = async (req, res) => {
    console.log('🔑 LOGIN REQUEST:', { username: req.body.username, hasPassword: !!req.body.password });

    const { username, password } = req.body;

    if (!username?.trim() || !password) {
        return res.status(400).json({ error: 'Username y password requeridos' });
    }

    try {
        loadDependencies();
        const searchValue = username.trim();
        const normalizedSearch = searchValue.toLowerCase();
        console.log('[LOGIN_ATTEMPT] Buscando usuario con:', searchValue, '(normalized:', normalizedSearch + ')');

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: searchValue },
                    { email: normalizedSearch }
                ]
            }
        });

        console.log('👤 Usuario encontrado:', user ? { id: user.id, username: user.username, email: user.email } : '❌ NO ENCONTRADO para: ' + searchValue);

        if (!user) {
            console.log('🔍 DEBUG: Usuarios existentes en DB:', await prisma.user.count());
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        console.log('🔐 Verificando password...');
        const validPass = await bcrypt.compare(password, user.password);
        console.log('✅ Password válido:', validPass);

        if (!validPass) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        // Hard-check: Fetch fresh data from DB to ensure isVerified is current
        const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
        console.log('[LOGIN] Fresh DB data:', { id: freshUser.id, isVerified: freshUser.isVerified, emailVerified: freshUser.emailVerified });

        const token = jwt.sign(
            { id: freshUser.id, role: freshUser.role, isDev: freshUser.isDev, isVerified: freshUser.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('🎫 Login exitoso para:', user.username);

        res.json({
            token,
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified,
            isVerified: user.isVerified
        });

    } catch (err) {
        console.error('❌ ERROR EN LOGIN:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack?.substring(0, 500)
        });

        // DEVOLVER ERROR CRUDO PARA DEBUGGING
        res.status(500).json({
            error: 'LOGIN_CRASH',
            rawMessage: err.message,
            prismaCode: err.code,
            prismaMeta: err.meta,
            stack: err.stack?.substring(0, 300)
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        console.log('[GET_ME] req.user from middleware:', { id: req.user.id, isVerified: req.user.isVerified, emailVerified: req.user.emailVerified, role: req.user.role });

        // Bypass para tokens de desarrollador
        if (req.user.isDev === true) {
            return res.json({
                id: req.user.id,
                username: req.user.username || 'Developer',
                email: null,
                tokens: 999999,
                role: 'ADMIN',
                isDev: true,
                emailVerified: true,
                isVerified: true
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        console.log('[GET_ME] DB user data:', { id: user.id, isVerified: user.isVerified, emailVerified: user.emailVerified, role: user.role });

        res.json({
            id: user.id,
            username: user.username,
            email: user.email || null,
            tokens: user.tokens,
            role: user.role,
            isDev: user.isDev,
            emailVerified: user.emailVerified,
            isVerified: user.isVerified
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Nuevo endpoint: Reenviar email de verificación
exports.resendVerification = async (req, res) => {
    try {
        loadDependencies();
        if (!prisma) {
            return res.status(500).json({ error: 'Database not loaded' });
        }

        let user;

        // Check if user is authenticated
        if (req.user && req.user.id) {
            user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });
        } else {
            // If not authenticated, require email in body
            const { email } = req.body;
            if (!email || !email.trim()) {
                return res.status(400).json({
                    error: 'Email requerido para reenviar verificación',
                    code: 'EMAIL_REQUIRED'
                });
            }
            user = await prisma.user.findFirst({
                where: { email: email.trim() }
            });
        }

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
        console.log('📧 ENVIANDO A: ' + user.email);
        const emailResult = await sendVerificationEmail(user.email, user.username, newToken);

        if (!emailResult.success) {
            console.error('[EMAIL ERROR]', emailResult.error);
            return res.status(500).json({ error: 'Error al enviar email de verificación' });
        }

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
        // Verificar si el email ya está en uso por otro usuario (usando findFirst ya que email no es unique en schema)
        const existingUser = await prisma.user.findFirst({
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
        const finalEmail = email.trim();
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                verificationToken,
                lastVerificationSent: new Date()
            }
        });

        console.log('📧 ENVIANDO A: ' + finalEmail);
        sendVerificationEmail(finalEmail, updatedUser.username, verificationToken).catch(err => {
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
    console.log('[VERIFY_ENDPOINT] He recibido una petición con el token:', req.query.token);
    loadDependencies();
    if (!prisma) {
        console.error('[VERIFY] Prisma not loaded');
        return res.status(500).send(`
            <html><body>
            <h1>Error: Prisma no cargado</h1>
            <p>Por favor contacta al administrador.</p>
            </body></html>
        `);
    }
    const token = req.query.token?.trim();

    try {
        console.log('Token from URL:', token);
        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });

        console.log('Token in DB for user:', user ? user.verificationToken : 'No user found');
        console.log('Usuario encontrado:', user ? user.username : null);
        console.log('[DEBUG] ¿El usuario existe antes de verificar?:', !!user, 'Email:', user?.email, 'ID:', user?.id);

        if (!user) {
            console.log('Resultado de actualización: error - token inválido');
            return res.status(400).send(`
                <html><body>
                <h1>Token Inválido</h1>
                <p>El token de verificación no es válido o ha expirado.</p>
                <p>Token recibido: ${token}</p>
                </body></html>
            `);
        }

        if (user.emailVerified) {
            console.log('Resultado de actualización: error - ya verificado');
            return res.send(`
                <html><body>
                <h1>Ya Verificado</h1>
                <p>El usuario ${user.email} ya está verificado.</p>
                <p>Estado en DB: isVerified=${user.isVerified}, emailVerified=${user.emailVerified}</p>
                </body></html>
            `);
        }

        // Usar transacción para asegurar atomicidad
        console.log('[DB_UPDATE_ATTEMPT] Query: UPDATE user SET emailVerified=true, isVerified=true, role=\'SOCIO\', verificationToken=null WHERE id=' + user.id);
        let result;
        try {
            result = await prisma.$transaction(async (tx) => {
                // Log antes de la actualización
                console.log('[DB_UPDATE_ATTEMPT] User ID:', user.id, ', Old_Verified:', user.isVerified, ', Old_EmailVerified:', user.emailVerified);

                // Actualizar usuario por ID para evitar conflictos
                const updatedUser = await tx.user.update({
                    where: { id: user.id },
                    data: {
                        emailVerified: true,
                        isVerified: true,
                        role: 'SOCIO',
                        verificationToken: null
                    }
                });

                // Log después de la actualización
                console.log('[DB_UPDATE_SUCCESS] User ID:', updatedUser.id, ', New_Verified:', updatedUser.isVerified, ', New_EmailVerified:', updatedUser.emailVerified);

                return updatedUser;
            });
        } catch (dbError) {
            console.error('[PRISMA_UPDATE_ERROR]', dbError);
            return res.status(500).send(`
                <html><body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1>❌ Error de Base de Datos en Verificación</h1>
                <p>Error: ${dbError.message}</p>
                <p>Code: ${dbError.code}</p>
                <p>Meta: ${JSON.stringify(dbError.meta)}</p>
                <p>Token: ${token}</p>
                <p>User ID: ${user.id}</p>
                </body></html>
            `);
        }

        // Verificar que el cambio persistió
        const verifyDb = await prisma.user.findUnique({ where: { id: result.id } });
        console.log('[DB_VERIFY_AFTER_TX] User ID:', verifyDb.id, ', isVerified:', verifyDb.isVerified, ', emailVerified:', verifyDb.emailVerified);

        // Generar nuevo token JWT con datos actualizados
        const newToken = jwt.sign(
            { id: result.id, role: result.role, isDev: result.isDev, isVerified: result.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enviar email de bienvenida (no bloqueante)
        sendWelcomeEmail(user.email, user.username).catch(err => {
            console.error('[EMAIL] Error enviando bienvenida:', err.message);
        });

        // Página de éxito con estado
        res.send(`
            <html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>✅ Verificación Exitosa</h1>
            <p>Verificación procesada para el usuario: <strong>${user.email}</strong></p>
            <p>Estado en DB después de verificación:</p>
            <ul>
                <li>isVerified: <strong>${verifyDb.isVerified}</strong></li>
                <li>emailVerified: <strong>${verifyDb.emailVerified}</strong></li>
                <li>role: <strong>${verifyDb.role}</strong></li>
            </ul>
            <p>Nuevo token JWT generado: ${newToken.substring(0, 20)}...</p>
            <p><a href="${process.env.FRONTEND_URL}?verified=success&token=${newToken}">Continuar al sitio</a></p>
            </body></html>
        `);

    } catch (err) {
        console.error('[VERIFY ERROR]', err);
        res.status(500).send(`
            <html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>❌ Error en Verificación</h1>
            <p>Error: ${err.message}</p>
            <p>Stack: ${err.stack}</p>
            <p>Token: ${token}</p>
            </body></html>
        `);
    }
};
