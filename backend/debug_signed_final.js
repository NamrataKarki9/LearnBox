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

async function testWorkingSignedUrl() {
    const dummyPath = path.join(__dirname, 'valid_test.pdf');
    const validPdfContent = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    fs.writeFileSync(dummyPath, validPdfContent);

    try {
        console.log('--- TEST 6: Authenticated Upload + Signed URL ---');
        
        // Upload 
        const result = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_final_signed',
            resource_type: 'raw',
            type: 'authenticated'
        });
        
        console.log('Public ID:', result.public_id);
        
        // Generate Signed URL
        // Important: "authenticated" type resources need "sign_url" to work? 
        // Or simply `cloudinary.url` with 'authenticated' type and auth_token/signature?
        
        // Approach A: using cloudinary.url helpers
        // The URL needs a signature component /s--SIGNATURE--/
        
        const signedUrl = cloudinary.url(result.public_id, {
            resource_type: 'raw',
            type: 'authenticated',
            secure: true,
            sign_url: true, // This enables signature generation?
            // "For private images, the signature is required."
            // "For authenticated assets, access is control via... signature or cookie."
            auth_token: { 
                // Creating a time-limited token
                key: process.env.CLOUDINARY_API_KEY,
                start_time: Math.floor(Date.now() / 1000),
                duration: 3600 // 1 hour
            }
        });

        // Approach B: Standard signed URL generation (simplest)
        const simpleSignedUrl = cloudinary.url(result.public_id, {
            resource_type: 'raw',
            type: 'authenticated',
            sign_url: true,
            secure: true,
            version: result.version // Version is good practice
        });
        
        console.log('Signed URL (Simple):', simpleSignedUrl);
        await checkUrl(simpleSignedUrl, 'Signed Simple');

        // Cleanup
        await cloudinary.uploader.destroy(result.public_id, { resource_type: 'raw', type: 'authenticated' });

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

testWorkingSignedUrl();