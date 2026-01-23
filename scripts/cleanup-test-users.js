const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log('🧹 Starting thorough database cleanup...');
    try {
        // Find users to delete
        const usersToDelete = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: 'segurra' } },
                    { username: 'ursmoked' }
                ]
            },
            select: { id: true }
        });

        const userIds = usersToDelete.map(u => u.id);

        if (userIds.length === 0) {
            console.log('ℹ️ No users found matching the criteria.');
            return;
        }

        console.log(`🔍 Found ${userIds.length} users. Cleaning related data...`);

        // Delete related data for these users
        await prisma.cropLog.deleteMany({ where: { crop: { userId: { in: userIds } } } });
        await prisma.crop.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.comment.deleteMany({ where: { authorId: { in: userIds } } });
        await prisma.post.deleteMany({ where: { authorId: { in: userIds } } });
        await prisma.orderItem.deleteMany({ where: { order: { buyerId: { in: userIds } } } });
        await prisma.order.deleteMany({ where: { buyerId: { in: userIds } } });
        await prisma.review.deleteMany({ where: { sellerId: { in: userIds } } });
        await prisma.wishlist.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.subscription.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.reaction.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.reservation.deleteMany({ where: { userId: { in: userIds } } });

        // Finally delete users
        const deletedUsers = await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });

        console.log(`✅ Deleted ${deletedUsers.count} users successfully.`);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
