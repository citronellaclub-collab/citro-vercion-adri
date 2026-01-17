#!/usr/bin/env node

/**
 * Database Health Check and Synchronization Script
 * Ensures database schema is up-to-date before deployment
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
    console.log('🔍 Verificando conexión a la base de datos...');

    try {
        await prisma.$connect();
        console.log('✅ Conexión a la base de datos exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a la base de datos:', error.message);
        console.error('💡 Verifica que DATABASE_URL esté configurada correctamente');
        process.exit(1);
    }
}

async function checkSchemaDrift() {
    console.log('🔍 Verificando sincronización del esquema...');

    try {
        // Intentar una consulta simple para verificar si las columnas existen
        const testUser = await prisma.user.findFirst({
            select: {
                id: true,
                emailVerified: true,
                verificationToken: true,
                lastVerificationSent: true
            }
        });

        console.log('✅ Esquema de base de datos sincronizado');
        return true;
    } catch (error) {
        if (error.message.includes('emailVerified') ||
            error.message.includes('verificationToken') ||
            error.message.includes('lastVerificationSent')) {
            console.warn('⚠️  Detección de drift: Columnas de verificación de email faltantes');
            return false;
        }
        throw error;
    }
}

function runMigrations() {
    console.log('🚀 Aplicando migraciones pendientes...');

    try {
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log('✅ Migraciones aplicadas exitosamente');
    } catch (error) {
        console.error('❌ Error aplicando migraciones:', error.message);
        process.exit(1);
    }
}

function forceSchemaSync(acceptDataLoss = false) {
    console.log('🔧 Forzando sincronización del esquema...');

    const command = acceptDataLoss
        ? 'npx prisma db push --accept-data-loss'
        : 'npx prisma db push';

    try {
        execSync(command, {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'development' }
        });
        console.log('✅ Esquema sincronizado forzosamente');
    } catch (error) {
        console.error('❌ Error en sincronización forzada:', error.message);
        console.error('💡 Si hay datos importantes, considera hacer backup antes de --accept-data-loss');
        process.exit(1);
    }
}

function generatePrismaClient() {
    console.log('🔧 Generando cliente de Prisma...');

    try {
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Cliente de Prisma generado');
    } catch (error) {
        console.error('❌ Error generando cliente de Prisma:', error.message);
        process.exit(1);
    }
}

async function main() {
    const isProduction = process.env.NODE_ENV === 'production';
    const acceptDataLoss = process.env.ACCEPT_DATA_LOSS === 'true';

    console.log('🏥 Iniciando health check de base de datos...\n');

    // 1. Verificar conexión
    await checkDatabaseConnection();

    // 2. Verificar drift del esquema
    const schemaInSync = await checkSchemaDrift();

    if (!schemaInSync) {
        if (isProduction) {
            // En producción, usar migraciones
            runMigrations();
        } else {
            // En desarrollo/staging, forzar sincronización
            console.log('🔧 Entorno de desarrollo detectado, intentando sincronización forzada...');
            forceSchemaSync(acceptDataLoss);
        }
    }

    // 3. Generar cliente de Prisma
    generatePrismaClient();

    console.log('\n🎉 Health check completado exitosamente!');
    console.log('📦 Base de datos lista para el despliegue');

    await prisma.$disconnect();
}

// Manejo de errores global
process.on('unhandledRejection', (error) => {
    console.error('❌ Error no manejado:', error);
    process.exit(1);
});

if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error fatal en health check:', error);
        process.exit(1);
    });
}

module.exports = { main, checkDatabaseConnection, checkSchemaDrift };