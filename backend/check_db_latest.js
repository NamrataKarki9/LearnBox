import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching last 3 resources...');
    const resources = await prisma.resource.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        fileType: true,
        createdAt: true
      },
    });

    console.log('--- LATEST RESOURCES ---');
    resources.forEach((res) => {
      console.log(`ID: ${res.id}`);
      console.log(`Title: ${res.title}`);
      console.log(`URL: ${res.fileUrl}`);
      console.log(`Type: ${res.fileType}`);
      console.log('---');
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();