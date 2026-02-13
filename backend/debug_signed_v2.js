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

async function testSignedUrl() {
    const dummyPath = path.join(__dirname, 'valid_test.pdf');
    const validPdfContent = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    fs.writeFileSync(dummyPath, validPdfContent);

    try {
        console.log('--- TEST 3: Upload as RAW (Private) ---');
        // Upload as authenticated/private
        const resultRaw = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_pdf_signed',
            resource_type: 'raw',
            type: 'authenticated'
        });
        
        console.log('Original Secure URL (Expect 401):', resultRaw.secure_url);
        
        // Correctly generate Signed URL with timestamp/auth_token
        // Cloudinary signed URLs for private resources usually just used s--signature-- part in URL.
        // The URL returned by upload() for 'authenticated' type ALREADY has the trademark signature.
        // Let's check if that one works straight away.
        // Result above: https://res.cloudinary.com/.../raw/authenticated/s--ODSew6yf--/v.../...pdf
        
        await checkUrl(resultRaw.secure_url, 'Uploaded Authenticated URL');
        
        // Cleanup
        await cloudinary.uploader.destroy(resultRaw.public_id, { resource_type: 'raw', type: 'authenticated' });

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

testSignedUrl();