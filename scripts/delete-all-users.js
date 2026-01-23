const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Iniciando limpieza de usuarios...');

    // Contar antes de borrar
    const countBefore = await prisma.user.count();
    console.log(`📊 Usuarios encontrados: ${countBefore}`);

    if (countBefore > 0) {
        // Borrar usuarios (ojo: esto puede fallar si hay claves foráneas en cascada no configuradas, 
        // pero la instrucción es borrar todos)
        // En este schema, Crop tiene una relación obligatoria con User, así que hay que borrar dependencias primero.

        console.log('🗑️ Borrando dependencias (Crops, Logs, etc.)...');
        // El schema tiene onDelete: Cascade en Wishlist, Reaction, Subscription, Attachment pero no en todos.
        // Borramos en orden para evitar errores de FK.

        await prisma.cropLog.deleteMany();
        await prisma.crop.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.product.deleteMany();
        await prisma.wishlist.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.post.deleteMany(); // Esto borrará Comentarios cascade si está configurado, sino manual:
        await prisma.comment.deleteMany();
        await prisma.attachment.deleteMany();
        await prisma.subscription.deleteMany();
        await prisma.reaction.deleteMany();
        await prisma.review.deleteMany();
        await prisma.reservation.deleteMany();

        const deleteResult = await prisma.user.deleteMany();
        console.log(`✅ Se han borrado ${deleteResult.count} usuarios.`);
    } else {
        console.log('✨ No hay usuarios para borrar.');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error al borrar usuarios:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
