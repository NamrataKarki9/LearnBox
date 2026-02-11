/**
 * Seed Modules for all Faculties and Years
 * Run this after seeding faculties
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Module definitions by Faculty and Year
const modulesData = {
  'AI': {
    1: [
      { name: 'Calculus and Linear Algebra', code: 'AI-Y1-M1' },
      { name: 'Introduction to Information Systems', code: 'AI-Y1-M2' },
      { name: 'Fundamental of Computing', code: 'AI-Y1-M3' },
      { name: 'Programming and IoT', code: 'AI-Y1-M4' }
    ],
    2: [
      { name: 'Data Structure and Specialist Programming', code: 'AI-Y2-M1' },
      { name: 'Software Engineering', code: 'AI-Y2-M2' },
      { name: 'Database', code: 'AI-Y2-M3' },
      { name: 'Probability and Statistics', code: 'AI-Y2-M4' },
      { name: 'Further Calculus and Applied Data Science', code: 'AI-Y2-M5' }
    ],
    3: [
      { name: 'Final Year Project', code: 'AI-Y3-M1' },
      { name: 'Big Data and Data Mining', code: 'AI-Y3-M2' },
      { name: 'Career Development Learning', code: 'AI-Y3-M3' },
      { name: 'Artificial Intelligence', code: 'AI-Y3-M4' },
      { name: 'Computer Vision', code: 'AI-Y3-M5' },
      { name: 'Applied Machine Learning', code: 'AI-Y3-M6' }
    ]
  },
  'COMPUTING': {
    1: [
      { name: 'Programming', code: 'COMP-Y1-M1' },
      { name: 'Fundamental of Computing', code: 'COMP-Y1-M2' },
      { name: 'Introduction to Information System', code: 'COMP-Y1-M3' },
      { name: 'Logic and Problem Solving', code: 'COMP-Y1-M4' },
      { name: 'Computer Hardware and Software Architectures', code: 'COMP-Y1-M5' }
    ],
    2: [
      { name: 'Databases', code: 'COMP-Y2-M1' },
      { name: 'Software Engineering', code: 'COMP-Y2-M2' },
      { name: 'Network Operating Systems', code: 'COMP-Y2-M3' },
      { name: 'Advanced Programming and Technologies', code: 'COMP-Y2-M4' },
      { name: 'Professional and Ethical Issues', code: 'COMP-Y2-M5' },
      { name: 'Cloud Computing and Internet of Things', code: 'COMP-Y2-M6' },
      { name: 'Smart Data Discovery', code: 'COMP-Y2-M7' }
    ],
    3: [
      { name: 'Data and Web Development', code: 'COMP-Y3-M1' },
      { name: 'Final Year Project', code: 'COMP-Y3-M2' },
      { name: 'Application Development', code: 'COMP-Y3-M3' },
      { name: 'Career Development Learning', code: 'COMP-Y3-M4' },
      { name: 'Artificial Intelligence', code: 'COMP-Y3-M5' }
    ]
  },
  'MULTIMEDIA': {
    1: [
      { name: 'Introduction to Information Systems', code: 'MM-Y1-M1' },
      { name: 'Digital Design and Image Making', code: 'MM-Y1-M2' },
      { name: 'Fundamentals of Computing', code: 'MM-Y1-M3' },
      { name: '3D Modelling', code: 'MM-Y1-M4' },
      { name: 'Introduction to Drawing and Animation', code: 'MM-Y1-M5' }
    ],
    2: [
      { name: 'Moving Image and VFX', code: 'MM-Y2-M1' },
      { name: 'Modelling and Texturing', code: 'MM-Y2-M2' },
      { name: 'Advanced 3D Modelling and Animation', code: 'MM-Y2-M3' },
      { name: 'Designing for Web and Mobile', code: 'MM-Y2-M4' }
    ],
    3: [
      { name: 'Digital Media Project', code: 'MM-Y3-M1' },
      { name: 'Career Development Learning', code: 'MM-Y3-M2' },
      { name: 'Project Research and Planning', code: 'MM-Y3-M3' },
      { name: 'Sound Design and Music Production', code: 'MM-Y3-M4' },
      { name: 'Visual Effects for Computer Graphics and Games', code: 'MM-Y3-M5' }
    ]
  },
  'NETWORKING': {
    1: [
      { name: 'Programming', code: 'NET-Y1-M1' },
      { name: 'Fundamentals of Computing', code: 'NET-Y1-M2' },
      { name: 'Introduction to Information System', code: 'NET-Y1-M3' },
      { name: 'Cyber Security Fundamentals', code: 'NET-Y1-M4' },
      { name: 'Introduction to Networks', code: 'NET-Y1-M5' }
    ],
    2: [
      { name: 'Switching Routing and Wireless Essentials', code: 'NET-Y2-M1' },
      { name: 'Cloud Computing and Internet of Things', code: 'NET-Y2-M2' },
      { name: 'Cyber Security in Computing', code: 'NET-Y2-M3' },
      { name: 'Risk, Crisis and Security Management', code: 'NET-Y2-M4' },
      { name: 'Operating System', code: 'NET-Y2-M5' },
      { name: 'Professional and Ethical Issues', code: 'NET-Y2-M6' }
    ],
    3: [] // Year 3 modules not provided
  }
};

async function seedModules() {
    try {
        console.log('Starting module seeding...');

        // Get all colleges
        const colleges = await prisma.college.findMany();

        if (colleges.length === 0) {
            console.log('No colleges found. Please seed colleges first.');
            return;
        }

        let totalCreated = 0;

        // For each college, create modules for all faculties
        for (const college of colleges) {
            console.log(`\nSeeding modules for ${college.name}...`);

            // Get faculties for this college
            const faculties = await prisma.faculty.findMany({
                where: { collegeId: college.id }
            });

            // Get a college admin to be the creator
            const admin = await prisma.user.findFirst({
                where: {
                    collegeId: college.id,
                    role: 'COLLEGE_ADMIN'
                }
            });

            if (!admin) {
                console.log(`  ⚠️  No admin found for ${college.name}, skipping...`);
                continue;
            }

            for (const faculty of faculties) {
                const facultyModules = modulesData[faculty.code];
                
                if (!facultyModules) {
                    console.log(`  ⚠️  No modules defined for faculty ${faculty.code}`);
                    continue;
                }

                console.log(`\n  Faculty: ${faculty.name} (${faculty.code})`);

                // Iterate through years 1, 2, 3
                for (let year = 1; year <= 3; year++) {
                    const yearModules = facultyModules[year];
                    
                    if (!yearModules || yearModules.length === 0) {
                        console.log(`    Year ${year}: No modules`);
                        continue;
                    }

                    console.log(`    Year ${year}:`);

                    for (const moduleData of yearModules) {
                        try {
                            // Check if module already exists
                            const existing = await prisma.module.findFirst({
                                where: {
                                    code: moduleData.code,
                                    collegeId: college.id,
                                    facultyId: faculty.id,
                                    year: year
                                }
                            });

                            if (!existing) {
                                await prisma.module.create({
                                    data: {
                                        name: moduleData.name,
                                        code: moduleData.code,
                                        year: year,
                                        facultyId: faculty.id,
                                        collegeId: college.id,
                                        createdBy: admin.id
                                    }
                                });
                                totalCreated++;
                                console.log(`      ✓ ${moduleData.name}`);
                            } else {
                                console.log(`      - ${moduleData.name} (exists)`);
                            }
                        } catch (err) {
                            console.error(`      ✗ Error creating ${moduleData.name}:`, err.message);
                        }
                    }
                }
            }
        }

        console.log(`\n✅ Module seeding complete! Created ${totalCreated} modules.`);
    } catch (error) {
        console.error('Error seeding modules:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedModules()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
