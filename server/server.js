require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Verificación de variables de entorno críticas
console.log('🔍 Verificando variables de entorno críticas:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Faltante');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada' : '❌ Faltante');
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Configurada' : '❌ Faltante');
console.log('STAFF_PASSWORD:', process.env.STAFF_PASSWORD ? '✅ Configurada' : '❌ Faltante');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
    console.log('💚 HEALTH CHECK CALLED AT:', new Date().toISOString());
    res.json({
        status: 'ok',
        timestamp: new Date(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL: !!process.env.DATABASE_URL,
            JWT_SECRET: !!process.env.JWT_SECRET
        }
    });
});

app.get('/api/test', (req, res) => {
    console.log('🧪 TEST ENDPOINT CALLED - NO DB REQUIRED');
    res.json({
        message: 'API is working!',
        timestamp: new Date(),
        version: '1.0.1',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            hasDbUrl: !!process.env.DATABASE_URL,
            hasJwtSecret: !!process.env.JWT_SECRET
        }
    });
});

app.get('/api/ping', (req, res) => {
    console.log('🏓 PING ENDPOINT HIT');
    res.json({ pong: true, time: Date.now() });
});

console.log('🛣️ MOUNTING ROUTES...');
app.use('/api/auth', authRoutes);
console.log('✅ AUTH ROUTES MOUNTED at /api/auth');
app.use('/api', apiRoutes); // Mounts /crops, /market, etc.
console.log('✅ API ROUTES MOUNTED at /api');

// Static Frontend (Solo en Producción)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ error: 'Algo salió mal en el servidor', details: err.message });
});

// Exportar app para Vercel
module.exports = app;

// Solo escuchar si se ejecuta directamente
if (require.main === module) {
    console.log('--- INICIANDO SERVIDOR VERSION 1.0.1 ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
