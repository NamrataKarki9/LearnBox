/**
 * Seed Faculty Data for Colleges
 * Run this after migrating the database schema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Faculties for LearnBox
const commonFaculties = [
    { name: 'Artificial Intelligence', code: 'AI' },
    { name: 'Computing', code: 'COMPUTING' },
    { name: 'Multimedia', code: 'MULTIMEDIA' },
    { name: 'Networking and IT Security', code: 'NETWORKING' }
];

async function seedFaculties() {
    try {
        console.log('Starting faculty seeding...');

        // Get all colleges
        const colleges = await prisma.college.findMany();

        if (colleges.length === 0) {
            console.log('No colleges found. Please seed colleges first.');
            return;
        }

        let totalCreated = 0;

        // Create faculties for each college
        for (const college of colleges) {
            console.log(`\nSeeding faculties for ${college.name}...`);

            for (const facultyData of commonFaculties) {
                try {
                    // Check if faculty already exists for this college
                    const existing = await prisma.faculty.findFirst({
                        where: {
                            code: facultyData.code,
                            collegeId: college.id
                        }
                    });

                    if (!existing) {
                        await prisma.faculty.create({
                            data: {
                                name: facultyData.name,
                                code: facultyData.code,
                                collegeId: college.id
                            }
                        });
                        totalCreated++;
                        console.log(`  ✓ Created faculty: ${facultyData.code} - ${facultyData.name}`);
                    } else {
                        console.log(`  - Faculty ${facultyData.code} already exists`);
                    }
                } catch (err) {
                    console.error(`  ✗ Error creating faculty ${facultyData.code}:`, err.message);
                }
            }
        }

        console.log(`\n✅ Faculty seeding complete! Created ${totalCreated} faculties.`);
    } catch (error) {
        console.error('Error seeding faculties:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedFaculties()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
