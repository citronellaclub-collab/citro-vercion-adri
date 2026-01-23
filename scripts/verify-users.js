const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- Current Users ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, isVerified: ${u.isVerified}, emailVerified: ${u.emailVerified}`);
    });

    if (users.length > 0) {
        console.log('\n--- Updating all users to verified ---');
        const updateResult = await prisma.user.updateMany({
            data: {
                isVerified: true,
                emailVerified: true
            }
        });
        console.log(`Updated ${updateResult.count} users.`);
    } else {
        console.log('\nNo users found to update.');
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
