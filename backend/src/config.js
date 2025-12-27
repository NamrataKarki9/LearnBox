import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root directory
const envPath = join(__dirname, '..', '.env');

console.log('🔍 Looking for .env at:', envPath);
console.log('📁 .env file exists:', existsSync(envPath));

// Read the file content directly
const fileContent = readFileSync(envPath, 'utf8');
console.log('📄 .env file content:');
console.log(fileContent);
console.log('---END OF FILE---');

const result = config({ path: envPath });

if (result.error) {
    console.error('❌ Error loading .env:', result.error);
} else {
    console.log('✅ .env file loaded successfully');
    console.log('📦 Parsed variables:', result.parsed);
}

// Verify it loaded
console.log('🔑 DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
console.log('🔑 PORT:', process.env.PORT || 'NOT SET');
console.log('🔑 All env keys:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PORT') || k.includes('TOKEN')));

