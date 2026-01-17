const { PrismaClient } = require('@prisma/client');

console.log('🔍 DB_URL detectada:', process.env.DATABASE_URL ? 'SÍ' : 'NO');
console.log('🔍 JWT_SECRET detectada:', process.env.JWT_SECRET ? 'SÍ' : 'NO');

const prismaClientSingleton = () => {
    console.log('🏗️ Creando nueva instancia de PrismaClient');
    return new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

console.log('📦 Prisma client inicializado');

module.exports = prisma;

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}
