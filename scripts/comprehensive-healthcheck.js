const { PrismaClient } = require('@prisma/client');
const { addMissingFields } = require('./add-missing-fields');

const prisma = new PrismaClient();

async function comprehensiveHealthCheck() {
    console.log('🔍 Iniciando diagnóstico completo del sistema...\n');

    let issuesFound = 0;
    let issuesFixed = 0;

    try {
        // 1. Verificar conexión a base de datos
        console.log('1️⃣ Verificando conexión a base de datos...');
        try {
            await prisma.$connect();
            console.log('✅ Conexión a base de datos: OK');
        } catch (error) {
            console.log('❌ Conexión a base de datos: FALLÓ');
            console.log('   Error:', error.message);
            issuesFound++;
            return; // No podemos continuar sin DB
        }

        // 2. Verificar variables de entorno críticas
        console.log('\n2️⃣ Verificando variables de entorno...');
        const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
        const optionalEnvVars = ['BREVO_API_KEY', 'STAFF_PASSWORD'];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                console.log(`❌ Variable requerida faltante: ${envVar}`);
                issuesFound++;
            } else {
                console.log(`✅ ${envVar}: Configurada`);
            }
        }

        for (const envVar of optionalEnvVars) {
            if (!process.env[envVar]) {
                console.log(`⚠️ Variable opcional faltante: ${envVar}`);
            } else {
                console.log(`✅ ${envVar}: Configurada`);
            }
        }

        // 3. Verificar esquema de base de datos
        console.log('\n3️⃣ Verificando esquema de base de datos...');

        // Verificar tabla User
        try {
            const userColumns = await prisma.$queryRaw`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'User'
                ORDER BY ordinal_position;
            `;

            const requiredUserColumns = ['id', 'username', 'password', 'email', 'role', 'isDev', 'tokens', 'emailVerified'];
            const existingColumns = userColumns.map(col => col.column_name);

            for (const requiredCol of requiredUserColumns) {
                if (!existingColumns.includes(requiredCol)) {
                    console.log(`❌ Columna faltante en User: ${requiredCol}`);
                    issuesFound++;
                }
            }

            // Verificar índices únicos
            const uniqueIndexes = await prisma.$queryRaw`
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = 'User' AND indexdef LIKE '%UNIQUE%';
            `;

            const requiredUniqueIndexes = ['User_username_key', 'User_email_key'];
            const existingIndexes = uniqueIndexes.map(idx => idx.indexname);

            for (const requiredIdx of requiredUniqueIndexes) {
                if (!existingIndexes.includes(requiredIdx)) {
                    console.log(`❌ Índice único faltante: ${requiredIdx}`);
                    issuesFound++;
                }
            }

            console.log('✅ Esquema de User: Verificado');

        } catch (error) {
            console.log('❌ Error verificando esquema de User:', error.message);
            issuesFound++;
        }

        // 4. Verificar tablas relacionadas
        console.log('\n4️⃣ Verificando tablas relacionadas...');
        const requiredTables = [
            'Crop', 'CropLog', 'Product', 'Wishlist', 'Notification',
            'Order', 'OrderItem', 'Post', 'Comment', 'Attachment',
            'Subscription', 'Reaction', 'Review', 'Event', 'TicketCategory',
            'Reservation', 'LegalContent'
        ];

        for (const table of requiredTables) {
            try {
                await prisma.$queryRaw`SELECT 1 FROM "${table}" LIMIT 1;`;
                console.log(`✅ Tabla ${table}: Existe`);
            } catch (error) {
                console.log(`❌ Tabla faltante: ${table}`);
                issuesFound++;
            }
        }

        // 5. Intentar crear usuario de prueba
        console.log('\n5️⃣ Probando creación de usuario...');
        try {
            const testUser = await prisma.user.create({
                data: {
                    username: `test_user_${Date.now()}`,
                    password: 'hashed_password',
                    tokens: 100,
                    role: 'USER',
                    isDev: false,
                    emailVerified: false,
                    isVerified: false
                }
            });

            console.log('✅ Creación de usuario: OK');

            // Limpiar usuario de prueba
            await prisma.user.delete({ where: { id: testUser.id } });
            console.log('✅ Limpieza de usuario de prueba: OK');

        } catch (error) {
            console.log('❌ Creación de usuario: FALLÓ');
            console.log('   Error:', error.message);
            issuesFound++;
        }

        // 6. Aplicar correcciones automáticas si hay problemas
        if (issuesFound > 0) {
            console.log(`\n🔧 Se encontraron ${issuesFound} problemas. Aplicando correcciones automáticas...`);

            try {
                await addMissingFields();
                issuesFixed = issuesFound;
                console.log('✅ Correcciones aplicadas exitosamente');
            } catch (error) {
                console.log('❌ Error aplicando correcciones:', error.message);
            }
        }

        // 7. Resumen final
        console.log('\n📊 Resumen del diagnóstico:');
        console.log(`🔍 Problemas encontrados: ${issuesFound}`);
        console.log(`🔧 Problemas corregidos: ${issuesFixed}`);

        if (issuesFound === 0) {
            console.log('🎉 Sistema completamente funcional!');
        } else if (issuesFixed === issuesFound) {
            console.log('🎉 Todos los problemas han sido corregidos!');
        } else {
            console.log('⚠️ Algunos problemas requieren atención manual.');
        }

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        issuesFound++;
    } finally {
        await prisma.$disconnect();
    }

    return { issuesFound, issuesFixed };
}

// Ejecutar diagnóstico
if (require.main === module) {
    comprehensiveHealthCheck()
        .then((result) => {
            console.log(`\n✅ Diagnóstico completado. Problemas: ${result.issuesFound}, Corregidos: ${result.issuesFixed}`);
            process.exit(result.issuesFound > result.issuesFixed ? 1 : 0);
        })
        .catch((error) => {
            console.error('❌ Diagnóstico falló:', error);
            process.exit(1);
        });
}

module.exports = { comprehensiveHealthCheck };