console.log('🚀 API ENTRY POINT LOADED AT:', new Date().toISOString());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 DATABASE_URL presente:', !!process.env.DATABASE_URL);
console.log('🔐 JWT_SECRET presente:', !!process.env.JWT_SECRET);

const app = require('../server/server.js');

console.log('📤 EXPORTING APP FOR VERCEL');

module.exports = app;
