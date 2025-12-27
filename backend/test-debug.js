import 'dotenv/config';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

import { PrismaClient } from '@prisma/client';

try {
    const prisma = new PrismaClient({
        errorFormat: 'pretty',
        log: ['query', 'info', 'warn', 'error'],
    });

    console.log('Prisma client created successfully');

    await prisma.$connect();
    console.log('Connected to database');

    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);

    await prisma.$disconnect();
    console.log('Disconnected from database');

    process.exit(0);
} catch (error) {
    console.error('Full error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
}
