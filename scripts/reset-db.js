const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Starting database reset...');
    try {
        const deleted = await prisma.user.deleteMany({});
        console.log(`✅ Deleted ${deleted.count} users directly from the database.`);
    } catch (error) {
        console.error('❌ Error clearing users:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();