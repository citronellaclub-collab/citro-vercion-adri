const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Default Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: adminPassword,
            email: 'admin@citronellaclub.com',
            role: 'ADMIN',
            isDev: true,
            tokens: 1000,
            emailVerified: true
        }
    });

    console.log('👤 Admin user ready:', admin.username);

    // 2. Market Items
    const items = [
        { name: 'Semillas de Lechuga', type: 'Semilla', price: 10, stock: 500 },
        { name: 'Nutrientes Grow', type: 'Nutriente', price: 25, stock: 100 },
        { name: 'Kit Medidor pH', type: 'Herramienta', price: 40, stock: 50 },
        { name: 'Balde 20L', type: 'Equipo', price: 15, stock: 200 },
        { name: 'Luz LED Full Spectrum', type: 'Iluminación', price: 150, stock: 30 },
    ];

    for (const item of items) {
        await prisma.product.create({
            data: {
                name: item.name,
                description: `Categoría: ${item.type}`,
                price: item.price,
                stock: item.stock,
                category: 'Genéticas',
                sellerId: admin.id
            }
        });
    }

    console.log('✅ Seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
