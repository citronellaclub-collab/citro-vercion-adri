require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnose() {
    console.log('🔍 Starting Diagnosis...');

    // 1. Check Env
    console.log('1. Checking Environment Variables...');
    if (!process.env.JWT_SECRET) {
        console.error('❌ CRITICAL: JWT_SECRET is missing in process.env');
    } else {
        console.log('✅ JWT_SECRET is present');
    }

    if (!process.env.DATABASE_URL) {
        console.error('❌ CRITICAL: DATABASE_URL is missing');
    } else {
        console.log('✅ DATABASE_URL is present');
    }

    // 2. Check Database Connection
    console.log('\n2. Checking Database Connection...');
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        console.log(`✅ Database connected. Users in DB: ${userCount}`);
    } catch (e) {
        console.error('❌ Database connection failed:', e.message);
        process.exit(1);
    }

    // 3. Check Bcrypt
    console.log('\n3. Checking Bcrypt...');
    try {
        const hash = await bcrypt.hash('test1234', 10);
        console.log('✅ Bcrypt hashing working');
        const valid = await bcrypt.compare('test1234', hash);
        console.log('✅ Bcrypt comparison working:', valid);
    } catch (e) {
        console.error('❌ Bcrypt failed:', e);
    }

    // 4. Simulate Register & Login Flow
    console.log('\n4. Simulating Register & Login...');
    const testEmail = 'diagnose_' + Date.now() + '@test.com';
    const testUser = 'diagnose_' + Date.now();
    const testPass = 'password123';

    try {
        // Create User
        const hash = await bcrypt.hash(testPass, 10);
        const user = await prisma.user.create({
            data: {
                username: testUser,
                email: testEmail,
                password: hash,
                role: 'USER',
                isVerified: true,
                emailVerified: true
            }
        });
        console.log('✅ User created:', user.username);

        // Simulate Login Logic (Mimic authController)
        const foundUser = await prisma.user.findFirst({
            where: { email: testEmail }
        });

        if (!foundUser) throw new Error('User not found after creation');

        const validPass = await bcrypt.compare(testPass, foundUser.password);
        if (!validPass) throw new Error('Password mismatch');

        const token = jwt.sign(
            { id: foundUser.id, role: foundUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('✅ Token generated successfully');
        console.log('🎉 DIAGNOSIS VALID: The code logic works in this environment.');

        // Cleanup
        await prisma.user.delete({ where: { id: foundUser.id } });
        console.log('🧹 Cleanup done.');

    } catch (e) {
        console.error('❌ Simulation failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
