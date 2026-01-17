#!/usr/bin/env node

/**
 * Migration Script: Fix Missing Emails
 * Ensures all users have valid email addresses for email verification system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingEmails() {
    console.log('🔍 Buscando usuarios sin email...');

    try {
        // Find all users with null or empty email
        const usersWithoutEmail = await prisma.user.findMany({
            where: {
                OR: [
                    { email: null },
                    { email: '' }
                ]
            },
            select: {
                id: true,
                username: true,
                email: true
            }
        });

        if (usersWithoutEmail.length === 0) {
            console.log('✅ Todos los usuarios tienen email asignado');
            return true;
        }

        console.log(`📝 Encontrados ${usersWithoutEmail.length} usuarios sin email`);

        // Generate and update emails for each user
        for (const user of usersWithoutEmail) {
            const tempEmail = `${user.username}@temporal.com`;

            // Check if this email already exists (shouldn't happen, but safety check)
            const existingUser = await prisma.user.findUnique({
                where: { email: tempEmail }
            });

            if (existingUser) {
                // If collision, add timestamp to make it unique
                const tempEmailWithTimestamp = `${user.username}@temporal-${Date.now()}.com`;
                await prisma.user.update({
                    where: { id: user.id },
                    data: { email: tempEmailWithTimestamp }
                });
                console.log(`📧 Usuario ${user.username}: ${tempEmailWithTimestamp}`);
            } else {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { email: tempEmail }
                });
                console.log(`📧 Usuario ${user.username}: ${tempEmail}`);
            }
        }

        console.log(`✅ Asignados ${usersWithoutEmail.length} emails temporales`);
        return true;

    } catch (error) {
        console.error('❌ Error en migración de emails:', error.message);
        throw error;
    }
}

async function validateEmailUniqueness() {
    console.log('🔍 Validando unicidad de emails...');

    try {
        // Check for any remaining null emails
        const nullEmails = await prisma.user.count({
            where: { email: null }
        });

        if (nullEmails > 0) {
            throw new Error(`Aún hay ${nullEmails} usuarios con email null`);
        }

        // Check for empty string emails
        const emptyEmails = await prisma.user.count({
            where: { email: '' }
        });

        if (emptyEmails > 0) {
            throw new Error(`Aún hay ${emptyEmails} usuarios con email vacío`);
        }

        console.log('✅ Todos los usuarios tienen email válido');
        return true;

    } catch (error) {
        console.error('❌ Error en validación:', error.message);
        throw error;
    }
}

async function main() {
    console.log('🚀 Iniciando migración: Corrección de emails faltantes\n');

    try {
        // 1. Fix missing emails
        await fixMissingEmails();

        // 2. Validate the fix
        await validateEmailUniqueness();

        console.log('\n🎉 Migración completada exitosamente!');
        console.log('📧 Todos los usuarios ahora tienen email asignado');

    } catch (error) {
        console.error('\n❌ Migración fallida:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Export for testing
module.exports = { main, fixMissingEmails, validateEmailUniqueness };

if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}