const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const username = process.argv[2];
    const email = process.argv[3];

    if (!username && !email) {
        console.log('Uso: node clean-specific-user.js <username> [email]');
        process.exit(1);
    }

    console.log(`🧹 Buscando usuario: username=${username}, email=${email}`);

    const where = {};
    if (username) where.username = username;
    if (email) where.email = email;

    const user = await prisma.user.findFirst({
        where
    });

    if (!user) {
        console.log('✨ Usuario no encontrado.');
        return;
    }

    console.log(`📊 Usuario encontrado: ${user.username} (${user.email})`);

    // Borrar dependencias primero
    console.log('🗑️ Borrando dependencias...');

    await prisma.cropLog.deleteMany({ where: { crop: { userId: user.id } } });
    await prisma.crop.deleteMany({ where: { userId: user.id } });
    await prisma.orderItem.deleteMany({ where: { order: { buyerId: user.id } } });
    await prisma.order.deleteMany({ where: { buyerId: user.id } });
    await prisma.product.deleteMany({ where: { sellerId: user.id } });
    await prisma.wishlist.deleteMany({ where: { userId: user.id } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.post.deleteMany({ where: { authorId: user.id } });
    await prisma.comment.deleteMany({ where: { authorId: user.id } });
    await prisma.attachment.deleteMany({ where: { post: { authorId: user.id } } });
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.reaction.deleteMany({ where: { userId: user.id } });
    await prisma.review.deleteMany({ where: { sellerId: user.id } });
    await prisma.reservation.deleteMany({ where: { userId: user.id } });

    // Borrar usuario
    await prisma.user.delete({
        where: { id: user.id }
    });

    console.log('✅ Usuario borrado exitosamente.');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });