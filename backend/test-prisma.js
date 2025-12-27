import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Prisma initialized');

async function test() {
    try {
        await prisma.$connect();
        console.log('Connected to database');
        const users = await prisma.user.findMany();
        console.log('Users:', users);
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();
