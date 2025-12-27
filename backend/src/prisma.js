import './config.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

// Don't throw error here - let it fail when actually connecting
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test database connection
export async function connectDatabase() {
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined in .env file');
        return false;
    }
    
    try {
        await prisma.$connect();
        console.log('✅ Successfully connected to the database');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to the database:', error.message);
        return false;
    }
}

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

export default prisma;
