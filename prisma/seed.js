const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Market Items
    const items = [
        { name: 'Semillas de Lechuga', type: 'Semilla', price: 10, image: '🌱', stock: 500 },
        { name: 'Nutrientes Grow', type: 'Nutriente', price: 25, image: '🧪', stock: 100 },
        { name: 'Kit Medidor pH', type: 'Herramienta', price: 40, image: '💧', stock: 50 },
        { name: 'Balde 20L', type: 'Equipo', price: 15, image: '🪣', stock: 200 },
        { name: 'Luz LED Full Spectrum', type: 'Iluminación', price: 150, image: '💡', stock: 30 },
    ];

    for (const item of items) {
        await prisma.marketItem.create({ data: item });
    }

    // 2. Initial User (Admin)
    // Note: Password/Auth logic is handled by app, this is just for posts 
    // We can skip creating user if we assume one exists, but for safety let's assume user ID 1 exists or created via app

    // 3. Forum Posts (Mock if User 1 exists)
    // Skipped to avoid foreign key errors if user table is empty. User will create posts via UI.

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
