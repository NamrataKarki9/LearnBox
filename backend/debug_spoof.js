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

async function testSpoof() {
    const dummyPath = path.join(__dirname, 'test_spoof.txt'); // Look like text
    const validPdfContent = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    fs.writeFileSync(dummyPath, validPdfContent);

    try {
        console.log('--- TEST 7: Extension Spoofing ---');
        const result = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_spoof',
            resource_type: 'raw',
            type: 'upload',
            public_id: 'spoofed_pdf_as_txt', // Force name
            use_filename: true,
            unique_filename: false,
            // Force Cloudinary to think it is txt?
            format: 'txt' 
        });
        
        console.log('URL:', result.secure_url); // Should end in .txt
        
        await checkUrl(result.secure_url, 'Spoofed TXT');
        
        // Cleanup
        await cloudinary.uploader.destroy(result.public_id, { resource_type: 'raw' });

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

testSpoof();