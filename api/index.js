console.log('API ENTRY POINT LOADED');

const app = require('../server/server.js');

console.log('EXPORTING APP FOR VERCEL');

module.exports = app;
