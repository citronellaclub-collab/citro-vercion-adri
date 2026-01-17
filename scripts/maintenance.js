#!/usr/bin/env node

/**
 * Database Maintenance Script for Production Deployments
 * Ensures database schema is synchronized before build
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const { fixMissingEmails, validateEmailUniqueness } = require('./fix-missing-emails');

const prisma = new PrismaClient();

async function fixVerifiedUsersWithoutEmail() {
    console.log('🔍 Buscando usuarios verificados sin email físico...');

    try {
        // Find users with emailVerified: true but no email
        const verifiedUsersWithoutEmail = await prisma.user.findMany({
            where: {
                emailVerified: true,
                OR: [
                    { email: null },
                    { email: '' }
                ]
            },
            select: {
                id: true,
                username: true,
                email: true,
                emailVerified: true
            }
        });

        if (verifiedUsersWithoutEmail.length === 0) {
            console.log('✅ No se encontraron usuarios verificados sin email');
            return true;
        }

        console.log(`⚠️  Encontrados ${verifiedUsersWithoutEmail.length} usuarios con emailVerified: true pero sin email`);

        // Reset their verification status (this is a data integrity issue)
        for (const user of verifiedUsersWithoutEmail) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: false,
                    verificationToken: null,
                    lastVerificationSent: null
                }
            });
            console.log(`🔄 Usuario ${user.username}: emailVerified reseteado a false`);
        }

        console.log(`✅ Corregidos ${verifiedUsersWithoutEmail.length} usuarios con problemas de integridad`);
        return true;

    } catch (error) {
        console.error('❌ Error en verificación de integridad:', error.message);
        throw error;
    }
}

async function checkDatabaseConnection() {
    console.log('🔍 Verificando conexión a la base de datos...');

    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`; // Simple query to test connection
        console.log('✅ Conexión a la base de datos exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a la base de datos:', error.message);
        console.error('💡 Verifica que DATABASE_URL esté configurada correctamente en Vercel');
        console.error('💡 Asegúrate de que la base de datos esté accesible desde internet');
        process.exit(1);
    }
}

async function checkPendingMigrations() {
    console.log('🔍 Verificando migraciones pendientes...');

    try {
        // Check if there are pending migrations by trying to access a field that might not exist
        const testQuery = await prisma.user.findFirst({
            select: {
                id: true,
                email: true,
                emailVerified: true,
                verificationToken: true,
                lastVerificationSent: true
            },
            take: 1
        });

        console.log('✅ Esquema de base de datos actualizado');
        return true;
    } catch (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.warn('⚠️  Columnas faltantes detectadas, aplicando migraciones...');
            return false;
        }
        // If it's a different error, re-throw
        throw error;
    }
}

function applyMigrations() {
    console.log('🚀 Aplicando migraciones pendientes...');

    try {
        // Run migrate deploy for production
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log('✅ Migraciones aplicadas exitosamente');
    } catch (error) {
        console.error('❌ Error aplicando migraciones:', error.message);
        console.error('💡 Posibles soluciones:');
        console.error('   - Verifica que las migraciones estén commited en el repositorio');
        console.error('   - Revisa que DATABASE_URL tenga permisos de escritura');
        console.error('   - Si es la primera vez, considera usar prisma db push en desarrollo');
        process.exit(1);
    }
}

function generatePrismaClient() {
    console.log('🔧 Generando cliente de Prisma...');

    try {
        execSync('npx prisma generate', {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log('✅ Cliente de Prisma generado');
    } catch (error) {
        console.error('❌ Error generando cliente de Prisma:', error.message);
        process.exit(1);
    }
}

async function main() {
    console.log('🔧 Iniciando mantenimiento de base de datos para despliegue...\n');

    try {
        // 1. Verificar conexión
        await checkDatabaseConnection();

        // 2. Verificar si hay migraciones pendientes
        const schemaUpdated = await checkPendingMigrations();

        if (!schemaUpdated) {
            // 3. Aplicar migraciones si es necesario
            applyMigrations();
        }

        // 4. Verificar integridad de emails verificados
        console.log('🔍 Verificando integridad de emails verificados...');
        await fixVerifiedUsersWithoutEmail();

        // 5. Migrar emails faltantes (siempre se ejecuta)
        console.log('📧 Verificando emails de usuarios...');
        await fixMissingEmails();
        await validateEmailUniqueness();

        // 5. Generar cliente de Prisma
        generatePrismaClient();

        console.log('\n🎉 Mantenimiento completado exitosamente!');
        console.log('📦 Base de datos lista para producción');

    } catch (error) {
        console.error('\n❌ Error fatal en mantenimiento:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
    console.error('❌ Error no manejado:', error);
    process.exit(1);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Recibida señal de interrupción, cerrando conexión...');
    await prisma.$disconnect();
    process.exit(0);
});

if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = { main, checkDatabaseConnection, checkPendingMigrations, fixVerifiedUsersWithoutEmail };