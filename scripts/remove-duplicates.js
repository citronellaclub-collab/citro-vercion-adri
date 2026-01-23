const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Iniciando limpieza de usuarios duplicados...');

    const users = await prisma.user.findMany({
        orderBy: { id: 'desc' } // Ordenar por más reciente primero
    });

    const seenEmails = new Set();
    const usersToDelete = [];

    for (const user of users) {
        if (user.email) {
            if (seenEmails.has(user.email)) {
                usersToDelete.push(user.id);
            } else {
                seenEmails.add(user.email);
            }
        }
    }

    if (usersToDelete.length > 0) {
        console.log(`🗑️ Eliminando ${usersToDelete.length} usuarios duplicados...`);
        // Primero dependencias (logs, crops, etc) para evitar errores FK
        // Asumiendo que los usuarios duplicados son "nuevos" y tienen pocos datos o datos descartables.
        // Si tuvieran datos importantes, habría que migrarlos, pero el usuario pidió borrar los viejos.

        // Dado que el borrado puede ser complejo con FKs, intentamos borrar usuario directamente y dejar que fallen si tienen datos
        // O mejor: borrar dependencias primero para esos IDs.

        for (const userId of usersToDelete) {
            try {
                // Borrar dependencias conocidas (lista no exhaustiva pero cubre lo principal)
                await prisma.cropLog.deleteMany({ where: { crop: { userId } } });
                await prisma.crop.deleteMany({ where: { userId } });
                await prisma.notification.deleteMany({ where: { userId } });
                await prisma.wishlist.deleteMany({ where: { userId } });

                await prisma.user.delete({ where: { id: userId } });
                console.log(`✅ Usuario eliminado: ID ${userId}`);
            } catch (e) {
                console.error(`❌ Error eliminando usuario ${userId}: ${e.message}`);
            }
        }
    } else {
        console.log('✨ No se encontraron usuarios duplicados por email.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
