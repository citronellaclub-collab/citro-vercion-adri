const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        console.log('🚀 Iniciando reset completo de la base de datos...');

        // Paso 1: Eliminar tablas dependientes en orden inverso de dependencias
        console.log('📝 Eliminando reservas...');
        await prisma.reservation.deleteMany();

        console.log('🎫 Eliminando categorías de tickets...');
        await prisma.ticketCategory.deleteMany();

        console.log('📅 Eliminando eventos...');
        await prisma.event.deleteMany();

        console.log('😀 Eliminando reacciones...');
        await prisma.reaction.deleteMany();

        console.log('🔔 Eliminando suscripciones...');
        await prisma.subscription.deleteMany();

        console.log('💬 Eliminando comentarios...');
        await prisma.comment.deleteMany();

        console.log('📎 Eliminando adjuntos...');
        await prisma.attachment.deleteMany();

        console.log('📝 Eliminando posts...');
        await prisma.post.deleteMany();

        console.log('⭐ Eliminando reseñas...');
        await prisma.review.deleteMany();

        console.log('🛒 Eliminando items de pedidos...');
        await prisma.orderItem.deleteMany();

        console.log('📦 Eliminando pedidos...');
        await prisma.order.deleteMany();

        console.log('📬 Eliminando notificaciones...');
        await prisma.notification.deleteMany();

        console.log('❤️ Eliminando lista de deseos...');
        await prisma.wishlist.deleteMany();

        console.log('🛍️ Eliminando productos...');
        await prisma.product.deleteMany();

        console.log('🌱 Eliminando logs de cultivos...');
        await prisma.cropLog.deleteMany();

        console.log('🌿 Eliminando cultivos...');
        await prisma.crop.deleteMany();

        // Paso 2: Eliminar usuarios
        console.log('👥 Eliminando usuarios...');
        await prisma.user.deleteMany();

        // Paso 3: Resetear secuencias de auto-incremento (PostgreSQL)
        console.log('🔄 Reseteando secuencias de auto-incremento...');

        const tables = [
            'User', 'Crop', 'CropLog', 'Product', 'Wishlist', 'Notification',
            'Order', 'OrderItem', 'Post', 'Comment', 'Attachment',
            'Subscription', 'Reaction', 'Review', 'Event', 'TicketCategory',
            'Reservation', 'LegalContent'
        ];

        for (const table of tables) {
            try {
                // Reset sequence for PostgreSQL
                await prisma.$executeRaw`SELECT setval('${table.toLowerCase()}_id_seq', 1, false)`;
                console.log(`✅ Secuencia reseteada para ${table}`);
            } catch (error) {
                console.log(`⚠️ No se pudo resetear secuencia para ${table}: ${error.message}`);
            }
        }

        console.log('🎉 Reset completo exitoso!');
        console.log('📊 La base de datos está ahora limpia y lista para un nuevo inicio.');

    } catch (error) {
        console.error('❌ Error durante el reset:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log('✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script falló:', error);
            process.exit(1);
        });
}

module.exports = { resetDatabase };