import bcrypt from 'bcryptjs';
import prisma from './src/prisma.js';
import './src/config.js';

/**
 * Seed script to create initial SUPER_ADMIN user
 * Run this script once to initialize your platform
 * Usage: node seed.js
 */

async function seed() {
    try {
        console.log('🌱 Starting seed...');

        // Create a default college for super admin (optional)
        const platformCollege = await prisma.college.upsert({
            where: { code: 'PLATFORM' },
            update: {},
            create: {
                name: 'Platform Administration',
                code: 'PLATFORM',
                description: 'Internal platform administration college',
            },
        });
        console.log('✅ Platform college created/verified');

        // Check if super admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: {
                role: 'SUPER_ADMIN',
            },
        });

        if (existingAdmin) {
            console.log('⚠️  SUPER_ADMIN already exists:', existingAdmin.email);
            console.log('Skipping seed...');
            return;
        }

        // Create SUPER_ADMIN user
        const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

        const superAdmin = await prisma.user.create({
            data: {
                username: 'superadmin',
                email: 'superadmin@learnbox.com',
                password: hashedPassword,
                first_name: 'Super',
                last_name: 'Admin',
                role: 'SUPER_ADMIN',
                collegeId: platformCollege.id,
            },
        });

        console.log('✅ SUPER_ADMIN created successfully!');
        console.log('📧 Email:', superAdmin.email);
        console.log('🔑 Password: SuperAdmin@123');
        console.log('⚠️  IMPORTANT: Change this password immediately after first login!');
        
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .then(() => {
        console.log('🎉 Seed completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    });
