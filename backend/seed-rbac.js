/**
 * Database Seed Script
 * Creates initial data including SUPER_ADMIN, colleges, and sample data
 * 
 * Run: node seed-rbac.js
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    try {
        // 1. Create Colleges
        console.log('📚 Creating colleges...');
        const colleges = await Promise.all([
            prisma.college.upsert({
                where: { code: 'ISLINGTON' },
                update: {},
                create: {
                    name: 'Islington College',
                    code: 'ISLINGTON',
                    location: 'Kathmandu, Nepal',
                    description: 'Affiliated with London Metropolitan University',
                    isActive: true
                }
            }),
            prisma.college.upsert({
                where: { code: 'HERALD' },
                update: {},
                create: {
                    name: 'Herald College',
                    code: 'HERALD',
                    location: 'Kathmandu, Nepal',
                    description: 'Affiliated with University of Wolverhampton',
                    isActive: true
                }
            }),
            prisma.college.upsert({
                where: { code: 'INFORMATICS' },
                update: {},
                create: {
                    name: 'Informatics College',
                    code: 'INFORMATICS',
                    location: 'Kathmandu, Nepal',
                    description: 'Leading IT education institution',
                    isActive: true
                }
            }),
            prisma.college.upsert({
                where: { code: 'SOFTWARICA' },
                update: {},
                create: {
                    name: 'Softwarica College',
                    code: 'SOFTWARICA',
                    location: 'Kathmandu, Nepal',
                    description: 'Affiliated with Coventry University',
                    isActive: true
                }
            })
        ]);
        console.log(`✅ Created ${colleges.length} colleges\n`);

        // 2. Create SUPER_ADMIN
        console.log('👑 Creating SUPER_ADMIN...');
        const superAdminPassword = await bcrypt.hash('namu123$', 10);
        const superAdmin = await prisma.user.upsert({
            where: { email: 'karkinamrata030@gmail.com' },
            update: {
                password: superAdminPassword,
                is_verified: true,
                role: 'SUPER_ADMIN',
                collegeId: null
            },
            create: {
                username: 'namratakarkisuperadmin',
                email: 'karkinamrata030@gmail.com',
                password: superAdminPassword,
                first_name: 'Super',
                last_name: 'Admin',
                role: 'SUPER_ADMIN',
                is_verified: true, // Seed users are pre-verified
                collegeId: null // SUPER_ADMIN has no college assignment
            }
        });
        console.log('✅ SUPER_ADMIN created');
        console.log(`   Email: karkinamrata030@gmail.com`);
        console.log(`   Password: namu123$\n`);

        // 3. Create COLLEGE_ADMIN for Islington
        console.log('👨‍💼 Creating COLLEGE_ADMIN...');
        const adminPassword = await bcrypt.hash('aayu123$', 10);
        
        const islingtonAdmin = await prisma.user.upsert({
            where: { email: 'aayushakandel46@gmail.com' },
            update: {
                password: adminPassword,
                is_verified: true,
                role: 'COLLEGE_ADMIN',
                collegeId: colleges[0].id
            },
            create: {
                username: 'aayushakandeladmin',
                email: 'aayushakandel46@gmail.com',
                password: adminPassword,
                first_name: 'Aayusha',
                last_name: 'Kandel',
                role: 'COLLEGE_ADMIN',
                is_verified: true,
                collegeId: colleges[0].id
            }
        });

        console.log('✅ COLLEGE_ADMIN created');
        console.log(`   Islington Admin - Email: aayushakandel46@gmail.com, Password: aayu123$\n`);

        // 4. Create sample modules
        console.log('📖 Creating sample modules...');
        const modules = await Promise.all([
            prisma.module.create({
                data: {
                    name: 'Introduction to Computer Science',
                    code: 'CS101',
                    description: 'Basic programming concepts',
                    collegeId: colleges[0].id,
                    createdBy: islingtonAdmin.id
                }
            })
        ]);
        console.log(`✅ Created ${modules.length} module\n`);

        // 5. Create sample MCQs
        console.log('❓ Creating sample MCQs...');
        await prisma.mCQ.create({
            data: {
                question: 'What is the time complexity of binary search?',
                options: JSON.stringify(['O(n)', 'O(log n)', 'O(n^2)', 'O(1)']),
                correctAnswer: 'O(log n)',
                explanation: 'Binary search divides the search space in half each iteration',
                difficulty: 'MEDIUM',
                moduleId: modules[0].id,
                collegeId: colleges[0].id,
                createdBy: islingtonAdmin.id
            }
        });
        console.log('✅ Created sample MCQ\n');

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('📝 Summary of created accounts:');
        console.log('================================');
        console.log('SUPER_ADMIN:');
        console.log('  Email: karkinamrata030@gmail.com');
        console.log('  Password: namu123$');
        console.log('');
        console.log('COLLEGE_ADMIN (Islington):');
        console.log('  Email: aayushakandel46@gmail.com');
        console.log('  Password: aayu123$');
        console.log('');
        console.log('Note: Students can register via the public registration page.');
        console.log('================================\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
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
