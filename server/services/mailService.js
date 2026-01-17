const axios = require('axios');
const crypto = require('crypto');

// Configuración de Brevo API
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@citronellaclub.com';
const SENDER_NAME = 'Citronella Club';

/**
 * Envía un email usando la API de Brevo
 */
async function sendEmail({ to, subject, htmlContent }) {
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
                }
            }
        );

        console.log(`[EMAIL] Enviado a ${to}: ${subject}`);
        return { success: true, messageId: response.data.messageId };
    } catch (error) {
        console.error('[EMAIL ERROR]', error.response?.data || error.message);
        throw new Error('Error al enviar email');
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
 */
async function sendVerificationEmail(email, username, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

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

    return await sendEmail({
        to: email,
        subject: 'Verifica tu cuenta - Citronella Club',
        htmlContent
    });
}

/**
 * Envía email de bienvenida tras verificación exitosa
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

    return await sendEmail({
        to: email,
        subject: '¡Bienvenido a Citronella Club! 🌿',
        htmlContent
    });
}

module.exports = {
    sendEmail,
    generateVerificationToken,
    sendVerificationEmail,
    sendWelcomeEmail
};
