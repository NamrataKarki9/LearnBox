import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testExplicitPublic() {
    const dummyPath = path.join(__dirname, 'valid_test.pdf');
    const validPdfContent = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    fs.writeFileSync(dummyPath, validPdfContent);

    try {
        console.log('--- TEST 5: Explicit Public RAW ---');
        const resultRaw = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_explicit',
            resource_type: 'raw',
            type: 'upload',
            access_mode: 'public' // Explicitly set this
        });
        
        console.log('URL:', resultRaw.secure_url);
        await checkUrl(resultRaw.secure_url, 'Public RAW');
        await cloudinary.uploader.destroy(resultRaw.public_id, { resource_type: 'raw' });

    } catch (error) {
        console.error('Test Failed:', error.message);
    } finally {
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
}

function checkUrl(url, label) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            console.log(`[${label}] Status Code: ${res.statusCode}`);
            resolve();
        }).on('error', (e) => {
            console.error(`[${label}] Error:`, e.message);
            resolve();
        });
    });
}

testExplicitPublic();