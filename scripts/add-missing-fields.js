const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMissingFields() {
    try {
        console.log('🔧 Agregando campos faltantes a la base de datos...');

        // Agregar campos faltantes a la tabla User
        console.log('📝 Agregando campos de email y verificación...');
        await prisma.$executeRaw`
            ALTER TABLE "User"
            ADD COLUMN IF NOT EXISTS "email" TEXT,
            ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER',
            ADD COLUMN IF NOT EXISTS "isDev" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "verificationToken" TEXT,
            ADD COLUMN IF NOT EXISTS "lastVerificationSent" TIMESTAMP(3);
        `;

        // Crear índices únicos
        console.log('🔗 Creando índices únicos...');
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
        `;
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "User_verificationToken_key" ON "User"("verificationToken");
        `;

        // Agregar campos faltantes a otras tablas según el schema actual
        console.log('📋 Agregando campos faltantes a otras tablas...');

        // Para Post - agregar campos faltantes
        await prisma.$executeRaw`
            ALTER TABLE "Post"
            ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Debates',
            ADD COLUMN IF NOT EXISTS "youtubeLink" TEXT,
            ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
            ADD COLUMN IF NOT EXISTS "attachments" JSONB,
            ADD COLUMN IF NOT EXISTS "subscriptions" JSONB,
            ADD COLUMN IF NOT EXISTS "reactions" JSONB,
            ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "isImmutable" BOOLEAN NOT NULL DEFAULT false;
        `;

        // Para Comment - agregar createdAt
        await prisma.$executeRaw`
            ALTER TABLE "Comment"
            ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        `;

        // Crear tablas faltantes si no existen
        console.log('📋 Creando tablas faltantes...');

        // Tabla LegalContent
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "LegalContent" (
                "id" SERIAL NOT NULL,
                "terms" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "updatedAt" TIMESTAMP(3) NOT NULL,

                CONSTRAINT "LegalContent_pkey" PRIMARY KEY ("id")
            );
        `;

        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "LegalContent_type_key" ON "LegalContent"("type");
        `;

        // Tabla Event
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "Event" (
                "id" SERIAL NOT NULL,
                "title" TEXT NOT NULL,
                "description" TEXT NOT NULL,
                "date" TIMESTAMP(3) NOT NULL,
                "time" TEXT NOT NULL,
                "location" TEXT NOT NULL,
                "requirements" TEXT,
                "flyerUrl" TEXT,
                "capacity" INTEGER NOT NULL DEFAULT 50,
                "categories" JSONB,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
            );
        `;

        // Tabla TicketCategory
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "TicketCategory" (
                "id" SERIAL NOT NULL,
                "eventId" INTEGER NOT NULL,
                "name" TEXT NOT NULL,
                "price" INTEGER NOT NULL DEFAULT 0,
                "benefits" TEXT,
                "reservations" JSONB,

                CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
            );
        `;

        // Tabla Reservation
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "Reservation" (
                "id" SERIAL NOT NULL,
                "userId" INTEGER NOT NULL,
                "categoryId" INTEGER NOT NULL,
                "qrCode" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
            );
        `;

        // Tabla Attachment
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "Attachment" (
                "id" SERIAL NOT NULL,
                "name" TEXT NOT NULL,
                "url" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "postId" INTEGER NOT NULL,

                CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
            );
        `;

        // Tabla Subscription
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "Subscription" (
                "id" SERIAL NOT NULL,
                "userId" INTEGER NOT NULL,
                "postId" INTEGER NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
            );
        `;

        // Tabla Reaction
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "Reaction" (
                "id" SERIAL NOT NULL,
                "type" TEXT NOT NULL,
                "userId" INTEGER NOT NULL,
                "postId" INTEGER NOT NULL,

                CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
            );
        `;

        // Crear índices únicos faltantes
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_userId_productId_key" ON "Wishlist"("userId", "productId");
        `;
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderId_key" ON "Review"("orderId");
        `;
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_postId_key" ON "Subscription"("userId", "postId");
        `;
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "Reaction_userId_postId_key" ON "Reaction"("userId", "postId");
        `;

        console.log('✅ Campos y tablas faltantes agregados exitosamente!');
        console.log('🎉 La base de datos ahora está sincronizada con el schema de Prisma.');

    } catch (error) {
        console.error('❌ Error agregando campos faltantes:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
if (require.main === module) {
    addMissingFields()
        .then(() => {
            console.log('✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script falló:', error);
            process.exit(1);
        });
}

module.exports = { addMissingFields };