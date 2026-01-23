const axios = require('axios');
const crypto = require('crypto');

// Configuración de Brevo API
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'citronellaclub@gmail.com';
const SENDER_NAME = 'Citronella Club';

/**
 * Envía un email usando la API de Brevo
 * Manejo robusto de errores para evitar 500s en el servidor
 */
async function sendEmail({ to, subject, htmlContent }) {
    // Validación de parámetros
    if (!to || !subject || !htmlContent) {
        console.error('[EMAIL ERROR] Parámetros faltantes:', { to: !!to, subject: !!subject, htmlContent: !!htmlContent });
        return { success: false, error: 'Parámetros de email incompletos' };
    }

    // Validación de configuración
    if (!BREVO_API_KEY) {
        console.error('[EMAIL ERROR] BREVO_API_KEY no configurada');
        return { success: false, error: 'Configuración de email incompleta' };
    }

    try {
        const response = await axios.post(
            BREVO_API_URL,
            {
                sender: {
                    name: SENDER_NAME,
                    email: SENDER_EMAIL
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            },
            {
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log(`[EMAIL] ✅ Enviado exitosamente a ${to}: ${subject}`);
        console.log('[BREVO RESPONSE DATA]:', JSON.stringify(response.data, null, 2));
        return { success: true, messageId: response.data.messageId };

    } catch (error) {
        // Manejo detallado de errores de Brevo
        let errorMessage = 'Error desconocido al enviar email';

        if (error.response) {
            // Error de respuesta de Brevo API
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 400:
                    errorMessage = 'Datos de email inválidos';
                    break;
                case 401:
                    errorMessage = 'Credenciales de Brevo inválidas';
                    break;
                case 429:
                    errorMessage = 'Límite de envío de emails excedido';
                    break;
                case 500:
                    errorMessage = 'Error interno del servicio de email';
                    break;
                default:
                    errorMessage = `Error de Brevo API (${status})`;
            }

            console.error(`[EMAIL ERROR] Brevo API ${status}:`, data);

        } else if (error.code === 'ECONNABORTED') {
            // Timeout
            errorMessage = 'Timeout al enviar email';
            console.error('[EMAIL ERROR] Timeout al conectar con Brevo');

        } else if (error.code === 'ENOTFOUND') {
            // DNS/Network error
            errorMessage = 'Error de conexión de red';
            console.error('[EMAIL ERROR] Error de red:', error.message);

        } else {
            // Otro tipo de error
            errorMessage = 'Error interno al procesar email';
            console.error('[EMAIL ERROR] Error desconocido:', error.message);
        }

        // NO lanzamos error - retornamos objeto de error para manejo graceful
        return { success: false, error: errorMessage };
    }
}

/**
 * Genera un token de verificación único
 */
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Envía email de verificación de cuenta
 * Retorna resultado del envío sin lanzar errores
 */
async function sendVerificationEmail(email, username, token) {
    // ✅ Validación de URL (API_URL si existe, sino FRONTEND_URL)
    let apiUrl = process.env.API_URL || process.env.FRONTEND_URL;
    if (!apiUrl) {
        console.error('[EMAIL ERROR] API_URL o FRONTEND_URL no configuradas');
        return { success: false, error: 'Configuración de URL incompleta' };
    }

    // En producción, asegurar que no use localhost
    if (process.env.NODE_ENV === 'production' && apiUrl.includes('localhost')) {
        console.error('[EMAIL ERROR] API_URL no puede ser localhost en producción');
        return { success: false, error: 'Configuración de URL inválida para producción' };
    }

    const normalizedApiUrl = apiUrl.replace(/\/$/, '');
    const verificationUrl = `${normalizedApiUrl}/api/auth/verify?token=${token}`;
    console.log('[MAIL_DEBUG] Link generado:', verificationUrl);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 40px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #58a6ff; margin: 0; font-size: 28px; }
                .content { line-height: 1.6; }
                .button { display: inline-block; background: #2ea043; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #8b949e; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌿 Citronella Club</h1>
                </div>
                <div class="content">
                    <h2>¡Bienvenido, ${username}!</h2>
                    <p>Gracias por unirte a Citronella Club. Para completar tu registro y acceder a todas las funcionalidades, necesitamos verificar tu dirección de email.</p>
                    <p>Haz click en el siguiente botón para verificar tu cuenta:</p>
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verificar mi Email</a>
                    </div>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #58a6ff;">${verificationUrl}</p>
                    <p><strong>Este enlace expirará en 24 horas.</strong></p>
                    <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
                </div>
                <div class="footer">
                    <p>© 2026 Citronella Club - Sistema de Gestión de Cultivos</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const result = await sendEmail({
        to: email,
        subject: 'Verifica tu cuenta - Citronella Club',
        htmlContent
    });

    // ✅ Logging detallado del resultado
    if (result.success) {
        console.log(`[EMAIL] ✅ Verificación enviada a ${email} para usuario ${username}`);
    } else {
        console.error(`[EMAIL] ❌ Error enviando verificación a ${email}: ${result.error}`);
    }

    return result;
}

/**
 * Envía email de bienvenida tras verificación exitosa
 * Retorna resultado del envío sin lanzar errores
 */
async function sendWelcomeEmail(email, username) {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 40px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #58a6ff; margin: 0; font-size: 28px; }
                .content { line-height: 1.6; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #8b949e; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 ¡Cuenta Verificada!</h1>
                </div>
                <div class="content">
                    <h2>¡Hola, ${username}!</h2>
                    <p>Tu cuenta ha sido verificada exitosamente. Ahora tienes acceso completo a todas las funcionalidades de Citronella Club:</p>
                    <ul>
                        <li>🌱 Gestión de cultivos hidropónicos</li>
                        <li>🛒 Marketplace de intercambio</li>
                        <li>💬 Foro de la comunidad</li>
                        <li>🎫 Eventos exclusivos</li>
                    </ul>
                    <p>¡Comienza tu experiencia ahora!</p>
                </div>
                <div class="footer">
                    <p>© 2026 Citronella Club</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const result = await sendEmail({
        to: email,
        subject: '¡Bienvenido a Citronella Club! 🌿',
        htmlContent
    });

    // ✅ Logging detallado del resultado
    if (result.success) {
        console.log(`[EMAIL] ✅ Bienvenida enviada a ${email} para usuario ${username}`);
    } else {
        console.error(`[EMAIL] ❌ Error enviando bienvenida a ${email}: ${result.error}`);
    }

    return result;
}

module.exports = {
    sendEmail,
    generateVerificationToken,
    sendVerificationEmail,
    sendWelcomeEmail
};
