const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
    try {
        console.log('👤 Creando usuario de prueba...');

        // Datos del usuario de prueba
        const testUserData = {
            username: 'testuser2',
            password: await bcrypt.hash('testpass123', 10),
            email: 'test2@example.com',
            tokens: 100,
            role: 'USER',
            isDev: false,
            emailVerified: false,
            isVerified: false,
            verificationToken: 'test-token-123'
        };

        // Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: { username: testUserData.username }
        });

        if (existingUser) {
            console.log('⚠️ Usuario de prueba ya existe');
            console.log('   Username: testuser');
            console.log('   Password: testpass123');
            console.log('   Email: test@example.com');
            return;
        }

        // Crear usuario
        const user = await prisma.user.create({
            data: testUserData
        });

        console.log('✅ Usuario de prueba creado exitosamente!');
        console.log('   ID:', user.id);
        console.log('   Username: testuser');
        console.log('   Password: testpass123');
        console.log('   Email: test@example.com');
        console.log('   Tokens:', user.tokens);

    } catch (error) {
        console.error('❌ Error creando usuario de prueba:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
if (require.main === module) {
    createTestUser()
        .then(() => {
            console.log('✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script falló:', error);
            process.exit(1);
        });
}

module.exports = { createTestUser };